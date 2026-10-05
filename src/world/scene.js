import * as T from 'three';
import { palette as C, material, box, ball, cylinder, group, bake, tree, house, pen, garden, shop, rabbit, person, stall, helper, visitor, owl, windowGlass } from './models.js';
import { PLACES } from '../game.js';
import { REGIONS, regionAt, insideWorld, visiblePlace, unlocked } from './regions.js';
import { findPath } from './navigation.js';
import { buildRegions, buildWorldChanges } from './expansion.js';
import { U, detectQuality } from './shared.js';
import { buildTerrain, GRID } from './terrain.js';
import { grassField, flowerField } from './nature.js';
import { createSky } from './sky.js';
import { createAmbient, LANTERNS, CAMPFIRE } from './ambient.js';
import { createAudio } from './audio.js';
import { createPost } from './post.js';

export function createWorld(host, callbacks) {
  let quality = detectQuality();
  const scene=new T.Scene();scene.fog=new T.Fog('#d2ebf6',40,140);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  const maxRatio=quality==='low'?1.25:2;
  renderer.setPixelRatio(Math.min(devicePixelRatio,maxRatio));renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.0;
  renderer.domElement.setAttribute('aria-label','Trójwymiarowy świat farmy. Dotknij ziemi, aby podejść.');
  host.appendChild(renderer.domElement);
  const hemi=new T.HemisphereLight('#e8f6ff','#7b9b60',1.45);scene.add(hemi);
  const sun=new T.DirectionalLight('#fffaf0',3);sun.castShadow=true;
  const shadowSize=quality==='low'?1024:2048;
  sun.shadow.mapSize.set(shadowSize,shadowSize);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:120});sun.shadow.normalBias=.04;sun.shadow.bias=-.0003;scene.add(sun);scene.add(sun.target);
  const camera=new T.PerspectiveCamera(42,1,.1,900);let yaw=.35,zoom=1,targetZoom=1,overview=false,worldOverview=false;
  const look=new T.Vector3(0,1,6), desiredLook=new T.Vector3(), offset=new T.Vector3();
  let width=1,height=1, state={}, raf=0, disposed=false, last=performance.now(),time=0,lastUi=0;
  const targets=[],dynamic=group(scene),scenery=group(scene);let houseObj,penObj,gardenObj,stallObj,helperObj,owlObj,guestTourist,player,worldChanges;let lastRegion=null;
  // Trees, ponds, lanterns and the campfire block walking; ponds are new water carved into the plateaus.
  const obstacles=[...[[ -35,-4],[-31,-4],[-26,-5],[-23,-2],[-36,1],[-34,6],[-29,6],[-24,5],[25,4],[37,3],[26,-6]].map(([x,z])=>({x,z,w:.8,d:.8})),
    {x:1.9,z:-7.8,w:5.6,d:3.6},{x:2.5,z:33.2,w:9.2,d:8.8},
    ...LANTERNS.map(([x,z])=>({x:x+.15,z,w:.5,d:.4})),{x:CAMPFIRE[0],z:CAMPFIRE[1],w:1.4,d:1.4}];
  let rabbits=[],visitors=[],selected=null,path=[],keys=new Set(),busyUntil=0,fx=[];
  const raycaster=new T.Raycaster(),pointer=new T.Vector2(),ground=new T.Plane(new T.Vector3(0,1,0),0),hitPoint=new T.Vector3();
  let seed=43;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};

  const sky=createSky(scene,{sun,hemi,quality});
  const startHour=Number(new URLSearchParams(location.search).get('hour'));if(startHour>=0&&startHour<24&&new URLSearchParams(location.search).has('hour'))sky.setHour(startHour);
  const audio=createAudio();
  let post=createPost(renderer,scene,camera,quality);
  buildRegions(scene);

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
  const pos=new T.Vector3(0,0,6);

  // ---------- Voxel terrain + grass (rebuilt only when new land is bought) ----------
  let terrain=null,grass=null,flowers=null;
  const NO_GRASS=[[-3,-2,5.2,4.4],[5.3,2.3,6.6,4.8],[-4.8,6.3,3.2,5.8],[-1.2,8.5,2.8,2.2],[-9,3.8,3.2,2.6],[6.8,-5.5,4.6,3.6],[1.6,-5,1,1],[-3.8,6.8,1,1],[-7.3,-2.1,2.2,1],[-6,3.5,1,1],
    [1,-30,5.4,4],[31,2,5,4.6],[34,-4,3.2,3.2],[-33,4,1.6,1.4],[0,29.5,2.4,4.2],[28,-28,6,6],[-26.3,5,1.6,1.6],[3,-29,5,4]];
  const noGrass=(x,z)=>NO_GRASS.some(([cx,cz,w,d])=>Math.abs(x-cx)<w/2&&Math.abs(z-cz)<d/2)||LANTERNS.some(([lx,lz])=>Math.abs(x-lx)<.4&&Math.abs(z-lz)<.4);
  function rebuildTerrain(s){
    if(terrain){terrain.dispose();grass.removeFromParent();grass.geometry.dispose();flowers.removeFromParent();flowers.geometry.dispose();}
    terrain=buildTerrain(scene,s,quality);
    const sampler=(r,landOnly)=>{
      const list=(landOnly||r()<.82)?terrain.landCells:terrain.hillCells;if(!list.length)return null;
      const k=list[Math.floor(r()*list.length)],c=terrain.cells[k];
      const x=GRID.x0+k%GRID.w+r(),z=GRID.z0+Math.floor(k/GRID.w)+r();
      if(c.type==='land'&&noGrass(x,z))return null;
      return {x,y:c.top,z,color:c.color.clone().multiplyScalar(.82+r()*.3)};
    };
    grass=grassField(scene,quality==='low'?7000:24000,r=>sampler(r));
    flowers=flowerField(scene,quality==='low'?450:1300,r=>sampler(r,true));
  }

  const ambient=createAmbient(scene,{walkable:(x,z)=>walkable(x,z),quality});

  function disposeObject(g){if(!g)return;const targetIndex=targets.indexOf(g);if(targetIndex>=0)targets.splice(targetIndex,1);g.traverse(o=>{if(o.isMesh&&o.geometry && !o.isInstancedMesh&&!o.material.transparent)o.geometry.dispose();});g.removeFromParent();}
  function setGame(next){
    const prev=state;state=next;
    const oldWorld=prev.world||{},newWorld=next.world||{};
    if(!terrain||prev.landLevel!==next.landLevel)rebuildTerrain(next);
    if(!worldChanges||['quarry','meadow','orchard','windmill','chest'].some(k=>oldWorld[k]!==newWorld[k])){
      if(worldChanges)disposeObject(worldChanges.root);worldChanges=buildWorldChanges(dynamic,next);
    }
    if(!houseObj||prev.houseLevel!==next.houseLevel){disposeObject(houseObj);houseObj=house(dynamic,next.houseLevel);targets.push(houseObj);ambient.setHouseLevel(next.houseLevel);}
    if(!penObj||prev.pen!==next.pen||prev.penLevel!==next.penLevel){disposeObject(penObj);penObj=pen(dynamic,next.pen,next.penLevel||1);}
    if(!gardenObj||prev.planted!==next.planted||prev.watered!==next.watered||prev.landLevel!==next.landLevel){disposeObject(gardenObj);gardenObj=garden(dynamic,next);targets.push(gardenObj);}
    if(!stallObj||prev.stall!==next.stall){disposeObject(stallObj);stallObj=stall(dynamic,next.stall);targets.push(stallObj);}
    if(!helperObj||prev.helper!==next.helper){if(helperObj?.root)disposeObject(helperObj.root);helperObj=helper(dynamic,next.helper);if(helperObj?.root)targets.push(helperObj.root);}
    if(!owlObj){owlObj=owl(dynamic,1.6,-5.0);targets.push(owlObj.root);}
    if(!player||prev.avatar!==next.avatar){if(player)player.root.removeFromParent();player=person(scene,next.avatar);player.root.position.copy(pos);player.onStep=footstep;}
    if(!walkable(pos.x,pos.z)){
      let safe=null;
      for(let r=.35;r<5&&!safe;r+=.35)for(let i=0;i<24;i++){
        const x=pos.x+Math.cos(i/24*Math.PI*2)*r,z=pos.z+Math.sin(i/24*Math.PI*2)*r;
        if(walkable(x,z)){safe={x,z};break;}
      }
      if(safe){pos.set(safe.x,0,safe.z);player.root.position.copy(pos);path=[];}
    }
    const n=next.rabbits&&next.pen?2+Math.min(next.babies,18):0;
    while(rabbits.length>n){rabbits.pop().root.removeFromParent();}
    while(rabbits.length<n){const i=rabbits.length,r=rabbit(scene,i,i>=2);r.root.position.set(4.1+random()*2.3,0,2.1+random()*1.4);r.from=r.root.position.clone();r.to=r.from.clone();r.next=time+random()*1.2;r.started=0;r.duration=.8;rabbits.push(r);}

    const isConnected = Boolean(next.world?.quarry || next.world?.meadow || (next.world?.visited && next.world?.visited.length > 1));
    let numVisitors = 0;
    if (next.stall && isConnected) {
      numVisitors = 1;
      if (next.world?.quarry) numVisitors++;
      if (next.world?.meadow) numVisitors++;
    }
    while(visitors.length > numVisitors) { visitors.pop().root.removeFromParent(); }
    while(visitors.length < numVisitors) {
      const idx = visitors.length;
      const v = visitor(scene, idx);
      if (idx === 0) v.root.position.set(-0.1, 0, 7.8);
      else if (idx === 1) v.root.position.set(-2.3, 0, 8.1);
      else v.root.position.set(0.9, 0, 8.7);
      visitors.push(v);
    }

    if (next.houseLevel >= 3 && isConnected) {
      if (!guestTourist) {
        guestTourist = visitor(scene, 3);
        guestTourist.root.position.set(-0.6, 0, 0.2);
        guestTourist.root.rotation.y = Math.PI * 0.25;
      }
    } else if (guestTourist) {
      guestTourist.root.removeFromParent();
      guestTourist = null;
    }
  }
  function inside(x,z){return insideWorld(x,z,state);}
  function walkable(x,z){
    if(!inside(x,z))return false;
    const blocks=[...obstacles,{x:1,z:-30,w:4.6,d:3.4},...(state.world?.windmill?[{x:34,z:-4,w:2.7,d:2.7}]:[]),{x:state.houseLevel>=3?-2.15:-3,z:state.houseLevel>=3?-1.8:-2,w:state.houseLevel>=3?6.5:4.6,d:state.houseLevel>=3?4.5:3.8},...(state.pen?[{x:5.3,z:2.3,w:state.penLevel>=2?6.2:5.2,d:4.2}]:[]),...(state.stall?[{x:-1.2,z:8.5,w:2.2,d:1.6}]:[])];
    return !blocks.some(b=>Math.abs(x-b.x)<b.w/2+.3&&Math.abs(z-b.z)<b.d/2+.3);
  }
  function route(x,z){return findPath([pos.x,pos.z],[x,z],walkable).map(([px,pz])=>new T.Vector3(px,0,pz));}
  function select(id){if(PLACES[id]?.region&&!unlocked(PLACES[id].region,state))id=REGIONS[PLACES[id].region].gate;worldOverview=false;selected=id;callbacks.onSelect(id);if(!id)return;const p=PLACES[id];path=route(...p.approach);marker.position.set(...[p.approach[0],.12,p.approach[1]]);marker.visible=true;overview=false;}
  function goTo(x,z){worldOverview=false;path=route(x,z);if(path.length){const end=path.at(-1);marker.position.set(end.x,.12,end.z);marker.visible=true;}overview=false;}
  function project(v){
    const p=new T.Vector3(...v).project(camera);
    const sx = (p.x*.5+.5)*width;
    const sy = (-.5*p.y+.5)*height;
    return {x:sx,y:sy,visible:p.z<1&&sx>30&&sx<width-30&&sy>135&&sy<height-80};
  }
  let shadowExtent=24,camDistance=15;
  function positionCamera(dt){
    const region=REGIONS[regionAt(pos.x,pos.z)||lastRegion||'farm'];
    // Low third-person camera that follows the hero; overview buttons pull back to a top view.
    desiredLook.set(worldOverview?0:overview?region.x:pos.x,worldOverview||overview?0:.9,worldOverview?-9:overview?region.z:pos.z);
    look.lerp(desiredLook,1-Math.exp(-dt*(overview||worldOverview?3:5)));
    const portrait=width/height<.8;
    zoom+=(targetZoom-zoom)*(1-Math.exp(-dt*8));
    const distance=(worldOverview?(portrait?180:108):overview?(portrait?72:38):(portrait?21:15))*zoom;
    camDistance+=(distance-camDistance)*(1-Math.exp(-dt*4));
    const elev=worldOverview?.95:overview?.8:.5;
    offset.set(Math.sin(yaw)*Math.cos(elev)*camDistance,Math.sin(elev)*camDistance,Math.cos(yaw)*Math.cos(elev)*camDistance);
    camera.position.copy(look).add(offset);camera.lookAt(look);camera.updateMatrixWorld();
    scene.fog.near=camDistance*.9+8;scene.fog.far=camDistance*2.8+55;
    const ext=T.MathUtils.clamp(camDistance*1.25,20,70);
    if(Math.abs(ext-shadowExtent)>2){shadowExtent=ext;Object.assign(sun.shadow.camera,{left:-ext,right:ext,top:ext,bottom:-ext});sun.shadow.camera.updateProjectionMatrix();}
  }
  let firstResize=true;
  function resize(){width=host.clientWidth;height=host.clientHeight;if(firstResize&&width/height<.8){overview=false;}firstResize=false;renderer.setSize(width,height);post?.setSize(width,height,renderer.getPixelRatio());camera.aspect=width/height;camera.fov=width/height<.8?50:42;camera.updateProjectionMatrix();positionCamera(10);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  function turn(d){yaw+=d;overview=false;worldOverview=false;}
  function setZoom(d){targetZoom=T.MathUtils.clamp(targetZoom+d,.55,1.5);}
  const pointerDown=new Map();let drag=null,pinch=null,lastGestureRoute=0;
  let lastTapTime=0, lastTapCoords={x:0,y:0};
  const suppressed=new Set();
  function screenRay(x,y){const rect=renderer.domElement.getBoundingClientRect();pointer.set((x-rect.left)/width*2-1,-(y-rect.top)/height*2+1);raycaster.setFromCamera(pointer,camera);}
  function guideFinger(e){screenRay(e.clientX,e.clientY);if(raycaster.ray.intersectPlane(ground,hitPoint)&&inside(hitPoint.x,hitPoint.z))goTo(hitPoint.x,hitPoint.z);}
  function down(e){
    audio.start();
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

    // Check double-tap on touch/mouse
    const now = performance.now();
    const tapInterval = now - lastTapTime;
    const tapDist = Math.hypot(e.clientX - lastTapCoords.x, e.clientY - lastTapCoords.y);
    lastTapTime = now;
    lastTapCoords = { x: e.clientX, y: e.clientY };

    screenRay(e.clientX,e.clientY);
    const hits=raycaster.intersectObjects(targets,true);
    let hitPlace = null;
    if(hits.length){
      let o=hits[0].object;
      while(o&&!o.userData.place)o=o.parent;
      if(o?.userData.place) hitPlace = o.userData.place;
    }

    if (tapInterval < 450 && tapDist < 35) {
      if (hitPlace) { performDirectAction(hitPlace); return; }
      if (selected) { performDirectAction(selected); return; }
    }

    if(hitPlace){select(hitPlace);return;}
    if(raycaster.ray.intersectPlane(ground,hitPoint))goTo(hitPoint.x,hitPoint.z);
  }
  function wheel(e){e.preventDefault();setZoom(e.deltaY*.0007);}
  function context(e){e.preventDefault();}
  function keyDown(e){if(e.target.closest('input,textarea,[role="dialog"]'))return;audio.start();if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==='e'&&!e.repeat)callbacks.onAction();}
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

  function footstep(){
    const c=terrain?.cellAt(pos.x,pos.z);
    audio.step(!c||c.type==='water'||c.type==='hill'?'wood':c.kind===1?'path':'grass');
  }
  function waterNearby(){
    if(!terrain)return 0;let m=1;
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;m=Math.min(m,terrain.maskAt(pos.x+Math.cos(a)*3.5,pos.z+Math.sin(a)*3.5));}
    return T.MathUtils.clamp((1-m)*1.6,0,1);
  }
  const starGeo = new T.OctahedronGeometry(.13, 0);
  const coinGeo = new T.CylinderGeometry(.12, .12, .04, 10);
  const dropGeo = new T.SphereGeometry(.1, 8, 8);
  const woodGeo = new T.BoxGeometry(.14, .08, .1);
  const heartGeo = new T.SphereGeometry(.11, 8, 8); heartGeo.scale(1.2, 1, .9);

  function burst(x, z, baseColor, type = 'star') {
    let geo = starGeo;
    let palette = [baseColor, '#ffe066', '#ff85a1', '#70e000', '#ffffff'];
    let count = 16;
    let gravity = 9.5;
    let lift = 2.8;

    if (type === 'heart') {
      geo = heartGeo;
      palette = ['#ff4d6d', '#ff758f', '#ff8fa3', '#fff0f3'];
      count = 8;
      gravity = 2.2;
      lift = 1.6;
    } else if (type === 'coin') {
      geo = coinGeo;
      palette = ['#ffd166', '#ffb703', '#ffe49e'];
      count = 12;
      gravity = 11;
      lift = 3.6;
    } else if (type === 'water') {
      geo = dropGeo;
      palette = ['#00b4d8', '#48cae4', '#90e0ef', '#ffffff'];
      count = 14;
      gravity = 8;
      lift = 2.4;
    } else if (type === 'chop') {
      geo = woodGeo;
      palette = ['#a06f35', '#c89650', '#7a4e23', '#dfb072'];
      count = 12;
    }

    for (let i = 0; i < count; i++) {
      const col = palette[i % palette.length];
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: type === 'heart' ? .6 : .4,
        roughness: type === 'coin' ? .2 : .4
      }));
      m.position.set(x + (random() - .5) * .35, .75, z + (random() - .5) * .35);
      m.scale.setScalar(0);
      scene.add(m);
      const angle = random() * Math.PI * 2;
      const speed = type === 'heart' ? (0.6 + random() * 0.9) : (1.4 + random() * 2.2);
      fx.push({
        m,
        v: new T.Vector3(Math.cos(angle) * speed, lift + random() * (type === 'heart' ? 1.0 : 2.2), Math.sin(angle) * speed),
        rot: new T.Vector3((random() - .5) * 12, (random() - .5) * 12, (random() - .5) * 12),
        gravity,
        type,
        started: time,
        dur: .85 + random() * .35,
        end: time + .85 + random() * .35,
      });
    }
  }

  function animateAction(kind = 'general') {
    busyUntil = time + 1.1;
    path = [];
    let baseCol = '#f6d68a';
    let fxType = 'star';

    if (kind === 'mine' || kind.includes('mine')) {
      baseCol = '#a6c7dc'; fxType = 'star'; audio.mine();
    } else if (kind === 'garden' || kind.includes('harvest')) {
      baseCol = '#e9b668'; fxType = 'star'; audio.harvest();
    } else if (kind === 'water' || kind.includes('water')) {
      baseCol = '#4fc3f7'; fxType = 'water'; audio.water();
    } else if (kind === 'chop' || kind.includes('chop') || kind === 'forest') {
      baseCol = '#b58550'; fxType = 'chop'; audio.chop();
    } else if (kind === 'pen' || kind.includes('feed') || kind.includes('pet')) {
      baseCol = '#ff758f'; fxType = 'heart'; audio.squeak();
    } else if (kind.includes('buy') || kind.includes('sell') || kind.includes('coins')) {
      baseCol = '#ffca3a'; fxType = 'coin'; audio.coin();
    } else if (kind.includes('unlock') || kind.includes('upgrade') || kind.includes('build')) {
      baseCol = '#ff9f1c'; fxType = 'star'; audio.fanfare();
    } else {
      audio.chime();
    }

    burst(pos.x, pos.z, baseCol, fxType);
  }
  let paused=false, frameTime=16, slowFor=0, skyInfo={night:0,horizon:null};
  function frame(now){
    if(disposed)return;frameTime=frameTime*.9+(now-last)*.1;const dt=Math.min(.1,(now-last)/1000);last=now;time+=dt;
    // Adaptive quality: if a "high" device struggles, drop post-processing and resolution.
    if(quality==='high'){slowFor=frameTime>30?slowFor+dt:Math.max(0,slowFor-dt);if(slowFor>4){quality='low';post?.dispose();post=null;renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(width,height);}}
    U.uTime.value=time;
    let dx=0,dz=0,speed=0;
    if(player&&!paused&&time>busyUntil){
      const inputX=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
      const inputZ=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
      if(inputX||inputZ){path=[];overview=false;worldOverview=false;const length=Math.max(1,Math.hypot(inputX,inputZ));dx=(inputX*Math.cos(yaw)+inputZ*Math.sin(yaw))/length;dz=(-inputX*Math.sin(yaw)+inputZ*Math.cos(yaw))/length;}
      else if(path.length){const v=path[0].clone().sub(pos);if(v.length()<.15)path.shift();else{v.normalize();dx=v.x;dz=v.z;}}
      const ox=pos.x,oz=pos.z,step=Math.min(dt*3.4,path.length?pos.distanceTo(path[0]):Infinity);
      if(walkable(pos.x+dx*step,pos.z))pos.x+=dx*step;
      if(walkable(pos.x,pos.z+dz*step))pos.z+=dz*step;
      speed=Math.hypot(pos.x-ox,pos.z-oz)/Math.max(dt,.001);
    }
    if(player){
      player.root.position.copy(pos);
      const moving=speed>.04;
      player.update({ moving, speed, dx, dz, time, cameraYaw: yaw, busy: time < busyUntil });
      U.uPlayer.value.copy(pos);
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

    if(helperObj?.update) helperObj.update(time);
    if(owlObj?.update) owlObj.update(time);
    if(guestTourist?.update) guestTourist.update(time, 1.8);
    for(const v of visitors){
      if(v.update) v.update(time, v.phase);
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
    fx = fx.filter(f => {
      const age = time - f.started;
      const life = 1 - (f.end - time) / f.dur;
      f.m.position.addScaledVector(f.v, dt);
      f.v.y -= (f.gravity || 9.5) * dt;
      f.m.rotation.x += f.rot.x * dt;
      f.m.rotation.y += f.rot.y * dt;
      const popScale = age < .12 ? (age / .12) * 1.3 : Math.max(0, 1.3 * (1 - life));
      f.m.scale.setScalar(popScale);
      if (f.m.position.y < .08 && f.v.y < 0) {
        f.v.y = -f.v.y * .35;
        f.v.x *= .6; f.v.z *= .6;
      }
      if (time > f.end) {
        f.m.removeFromParent();
        f.m.material.dispose();
        return false;
      }
      return true;
    });
    if(marker.visible){marker.scale.setScalar(1+Math.sin(time*3)*.1);if(!path.length)marker.material.opacity=.3;else marker.material.opacity=.9;}
    positionCamera(dt);
    skyInfo=sky.update(dt,look);
    const night=skyInfo.night;
    windowGlass().emissiveIntensity=night*2.4;
    terrain?.update(time,night,skyInfo.horizon);
    ambient.update(dt,time,{night,player:pos});
    audio.update({night,water:waterNearby(),moving:speed>.04});

    // 60 FPS Direct Label Synchronization (Eliminates DOM lag and wobble)
    const labelWrap = host.querySelector('.world-labels') || host.parentElement?.querySelector('.world-labels') || document.querySelector('.world-labels');
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
      callbacks.onFrame({region:lastRegion||'farm',position:[pos.x,pos.z],destination:selected,near:dist<1.65?nearest:null,moving:speed>.04,busy:time<busyUntil,clock:sky.clock(),muted:audio.muted,labels:Object.fromEntries(Object.entries(PLACES).filter(([,p])=>visiblePlace(p,state)).map(([id,p])=>[id,project(p.label)]))});lastUi=now;
    }
    if(post)post.render(night);else renderer.render(scene,camera);
    raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);
  const api={setGame,select,performDirectAction,turn,zoom:setZoom,home(){worldOverview=false;overview=!overview;zoom=1;yaw=.35;},worldView(){worldOverview=true;overview=true;zoom=1;yaw=.12;},returnHome(){select('house');},stop(){path=[];selected=null;callbacks.onSelect(null);marker.visible=false;},follow(){overview=false;},pause(value){paused=value;clearInput();},animateAction,
    playSound(name, arg) {
      audio.start();
      if (name === 'pop') audio.pop(arg);
      else if (name === 'harvest') audio.harvest();
      else if (name === 'water') audio.water();
      else if (name === 'coin') audio.coin();
      else if (name === 'squeak') audio.squeak();
      else if (name === 'chop') audio.chop();
      else if (name === 'mine') audio.mine();
      else if (name === 'fanfare') audio.fanfare();
      else audio.chime();
    },
    getPlayerScreenPos() {
      const sPos = project([pos.x, 1.85, pos.z]);
      return { x: sPos.x, y: sPos.y, visible: sPos.visible };
    },
    toggleSound(){audio.start();audio.setMuted(!audio.muted);return audio.muted;},
    setHour(h){sky.setHour(h);},
    inspect(){return {region:lastRegion,routeLength:path.length,position:pos.toArray(),routeTo:(x,z)=>route(x,z).map(p=>p.toArray()),inside:(x,z)=>inside(x,z),camera:{yaw,zoom},fps:Math.round(1000/frameTime),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,houseLevel:state.houseLevel,quality,clock:sky.clock(),project:(point)=>project(point)};},
    destroy(){disposed=true;cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clearInput);canvas.removeEventListener('dblclick',dblclick);document.removeEventListener('visibilitychange',visibility);audio.dispose();post?.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});renderer.dispose();canvas.remove();}
  };
  return api;
}
