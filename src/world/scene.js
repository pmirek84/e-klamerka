import * as T from 'three';
import { palette as C, material, box, ball, cylinder, group, shadow, bake, tree, house, pen, garden, shop, rabbit, person } from './models.js';
import { PLACES } from '../game.js';
import { REGIONS, regionAt, insideWorld, visiblePlace, unlocked } from './regions.js';
import { findPath } from './navigation.js';
import { buildRegions, buildWorldChanges } from './expansion.js';

export function createWorld(host, callbacks) {
  const scene=new T.Scene();scene.background=new T.Color('#cbded9');scene.fog=new T.Fog('#cbded9',110,240);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  renderer.domElement.setAttribute('aria-label','Trójwymiarowy świat farmy. Dotknij ziemi, aby podejść.');
  host.appendChild(renderer.domElement);
  scene.add(new T.HemisphereLight('#f9f1dc','#748c79',1.45));
  const sun=new T.DirectionalLight('#fff0db',2.65);sun.position.set(-12,22,9);sun.castShadow=true;
  sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-23,right:23,top:22,bottom:-22,near:1,far:65});sun.shadow.normalBias=.045;sun.shadow.bias=-.0002;scene.add(sun);scene.add(sun.target);
  const camera=new T.PerspectiveCamera(38,1,.1,260);let yaw=.35,zoom=1,overview=true,worldOverview=false;
  const look=new T.Vector3(0,0,1), desiredLook=new T.Vector3(), offset=new T.Vector3();
  let width=1,height=1, state={}, raf=0, disposed=false, last=performance.now(),time=0,lastUi=0;
  const targets=[],dynamic=group(scene),scenery=group(scene);let houseObj,penObj,gardenObj,landObj,player,worldChanges;let lastRegion=null;
  const obstacles=[...[[ -35,-4],[-31,-4],[-26,-5],[-23,-2],[-36,1],[-34,6],[-29,6],[-24,5],[25,4],[37,3],[26,-6]].map(([x,z])=>({x,z,w:.8,d:.8}))];let rabbits=[],selected=null,path=[],keys=new Set(),busyUntil=0,fx=[];
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),hitPoint=new T.Vector3();
  let seed=43;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};

  function island(parent,x,z,rx,rz) {
    const g=group(parent,x,0,z);
    const earth=cylinder(g,rx,rx*.89,2.5,'#bb9975',0,-1.35,0,32);earth.scale.z=rz/rx;
    const edge=cylinder(g,rx*1.018,rx,.38,'#d2bb8e',0,-.2,0,32);edge.scale.z=rz/rx;
    const turf=cylinder(g,rx*1.025,rx*1.015,.2,C.grass,0,-.04,0,48);turf.scale.z=rz/rx;
    for(let i=0;i<17;i++){const a=i/17*Math.PI*2;const rock=ball(g,.85,i%2?'#b8b4a2':'#a3a69b',Math.cos(a)*rx*.95,-1.45,Math.sin(a)*rz*.96,1,.9,1);rock.rotation.y=a;}
    return g;
  }
  island(scenery,0,0,13.5,11.4);
  buildRegions(scene);
  // Winding paths are geometry, and stay aligned when the camera moves.
  let trailIndex=0;
  function trail(points,width=1.35) {
    const elevation=.085+trailIndex++*.002;
    const curve=new T.CatmullRomCurve3(points.map(([x,z])=>new T.Vector3(x,elevation,z)));
    const pts=curve.getPoints(64),vertices=[],indices=[];
    pts.forEach((p,i)=>{const tangent=curve.getTangent(i/64),side=new T.Vector3(-tangent.z,0,tangent.x).multiplyScalar(width/2);
      vertices.push(p.x+side.x,p.y,p.z+side.z,p.x-side.x,p.y,p.z-side.z);
      if(i<64){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
    });
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();
    const m=new T.Mesh(geo,material('#dec190',{side:T.DoubleSide}));m.receiveShadow=true;scenery.add(m);
    for(const [x,z] of [points[0],points.at(-1)])cylinder(scenery,width/2,width/2,.008,'#dec190',x,elevation-.001,z,24);
  }
  trail([[0,10.8],[.3,7],[0,3.8],[-.7,1.8],[-1.5,-.2],[-3,-.1]],1.75);
  trail([[-9,3],[-6.5,2.4],[-3.4,2],[0,2.7],[3.2,4.7],[6.8,5.6],[11,5.6]],1.35);
  trail([[-7,-4.3],[-7.1,-1.8],[-5,.5],[-3.5,1.4]],1.1);
  trail([[0,2.7],[2,.1],[4,-2.7],[6.3,-4.2]],1.35);
  trail([[-.1,7],[-2.5,7.7],[-3.3,8]],1.2);
  trail([[-7,1],[-9,0],[-12.5,0]],1.3);
  trail([[0,1],[1,-3],[0,-6],[0,-10.5]],1.3);
  trail([[6,-3.3],[9,-3],[12.5,-3]],1.3);
  // Pond and stones sit behind the work areas.
  const pond=group(scenery,1.9,0,-7.8);
  cylinder(pond,2.7,2.7,.05,'#c5d8a8',0,.07,0,40).scale.z=.64;
  cylinder(pond,2.4,2.4,.07,'#73b9ba',0,.095,0,40).scale.z=.62;
  cylinder(pond,2.05,2.05,.02,'#8bcbcb',.08,.14,.05,40).scale.z=.56;
  for(let i=0;i<5;i++){const lily=cylinder(pond,.22,.22,.025,'#7fa55d',random()*3-1.5,.17,random()*1.4-.7);ball(pond,.07,'#f3d2cc',lily.position.x,.23,lily.position.z);}
  // Trees frame the clearing rather than obscuring its center.
  const treePositions=[[-10,-5,1.2],[-8.6,-7,1.1],[-6.7,-6.3,.95],[-11,-1.5,1],[-5.2,-8.4,1.2],[-2.8,-9.3,.95],[9.8,-1,1.1],[10,-6.6,.94],[7,-8.7,.8],[-10,7,.8],[7.5,8.3,.78],[-8,8.5,.65]];
  treePositions.forEach(([x,z,s],i)=>{const g=tree(scenery,x,z,s,i);if(i<4)g.userData.place='forest';obstacles.push({x,z,w:.9,d:.9});});
  for(let i=0;i<3;i++){const log=cylinder(scenery,.23,.23,1.6,C.wood,-7.7+i*.44,.28,-2.1,12);log.rotation.z=Math.PI/2;const end=cylinder(scenery,.18,.18,.02,'#e0bc86',-6.89+i*.44,.28,-2.1);end.rotation.z=Math.PI/2;}
  // Crystals are angular mineral meshes with actual facets.
  const mine=group(scenery,6.8,0,-5.5);mine.userData.place='mine';
  for(let i=0;i<8;i++){const a=i*2.4;const r=ball(mine,.65+(i%3)*.22,i%2?'#96a5a6':'#aab7b1',Math.cos(a)*1.4,.55,Math.sin(a),1,1+(i%3)*.35,1);r.rotation.set(i*.2,i*.4,.2);}
  for(let i=0;i<7;i++){const crystal=meshCrystal(mine,.23+(i%2)*.1,1.1+(i%3)*.4,i%2?'#92bdca':'#b1a5ce',Math.cos(i*1.9)*1.2,1,Math.sin(i*1.9)*.8);crystal.rotation.z=(i-3)*.13;}
  function meshCrystal(parent,r,h,c,x,y,z){const g=group(parent,x,y,z);cylinder(g,r,r,h*.65,c,0,h*.3,0,5);cylinder(g,0,r,h*.5,c,0,h*.87,0,5);return g;}
  obstacles.push({x:6.8,z:-5.5,w:4,d:3});
  shop(scenery);obstacles.push({x:-9,z:3.8,w:2.7,d:2.1});
  // Flowers and grass are instanced: hundreds of tufts in only a few draw calls.
  const stemGeo=new T.ConeGeometry(.065,.25,3),flowerGeo=new T.SphereGeometry(.065,5,4);
  const tufts=new T.InstancedMesh(stemGeo,material('#789e50'),450);
  const blossoms=new T.InstancedMesh(flowerGeo,material('#f4e4b3'),160);
  const transform=new T.Object3D();let flowers=0;
  for(let i=0;i<450;i++){
    const a=random()*Math.PI*2,r=.76+random()*.2,x=Math.cos(a)*13.3*r,z=Math.sin(a)*11.2*r;
    transform.position.set(x,.2,z);transform.rotation.y=random()*6;transform.scale.setScalar(.6+random());transform.updateMatrix();tufts.setMatrixAt(i,transform.matrix);
    if(flowers<160&&i%2===0){transform.position.y=.31;transform.scale.setScalar(1+random()*.8);transform.updateMatrix();blossoms.setMatrixAt(flowers++,transform.matrix);}
  }
  scenery.add(tufts,blossoms);
  // Entry bridge and a little e-klamerka pennant.
  for(let i=0;i<9;i++)box(scenery,1.8,.13,.35,C.lightWood,0,-.03,10+i*.34);
  for(const x of [-1.03,1.03])for(const z of [10,12.8]){cylinder(scenery,.12,.15,1.05,C.wood,x,.42,z);ball(scenery,.16,'#dfbd86',x,.98,z);}
  for(const x of [-1.03,1.03])box(scenery,.1,.1,2.8,C.cream,x,.75,11.4);
  for(const [cx,cz,angle] of [[-7.4,9.4,-.45],[-11.3,1.7,1.4],[10.7,6.8,.9],[6.6,-9.6,-.4]]) {
    const f=group(scenery,cx,0,cz);f.rotation.y=angle;
    for(const x of [-1.1,0,1.1]){box(f,.12,.85,.13,C.lightWood,x,.44,0);box(f,.18,.1,.19,C.cream,x,.9,0);}
    for(const y of [.36,.67])box(f,2.2,.12,.07,C.lightWood,0,y,0);
    for(const x of [-1.1,1.1]){ball(f,.38,'#61935b',x,.27,.15,1.4,.9,1);ball(f,.09,'#f0d180',x+.15,.53,.27);}
  }
  // Stacked crates and a watering can make the clearing feel lived in.
  for(let i=0;i<2;i++){box(scenery,.6,.55,.6,C.lightWood,-6,.31+i*.57,3.5);box(scenery,.64,.09,.64,C.wood,-6,.15+i*.57,3.5);box(scenery,.64,.09,.64,C.wood,-6,.52+i*.57,3.5);}
  cylinder(scenery,.22,.24,.45,'#52888d',-3.2,.3,8.3);
  const spout=cylinder(scenery,.06,.09,.5,'#52888d',-2.95,.47,8.3);spout.rotation.z=-.8;
  const handle=new T.Mesh(new T.TorusGeometry(.21,.03,6,14),material('#52888d'));handle.position.set(-3.4,.49,8.3);scenery.add(handle);
  bakeScenery(scenery);
  function bakeScenery(g){
    // Preserve raycast place metadata by merging one place at a time.
    const tagged=[];g.traverse(o=>{if(o.userData.place)tagged.push(o);});
    tagged.forEach(o=>{g.attach(o);targets.push(o);});
    const rest=group(scene);[...g.children].forEach(o=>{if(!o.userData.place&&!o.isInstancedMesh)rest.attach(o);});bake(rest);
    tagged.forEach(bake);
  }
  for(const [id,p] of Object.entries(PLACES)){
    const pick=new T.Mesh(new T.BoxGeometry(id==='pen'?5.2:id==='house'?4.5:2.6,2.8,id==='pen'?4.2:2.6),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
    pick.position.set(p.x,1.4,p.z);pick.userData.place=id;scene.add(pick);targets.push(pick);
  }
  const marker=new T.Mesh(new T.RingGeometry(.33,.41,32),new T.MeshBasicMaterial({color:'#fff6c8',side:T.DoubleSide,transparent:true,opacity:.9,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.12;marker.visible=false;scene.add(marker);
  const flag=new T.Mesh(new T.ConeGeometry(.11,.28,4),material('#ffe1a0'));scene.add(flag);flag.visible=false;
  const pos=new T.Vector3(0,0,6);

  function disposeObject(g){if(!g)return;const targetIndex=targets.indexOf(g);if(targetIndex>=0)targets.splice(targetIndex,1);g.traverse(o=>{if(o.isMesh&&o.geometry && !o.isInstancedMesh&&!o.material.transparent)o.geometry.dispose();});g.removeFromParent();}
  function setGame(next){
    const prev=state;state=next;
    const oldWorld=prev.world||{},newWorld=next.world||{};
    if(!worldChanges||['quarry','meadow','orchard','windmill','chest'].some(k=>oldWorld[k]!==newWorld[k])){
      if(worldChanges)disposeObject(worldChanges.root);worldChanges=buildWorldChanges(dynamic,next);
    }
    if(!houseObj||prev.houseLevel!==next.houseLevel){disposeObject(houseObj);houseObj=house(dynamic,next.houseLevel);targets.push(houseObj);}
    if(!penObj||prev.pen!==next.pen){disposeObject(penObj);penObj=pen(dynamic,next.pen);}
    if(!gardenObj||prev.planted!==next.planted||prev.watered!==next.watered||prev.landLevel!==next.landLevel){disposeObject(gardenObj);gardenObj=garden(dynamic,next);targets.push(gardenObj);}
    if(!landObj||prev.landLevel!==next.landLevel){
      disposeObject(landObj);landObj=group(dynamic);
      for(let i=0;i<next.landLevel;i++)island(landObj,13+i*2.8,4.8,3,4);
      if(next.landLevel)trail([[10,5.7],[12,6.8],[14+(next.landLevel-1)*2.8,6.8]],1.2);
      bake(landObj);
    }
    if(!player||prev.avatar!==next.avatar){if(player)player.root.removeFromParent();player=person(scene,next.avatar);player.root.position.copy(pos);}
    // Construction can enlarge an obstacle around a player who acted before reaching the marker.
    // Move to the closest free point so an upgrade can never trap the avatar.
    if(!walkable(pos.x,pos.z)){
      let safe=null;
      for(let r=.35;r<5&&!safe;r+=.35)for(let i=0;i<24;i++){
        const x=pos.x+Math.cos(i/24*Math.PI*2)*r,z=pos.z+Math.sin(i/24*Math.PI*2)*r;
        if(walkable(x,z)){safe={x,z};break;}
      }
      if(safe){pos.set(safe.x,0,safe.z);player.root.position.copy(pos);path=[];}
    }
    const n=next.rabbits&&next.pen?2+Math.min(next.babies,10):0;
    while(rabbits.length>n){rabbits.pop().root.removeFromParent();}
    while(rabbits.length<n){const i=rabbits.length,r=rabbit(scene,i,i>=2);r.root.position.set(4.1+random()*2.3,0,2.1+random()*1.4);r.from=r.root.position.clone();r.to=r.from.clone();r.next=time+random()*1.2;r.started=0;r.duration=.8;rabbits.push(r);}
  }
  function inside(x,z){return insideWorld(x,z,state);}
  function walkable(x,z){
    if(!inside(x,z))return false;
    const blocks=[...obstacles,{x:1,z:-30,w:4.6,d:3.4},...(state.world?.windmill?[{x:34,z:-4,w:2.7,d:2.7}]:[]),{x:state.houseLevel>=3?-2.15:-3,z:state.houseLevel>=3?-1.8:-2,w:state.houseLevel>=3?6.5:4.6,d:state.houseLevel>=3?4.5:3.8},...(state.pen?[{x:5.3,z:2.3,w:5.2,d:4.2}]:[])];
    return !blocks.some(b=>Math.abs(x-b.x)<b.w/2+.3&&Math.abs(z-b.z)<b.d/2+.3);
  }
  function route(x,z){return findPath([pos.x,pos.z],[x,z],walkable).map(([px,pz])=>new T.Vector3(px,0,pz));}
  function select(id){if(PLACES[id]?.region&&!unlocked(PLACES[id].region,state))id=REGIONS[PLACES[id].region].gate;worldOverview=false;selected=id;callbacks.onSelect(id);if(!id)return;const p=PLACES[id];path=route(...p.approach);marker.position.set(...[p.approach[0],.12,p.approach[1]]);marker.visible=true;overview=false;}
  function goTo(x,z){worldOverview=false;path=route(x,z);if(path.length){const end=path.at(-1);marker.position.set(end.x,.12,end.z);marker.visible=true;}overview=false;}
  function project(v){const p=new T.Vector3(...v).project(camera);return {x:(p.x*.5+.5)*width,y:(-.5*p.y+.5)*height,visible:p.z<1&&Math.abs(p.x)<.95&&Math.abs(p.y)<.92};}
  function positionCamera(dt){
    const region=REGIONS[regionAt(pos.x,pos.z)||lastRegion||'farm'];
    desiredLook.set(worldOverview?0:overview?region.x:pos.x,0,worldOverview?-9:overview?region.z:pos.z-1.5);
    look.lerp(desiredLook,1-Math.exp(-dt*3));
    const portrait=width/height<.8;
    const distance=(worldOverview?(portrait?180:108):overview?(portrait?72:36):(portrait?34:25))*zoom;
    offset.set(Math.sin(yaw)*distance*.82,distance*.65,Math.cos(yaw)*distance*.82);
    sun.position.set(pos.x-12,22,pos.z+9);sun.target.position.set(pos.x,0,pos.z);camera.position.copy(look).add(offset);camera.lookAt(look);camera.updateMatrixWorld();
  }
  let firstResize=true;
  function resize(){width=host.clientWidth;height=host.clientHeight;if(firstResize&&width/height<.8){overview=false;look.set(0,0,4.4);}firstResize=false;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();positionCamera(10);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function turn(d){yaw+=d;overview=false;worldOverview=false;}
  function setZoom(d){zoom=T.MathUtils.clamp(zoom+d,.58,1.45);}
  const pointerDown=new Map();let drag=null,pinch=null,lastGestureRoute=0;
  const suppressed=new Set();
  function screenRay(x,y){const rect=renderer.domElement.getBoundingClientRect();pointer.set((x-rect.left)/width*2-1,-(y-rect.top)/height*2+1);raycaster.setFromCamera(pointer,camera);}
  function guideFinger(e){screenRay(e.clientX,e.clientY);if(raycaster.ray.intersectPlane(ground,hitPoint)&&inside(hitPoint.x,hitPoint.z))goTo(hitPoint.x,hitPoint.z);}
  function down(e){
    pointerDown.set(e.pointerId,{x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY});
    renderer.domElement.setPointerCapture(e.pointerId);
    if(e.button>0)drag={x:e.clientX,y:e.clientY};
    if(pointerDown.size===2){
      const a=[...pointerDown.values()];pinch={distance:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),angle:Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),zoom,yaw};
      pointerDown.forEach((_,id)=>suppressed.add(id));path=[];drag=null;
    }
  }
  function move(e){
    const p=pointerDown.get(e.pointerId);if(!p)return;
    pointerDown.set(e.pointerId,{...p,x:e.clientX,y:e.clientY});
    if(pointerDown.size===2&&pinch){
      const a=[...pointerDown.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),angle=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x);
      zoom=T.MathUtils.clamp(pinch.zoom*pinch.distance/Math.max(1,d),.58,1.45);
      yaw=pinch.yaw-Math.atan2(Math.sin(angle-pinch.angle),Math.cos(angle-pinch.angle));return;
    }
    if(pinch||suppressed.has(e.pointerId))return;
    if(drag){yaw-=(e.clientX-drag.x)*.009;drag={x:e.clientX,y:e.clientY};overview=false;return;}
    if(Math.hypot(e.clientX-p.startX,e.clientY-p.startY)>9&&performance.now()-lastGestureRoute>150){guideFinger(e);lastGestureRoute=performance.now();}
  }
  function up(e){
    const start=pointerDown.get(e.pointerId),multi=suppressed.has(e.pointerId)||!!pinch;
    pointerDown.delete(e.pointerId);suppressed.delete(e.pointerId);drag=null;if(!pointerDown.size)pinch=null;
    if(multi||!start||e.button>0)return;
    if(Math.hypot(e.clientX-start.startX,e.clientY-start.startY)>9){guideFinger(e);return;}
    screenRay(e.clientX,e.clientY);
    const hits=raycaster.intersectObjects(targets,true);if(hits.length){let o=hits[0].object;while(o&&!o.userData.place)o=o.parent;if(o?.userData.place){select(o.userData.place);return;}}
    if(raycaster.ray.intersectPlane(ground,hitPoint))goTo(hitPoint.x,hitPoint.z);
  }
  function wheel(e){e.preventDefault();setZoom(e.deltaY*.0007);}
  function context(e){e.preventDefault();}
  function keyDown(e){if(e.target.closest('input,textarea,[role="dialog"]'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='e'&&!e.repeat)callbacks.onAction();}
  function keyUp(e){keys.delete(e.key.toLowerCase());}
  function clearInput(){keys.clear();pointerDown.clear();suppressed.clear();drag=null;pinch=null;}
  function visibility(){clearInput();last=performance.now();if(document.hidden){cancelAnimationFrame(raf);raf=0;}else if(!raf&&!disposed)raf=requestAnimationFrame(frame);}
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',clearInput);canvas.addEventListener('wheel',wheel,{passive:false});canvas.addEventListener('contextmenu',context);
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',visibility);
  let autoActTarget = null;
  function performDirectAction(placeId) {
    if (!placeId) return;
    select(placeId);
    const p = PLACES[placeId];
    if (!p) return;
    const d = Math.hypot(pos.x - p.approach[0], pos.z - p.approach[1]);
    if (d < 1.75) {
      callbacks.onAction?.();
    } else {
      autoActTarget = placeId;
    }
  }

  function dblclick(e) {
    e.preventDefault();
    screenRay(e.clientX, e.clientY);
    const hits = raycaster.intersectObjects(targets, true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.place) o = o.parent;
      if (o?.userData.place) {
        performDirectAction(o.userData.place);
        return;
      }
    }
    if (selected) {
      performDirectAction(selected);
    }
  }
  canvas.addEventListener('dblclick', dblclick);

  function burst(x,z,color){for(let i=0;i<9;i++){const m=box(scene,.12,.12,.12,color,x,.55,z);fx.push({m,v:new T.Vector3((random()-.5)*2,2+random()*2,(random()-.5)*2),end:time+.75});}}
  function animateAction(kind){busyUntil=time+1.1;path=[];const p=PLACES[selected];burst(pos.x,pos.z,kind==='mine'?'#a6c7dc':kind==='garden'?'#e9b668':'#f6d68a');}
  let paused=false, frameTime=16, lastTapTime = 0, lastTapTarget = null;
  function frame(now){
    if(disposed)return;frameTime=frameTime*.9+(now-last)*.1;const dt=Math.min(.1,(now-last)/1000);last=now;time+=dt;
    let dx=0,dz=0,speed=0;
    if(player&&!paused&&time>busyUntil){
      const inputX=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      const inputZ=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      if(inputX||inputZ){path=[];overview=false;worldOverview=false;const length=Math.max(1,Math.hypot(inputX,inputZ));dx=(inputX*Math.cos(yaw)+inputZ*Math.sin(yaw))/length;dz=(-inputX*Math.sin(yaw)+inputZ*Math.cos(yaw))/length;}
      else if(path.length){const v=path[0].clone().sub(pos);if(v.length()<.15)path.shift();else{v.normalize();dx=v.x;dz=v.z;}}
      const ox=pos.x,oz=pos.z,step=Math.min(dt*3.1,path.length?pos.distanceTo(path[0]):Infinity);
      if(walkable(pos.x+dx*step,pos.z))pos.x+=dx*step;
      if(walkable(pos.x,pos.z+dz*step))pos.z+=dz*step;
      speed=Math.hypot(pos.x-ox,pos.z-oz)/Math.max(dt,.001);
    }
    if(player){
      player.root.position.copy(pos);
      const moving=speed>.04;
      player.update({ moving, speed, dx, dz, time, cameraYaw: yaw, busy: time < busyUntil });
    }

    if(autoActTarget){
      const p=PLACES[autoActTarget];
      if(p){
        const d=Math.hypot(pos.x-p.approach[0],pos.z-p.approach[1]);
        if(d<1.75||path.length===0){
          autoActTarget=null;
          callbacks.onAction?.();
        }
      } else { autoActTarget=null; }
    }

    if(worldChanges?.rotor)worldChanges.rotor.rotation.z-=dt*.6;
    for(const r of rabbits){
      if(time>r.next){r.from.copy(r.root.position);r.to.set(3.5+random()*3.5,0,2.25+random()*1.65);r.started=time;r.duration=.6+r.from.distanceTo(r.to)*.2;r.next=time+r.duration+1.2+random()*2.2;r.root.rotation.y=Math.atan2(r.to.x-r.from.x,r.to.z-r.from.z);}
      const u=T.MathUtils.clamp((time-r.started)/r.duration,0,1),hopping=u<1&&r.started>0;
      if(hopping){r.root.position.lerpVectors(r.from,r.to,u);r.body.position.y=Math.abs(Math.sin(u*Math.PI*2))*.25;}
      else r.body.position.y=Math.sin(time*2+r.phase)*.015;
      r.ears.forEach((ear,i)=>ear.rotation.x=Math.sin(time*(hopping?12:2)+r.phase+i*.5)*(hopping?.25:.09));
      r.feet.forEach((foot,i)=>foot.rotation.x=hopping?Math.sin(u*Math.PI*4+i)*.55:0);
    }
    fx=fx.filter(f=>{f.m.position.addScaledVector(f.v,dt);f.v.y-=8*dt;f.m.rotation.x+=dt*4;if(time>f.end){f.m.removeFromParent();return false;}return true;});
    if(marker.visible){marker.scale.setScalar(1+Math.sin(time*3)*.1);if(!path.length)marker.material.opacity=.3;else marker.material.opacity=.9;}
    if(player){flag.visible=true;flag.position.set(pos.x,2.55+Math.sin(time*2)*.05,pos.z);flag.rotation.z=Math.PI;}
    positionCamera(dt);

    // 60 FPS Direct Label Synchronization (Eliminates DOM lag and wobble)
    const labelWrap = host.querySelector('.world-labels');
    if (labelWrap) {
      for (const [id, p] of Object.entries(PLACES)) {
        if (!visiblePlace(p, state)) continue;
        const btn = labelWrap.querySelector(`[data-place="${id}"]`);
        if (btn) {
          const sPos = project(p.label);
          if (sPos.visible) {
            btn.style.display = 'flex';
            btn.style.transform = `translate3d(${sPos.x.toFixed(1)}px, ${sPos.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
          } else {
            btn.style.display = 'none';
          }
        }
      }
    }

    if(now-lastUi>100){
      let nearest=null,dist=Infinity;
      for(const [id,p] of Object.entries(PLACES)){if(!visiblePlace(p,state))continue;const d=Math.hypot(pos.x-p.approach[0],pos.z-p.approach[1]);if(d<dist){nearest=id;dist=d;}}
      const currentRegion=regionAt(pos.x,pos.z);
      if(currentRegion&&currentRegion!==lastRegion){lastRegion=currentRegion;callbacks.onRegion?.(currentRegion);}
      callbacks.onFrame({region:lastRegion||'farm',position:[pos.x,pos.z],destination:selected,near:dist<1.65?nearest:null,moving:speed>.04,busy:time<busyUntil,labels:Object.fromEntries(Object.entries(PLACES).filter(([,p])=>visiblePlace(p,state)).map(([id,p])=>[id,project(p.label)]))});lastUi=now;
    }
    renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  const api={setGame,select,performDirectAction,turn,zoom:setZoom,home(){worldOverview=false;overview=true;zoom=1;yaw=.35;},worldView(){worldOverview=true;overview=true;zoom=1;yaw=.12;},returnHome(){select('house');},stop(){path=[];selected=null;callbacks.onSelect(null);marker.visible=false;},follow(){overview=false;},pause(value){paused=value;clearInput();},animateAction,
    inspect(){return {region:lastRegion,routeLength:path.length,position:pos.toArray(),routeTo:(x,z)=>route(x,z).map(p=>p.toArray()),inside:(x,z)=>inside(x,z),camera:{yaw,zoom},fps:Math.round(1000/frameTime),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,houseLevel:state.houseLevel,project:(point)=>project(point)};},
    destroy(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clearInput);canvas.removeEventListener('dblclick',dblclick);document.removeEventListener('visibilitychange',visibility);scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer.dispose();canvas.remove();}
  };
  return api;
}

