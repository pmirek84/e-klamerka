import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const materials = new Map(), geometries = new Map();
export const palette = { grass: '#77a856', deepGrass: '#719d55', edge: '#d4b991', wood: '#ac7245', lightWood: '#d5a369', cream: '#fff0cd', roof: '#3d8491', roofEdge: '#246773', soil: '#79513e', stone: '#98a7a7', pink: '#cf6481' };
export function material(color, options = {}) {
  const key = color + JSON.stringify(options);
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness: .83, ...options }));
  return materials.get(key);
}
function geo(key, make) { if (!geometries.has(key)) geometries.set(key, make()); return geometries.get(key); }
export function mesh(parent, geometry, color, x=0, y=0, z=0, options) {
  const m = new T.Mesh(geometry, material(color, options));
  m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
export function box(p, w,h,d,c,x=0,y=0,z=0,r=.035) {
  return mesh(p, geo(`b${w},${h},${d},${r}`,()=>r ? new RoundedBoxGeometry(w,h,d,1,Math.min(r,w/3,h/3,d/3)) : new T.BoxGeometry(w,h,d)),c,x,y,z);
}
export function ball(p,r,c,x=0,y=0,z=0,sx=1,sy=1,sz=1) {
  const m = mesh(p,geo(`s${r}`,()=>new T.SphereGeometry(r,12,8)),c,x,y,z); m.scale.set(sx,sy,sz); return m;
}
export function cylinder(p, rt,rb,h,c,x=0,y=0,z=0,segments=10) {
  return mesh(p,geo(`c${rt},${rb},${h},${segments}`,()=>new T.CylinderGeometry(rt,rb,h,segments)),c,x,y,z);
}
export function group(p,x=0,y=0,z=0) { const g=new T.Group();g.position.set(x,y,z);p.add(g);return g; }
export function shadow(p,x,z,rx,rz,opacity=.13) {
  const m=new T.Mesh(geo('circle',()=>new T.CircleGeometry(1,28)),new T.MeshBasicMaterial({color:'#344c33',transparent:true,opacity,depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.scale.set(rx,rz,1);m.position.set(x,.035,z);p.add(m);return m;
}
export function bake(g) {
  // Keep scenery draw calls proportional to material count, not to the number of leaves/planks.
  const batches = new Map(); g.updateMatrixWorld(true);
  const inverse = g.matrixWorld.clone().invert();
  g.traverse(m=>{ if(m.isMesh && !m.material.transparent) {
    const transformed = m.geometry.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,m.matrixWorld));
    if (!transformed.index) transformed.setIndex(Array.from({length:transformed.attributes.position.count},(_,i)=>i));
    const key=m.material.uuid; if(!batches.has(key))batches.set(key,{mat:m.material,geos:[]});batches.get(key).geos.push(transformed);
  }});
  const transparent=[];g.traverse(m=>{if(m.isMesh && m.material.transparent)transparent.push(m);});
  const preserved=transparent.map(m=>{const clone=m.clone();clone.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,m.parent.matrixWorld));return clone;});
  g.clear();
  for(const {mat,geos} of batches.values()) {const geometry=mergeGeometries(geos);if(geometry){const m=new T.Mesh(geometry,mat);m.castShadow=true;m.receiveShadow=true;g.add(m);}geos.forEach(x=>x.dispose());}
  preserved.forEach(m=>g.add(m));return g;
}
export function tree(p,x,z,scale=1,variant=0) {
  const g=group(p,x,0,z);g.scale.setScalar(scale);shadow(g,0,0,1.4,1.2);
  cylinder(g,.21,.34,2.2,palette.wood,0,1.1,0);
  const branch=cylinder(g,.10,.17,1.2,palette.wood,.3,1.7,0);branch.rotation.z=-.5;
  const colors=['#508b4c','#6b9b4d','#8ab25b'];
  ball(g,1.1,colors[variant%3],0,2.55,0,1,.98,1);
  ball(g,.9,colors[(variant+1)%3],-.65,2.3,.1);
  ball(g,.95,colors[variant%3],.65,2.55,-.1);
  ball(g,.9,'#99ba63',.1,3.25,-.15,1,.85,1);
  if(variant%2===0)for(let i=0;i<5;i++) {const a=i*2.4;ball(g,.11,'#e89a64',Math.cos(a)*.93,2.25+(i%3)*.22,Math.sin(a)*.9);}
  return g;
}
function windowPane(p,x,y,z,w=.7,h=.85) {
  box(p,w+.16,h+.16,.13,palette.cream,x,y,z);
  box(p,w,h,.14,'#294c57',x,y,z+.07);
  box(p,w-.08,h-.1,.05,'#ffc76e',x,y,z+.155);
  box(p,.055,h,.07,palette.cream,x,y,z+.2);box(p,w,.055,.07,palette.cream,x,y,z+.2);
  box(p,w+.28,.09,.32,palette.lightWood,x,y-h/2-.06,z+.16);
}
function roof(p,w,d,wallY,c=palette.roof) {
  const rise=w*.36,run=w/2+.2,length=Math.hypot(run,rise),angle=Math.atan2(rise,run);
  for(const side of [-1,1]) {
    const slab=box(p,length,.17,d+.48,c,side*run/2,wallY+rise/2,0);slab.rotation.z=-side*angle;
    // Slim seam lines follow the actual roof geometry.
    for(let i=0;i<Math.ceil(d/.4);i++) {
      const seam=box(p,length+.02,.045,.045,palette.roofEdge,side*run/2,wallY+rise/2+.1,-d/2+i*.4);seam.rotation.z=-side*angle;
    }
    const fascia=box(p,length+.04,.19,.12,palette.cream,side*run/2,wallY+rise/2,d/2+.24);fascia.rotation.z=-side*angle;
  }
  cylinder(p,.11,.11,d+.55,palette.roofEdge,0,wallY+rise,0).rotation.x=Math.PI/2;
  // Fill gable with a triangular prism.
  const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,rise-.1);s.closePath();
  mesh(p,new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false}),palette.cream,0,wallY,-d/2);
}
export function house(p,level) {
  const g=group(p,-3,0,-2);g.userData.place='house';
  shadow(g,0,0,2.9,2.4);
  box(g,4.6,.3,3.8,'#c2c1ac',0,.16,0);
  if(!level) {
    box(g,4,.11,3.2,'#c8ab82',0,.37,0);
    for(const x of [-2,2])for(const z of [-1.6,1.6])box(g,.2,.95,.2,palette.lightWood,x,.76,z);
    for(let i=0;i<4;i++)box(g,1.7,.2,.27,palette.wood,-1.2,.55+i*.21,0);
    const sign=group(g,.9,.45,0);box(sign,.1,1.1,.1,palette.wood,0,.55,0);box(sign,1.05,.65,.1,palette.cream,0,1.15,0);
    box(sign,.5,.12,.08,palette.roof,0,1.15,.1);box(sign,.12,.48,.08,palette.roof,0,1.15,.1);
    return bake(g);
  }
  const h=level>=2?3.45:2.3;
  box(g,3.8,h,3.1,palette.cream,0,.35+h/2,0);
  for(const x of [-1.86,1.86])for(const z of [-1.53,1.53])box(g,.16,h+.05,.16,palette.lightWood,x,.35+h/2,z);
  for(let y=.52;y<h;y+=.37)box(g,3.74,.035,.04,'#e1ca9b',0,y,1.57);
  for(const side of [-1,1]) {
    const wall=group(g,side*1.94,0,0);wall.rotation.y=side*Math.PI/2;
    windowPane(wall,0,1.6,.01,.8,.85);
    for(const wx of [-.59,.59])box(wall,.25,.91,.08,'#86ac98',wx,1.6,.1);
    if(level>=2)windowPane(wall,0,2.96,.01,.65,.65);
  }
  box(g,.96,1.55,.17,palette.roofEdge,-.55,1.13,1.62);
  box(g,.72,1.18,.09,'#559da2',-.55,1.1,1.73);
  ball(g,.055,'#edbc64',-.28,.98,1.81);
  windowPane(g,.85,1.58,1.61,.7,.82);
  for(const x of [.3,1.4])box(g,.23,.86,.12,'#86ac98',x,1.58,1.72);
  box(g,.9,.21,.32,'#b7825b',.85,1.06,1.9);
  for(let i=0;i<4;i++){ball(g,.13,'#729658',.53+i*.2,1.24,1.9);ball(g,.065,i%2?'#e4a092':'#f2d37f',.53+i*.2,1.35,1.92);}

  
  box(g,1.65,.14,.75,palette.lightWood,-.55,.41,1.9);
  box(g,1.9,.14,.5,'#c7bd9e',-.55,.15,2.35);
  if(level>=2){windowPane(g,-.75,2.91,1.62,.66,.7);windowPane(g,.75,2.91,1.62,.66,.7);}
  roof(g,3.8,3.1,.35+h);
  box(g,.48,1.4,.5,'#a47057',1.05,h+.9,-.55);
  box(g,.62,.15,.64,palette.cream,1.05,h+1.58,-.55);
  // Porch plant and doormat add scale near the entrance.
  box(g,.85,.04,.42,'#bd7951',-.55,.49,1.97);
  for(const x of [-1.5,1.5]) {cylinder(g,.24,.17,.34,'#c78060',x,.53,1.82);ball(g,.33,'#6d9b52',x,.86,1.82);ball(g,.1,'#f1ce74',x+.08,1.12,1.84);}
  if(level>=3) {
    const wing=group(g,2.9,0,-.1);box(wing,2,1.85,2.6,'#d8ddbf',0,1.22,0);roof(wing,2,2.6,2.14);
    windowPane(wing,0,1.25,1.35,1.2,.8);
    const porch=group(g,0,0,2.6);box(porch,3.8,.17,1.3,palette.lightWood,0,.35,0);
    for(const x of [-1.65,1.65])box(porch,.12,1.25,.12,palette.cream,x,.98,.48);
    for(let x=-1.65;x<=1.65;x+=.33)if(Math.abs(x)>.6)box(porch,.07,.64,.07,palette.cream,x,.87,.48);
    for(const x of [-1.18,1.18])box(porch,.9,.1,.1,palette.cream,x,1.22,.48);
  }
  return bake(g);
}
export function fence(p,x,z,w,d) {
  for(const side of [-1,1]) {
    for(let i=0;i<=4;i++){const px=x-w/2+i*w/4;box(p,.15,1,.15,palette.lightWood,px,.5,z+side*d/2);ball(p,.1,palette.cream,px,1.01,z+side*d/2);}
    for(const y of [.4,.78])box(p,w,.12,.09,palette.cream,x,y,z+side*d/2);
    for(let i=1;i<4;i++){box(p,.15,1,.15,palette.lightWood,x+side*w/2,.5,z-d/2+i*d/4);}
    for(const y of [.4,.78])box(p,.09,.12,d,palette.cream,x+side*w/2,y,z);
  }
}
export function pen(p,built) {
  const g=group(p,5.3,0,2.3);g.userData.place='pen';
  box(g,5.2,.08,4.2,built?'#b3c579':'#a4b870',0,.05,0,.15);
  if(!built) {
    for(const x of [-2.6,2.6])for(const z of [-2.1,2.1])box(g,.14,.4,.14,palette.lightWood,x,.2,z);
    for(const z of [-2.1,2.1])box(g,5.2,.045,.06,palette.cream,0,.1,z);
    return bake(g);
  }
  fence(g,0,0,5.2,4.2);
  const hutch=group(g,0,0,-.8);box(hutch,2,.9,1.3,palette.lightWood,0,1,0);box(hutch,.65,.65,.08,'#674934',.42,.91,.69);
  for(const x of [-.8,.8])for(const z of [-.5,.5])box(hutch,.13,.65,.13,palette.wood,x,.33,z);
  roof(hutch,2,1.3,1.5);
  const ramp=box(hutch,.72,.09,1.15,palette.wood,.42,.37,1.12);ramp.rotation.x=.42;
  for(let i=0;i<4;i++)box(hutch,.67,.08,.09,palette.lightWood,.42,.14+i*.11,1.62-i*.23);
  cylinder(g,.3,.33,.16,'#819cac',1.5,.13,1.1);cylinder(g,.24,.24,.012,'#81cbd1',1.5,.22,1.1);
  box(g,.7,.27,.5,'#e7bf6b',-1.6,.23,-1);
  return bake(g);
}
export function garden(p,s) {
  const g=group(p,-4.8,0,5);g.userData.place='garden';
  const plot=(x,z)=>{
    box(g,2.4,.16,2,'#7d5940',x,.15,z,.09);
    for(const side of [-1,1]) {box(g,2.6,.23,.13,palette.lightWood,x,.23,z+side*1);box(g,.13,.23,2.1,palette.lightWood,x+side*1.24,.23,z);}
    for(let row=0;row<3;row++)for(let col=0;col<4;col++) {
      const px=x-.82+col*.55,pz=z-.63+row*.62;
      if(s.planted) {
        if(s.watered)cylinder(g,.11,.035,.32,'#e79445',px,.27,pz);
        for(let n=0;n<3;n++) {const leaf=box(g,.1,s.watered?.4:.17,.06,n%2?'#729943':'#4e863f',px+(n-1)*.08,s.watered?.6:.35,pz);leaf.rotation.z=(n-1)*.45;}
      } else box(g,.35,.04,.1,'#634734',px,.255,pz);
    }
  };
  plot(0,0);plot(0,2.65);
  for(let i=0;i<s.landLevel;i++)plot(16.1+i*2.8,0);
  return bake(g);
}
export function shop(p) {
  const g=group(p,-9,0,3.8);g.userData.place='shop';shadow(g,0,0,1.7,1.4);
  box(g,2.6,.18,2,palette.lightWood,0,.16,0);
  box(g,2.5,.9,.9,'#ca9e6f',0,.73,.35);box(g,2.65,.14,1.15,palette.cream,0,1.24,.35);
  for(const x of [-1.2,1.2])box(g,.13,2.3,.13,palette.wood,x,1.3,-.65);
  for(let i=0;i<7;i++) {const awning=box(g,.4,.11,2.25,i%2?'#fff1d2':'#db8969',-1.2+i*.4,2.56,0);awning.rotation.x=.12;box(g,.39,.33,.09,i%2?'#fff1d2':'#db8969',-1.2+i*.4,2.24,1.06);}
  for(let i=0;i<3;i++) {box(g,.57,.24,.65,palette.wood,-.75+i*.75,1.39,.34);for(let j=0;j<3;j++)ball(g,.12,i===0?'#ed9858':i===1?'#a6b968':'#e7c679',-.89+i*.75+j*.13,1.59,.36);}
  // Wooden peg as the shop's own e-klamerka emblem.
  const peg=group(g,0,2.85,-.5);for(const x of [-.1,.1])box(peg,.13,.67,.12,palette.cream,x,0,0);box(peg,.38,.07,.14,palette.roof,0,.03,0);
  return bake(g);
}
export function rabbit(p,index,baby=false) {
  const root=group(p),body=group(root);const c=index%2?'#9a755e':'#f5eee1',spot=index%2?'#534b47':'#a5a9a5';
  ball(body,.32,c,0,.39,0,1,1,1.35);ball(body,.27,c,0,.56,.33,1,.96,.94);
  ball(body,.16,spot,.15,.47,-.12,1,.7,1.4);ball(body,.105,'#eee8d8',0,.43,-.44);
  const ears=[];for(const x of [-.13,.13]) {const ear=group(body,x,.73,.31);ball(ear,.105,c,0,.2,0,.65,2.9,.6);ball(ear,.065,'#dca5a0',0,.21,.053,.55,3,.5);ears.push(ear);}
  for(const x of [-.105,.105]) {ball(body,.034,'#373a34',x,.62,.562);ball(body,.009,'#fff8e9',x-.007,.634,.585);}
  ball(body,.035,'#bf8c87',0,.53,.587);
  const feet=[];for(const x of [-.2,.2])for(const z of [-.23,.24]){const foot=group(body,x,.14,z);ball(foot,.13,c,0,0,.04,.7,.65,1.45);feet.push(foot);}
  root.scale.setScalar(baby?.58:1);return { root, body, ears, feet, phase:index*1.71, baby };
}
import girlFrontUrl from '../girl-walk-front.png';
import girlRightUrl from '../girl-walk-right.png';
import girlLeftUrl from '../girl-walk-left.png';
import boyFrontUrl from '../boy-walk-front.png';
import boyRightUrl from '../boy-walk-right.png';
import boyLeftUrl from '../boy-walk-left.png';

export function person(p, avatar = 'girl') {
  const root = group(p);
  const isGirl = avatar === 'girl';
  const loader = new T.TextureLoader();

  function loadTex(url) {
    const t = loader.load(url);
    t.colorSpace = T.SRGBColorSpace;
    t.wrapS = T.ClampToEdgeWrapping;
    t.wrapT = T.ClampToEdgeWrapping;
    t.generateMipmaps = true;
    t.minFilter = T.LinearMipmapLinearFilter;
    t.magFilter = T.LinearFilter;
    t.repeat.set(0.25, 1);
    t.offset.set(0, 0);
    return t;
  }

  const frontTex = loadTex(isGirl ? girlFrontUrl : boyFrontUrl);
  const rightTex = loadTex(isGirl ? girlRightUrl : boyRightUrl);
  const leftTex = loadTex(isGirl ? girlLeftUrl : boyLeftUrl);

  const geo = new T.PlaneGeometry(1.7, 2.25);
  geo.translate(0, 1.12, 0);

  const mat = new T.MeshStandardMaterial({
    map: frontTex,
    transparent: true,
    alphaTest: 0.1,
    roughness: 0.65,
    metalness: 0.05,
    side: T.DoubleSide
  });

  const spriteMesh = new T.Mesh(geo, mat);
  spriteMesh.castShadow = true;
  spriteMesh.receiveShadow = false;
  root.add(spriteMesh);

  const blob = shadow(root, 0, 0, 0.58, 0.42, 0.38);

  let currentMap = frontTex;
  let currentFrame = -1;

  function update({ moving, speed, dx, dz, time, cameraYaw, busy }) {
    spriteMesh.rotation.y = cameraYaw;

    if (moving && speed > 0.04) {
      const relX = dx * Math.cos(cameraYaw) - dz * Math.sin(cameraYaw);
      const relZ = dx * Math.sin(cameraYaw) + dz * Math.cos(cameraYaw);

      let targetTex = frontTex;
      if (Math.abs(relX) > Math.abs(relZ) * 0.5) {
        targetTex = relX > 0 ? rightTex : leftTex;
      }

      if (mat.map !== targetTex) {
        mat.map = targetTex;
        mat.needsUpdate = true;
      }

      const frameIndex = Math.floor((time * 8.5) % 4);

      if (currentFrame !== frameIndex || mat.map !== currentMap) {
        currentMap = targetTex;
        currentFrame = frameIndex;
        targetTex.repeat.set(0.25, 1);
        targetTex.offset.set(frameIndex * 0.25, 0);
      }

      spriteMesh.position.y = Math.abs(Math.sin(time * 10)) * 0.09;
    } else {
      if (mat.map !== frontTex || currentFrame !== 0) {
        frontTex.repeat.set(0.25, 1);
        frontTex.offset.set(0, 0);
        mat.map = frontTex;
        mat.needsUpdate = true;
        currentMap = frontTex;
        currentFrame = 0;
      }
      spriteMesh.position.y = Math.sin(time * 2.2) * 0.025;
    }

    if (busy) {
      spriteMesh.rotation.z = Math.sin(time * 16) * 0.07;
    } else {
      spriteMesh.rotation.z = 0;
    }
  }

  return { root, spriteMesh, blob, update, tool: { visible: false } };
}

