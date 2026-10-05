import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fluffyTree } from './nature.js';
import { createHero } from './character.js';

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
export function tree(p,x,z,scale=1,variant=0,opts={}) {
  // Stylised lumpy foliage; kept the old signature so every caller gets the new look.
  return fluffyTree(p,x,z,scale*1.05,variant,opts);
}
// Window glass glows warmly at night (intensity driven by the day/night cycle).
export const windowGlass = () => material('#ffd98a',{emissive:'#ffb347',emissiveIntensity:0});
function windowPane(p,x,y,z,w=.7,h=.85) {
  box(p,w+.16,h+.16,.13,palette.cream,x,y,z);
  box(p,w,h,.14,'#294c57',x,y,z+.07);
  mesh(p,geo(`b${w-.08},${h-.1},.05,.035`,()=>new RoundedBoxGeometry(w-.08,h-.1,.05,1,.02)),'#ffd98a',x,y,z+.155,{emissive:'#ffb347',emissiveIntensity:0});
  box(p,.055,h,.07,palette.cream,x,y,z+.2);box(p,w,.055,.07,palette.cream,x,y,z+.2);
  box(p,w+.28,.09,.32,palette.lightWood,x,y-h/2-.06,z+.16);
}
function roof(p,w,d,wallY,c=palette.roof) {
  const rise=w*.38,run=w/2+.24,length=Math.hypot(run,rise),angle=Math.atan2(rise,run);
  // Layered shingle tiers for Pokopia/Bloomvale aesthetic
  const tiers = 4;
  for(const side of [-1,1]) {
    for(let t = 0; t < tiers; t++) {
      const frac = t / tiers;
      const tLen = length / tiers + .06;
      // Position along the slope from peak to eave
      const distDown = (t + .5) * (length / tiers);
      const perpX = side * Math.cos(angle) * distDown;
      const perpY = wallY + rise - Math.sin(angle) * distDown;
      const shingle = box(p, tLen, .12, d + .52 - (tiers - t) * .02, (t % 2 === 0 ? c : palette.roofEdge), perpX, perpY, 0);
      shingle.rotation.z = -side * (angle + .03);
    }
    // Decorative scalloped eaves fascia
    const fascia = box(p, length + .06, .18, .12, palette.cream, side * run / 2, wallY + rise / 2 - .03, d / 2 + .26);
    fascia.rotation.z = -side * angle;
    const fasciaBack = box(p, length + .06, .18, .12, palette.cream, side * run / 2, wallY + rise / 2 - .03, -d / 2 - .26);
    fasciaBack.rotation.z = -side * angle;
  }
  // Ridge cap along the apex
  cylinder(p, .13, .13, d + .62, palette.roofEdge, 0, wallY + rise + .03, 0, 10).rotation.x = Math.PI / 2;
  // Fill gable with warm wood plank styling
  const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, rise - .08); s.closePath();
  mesh(p, new T.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }), palette.cream, 0, wallY, -d / 2);
  // Gable beam truss accent
  for(const gz of [-d / 2 - .02, d / 2 + .02]) {
    const truss = box(p, .12, rise * .9, .08, palette.lightWood, 0, wallY + rise * .45, gz);
  }
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
  // Stucco walls with warm timber corner posts
  box(g,3.8,h,3.1,palette.cream,0,.35+h/2,0);
  for(const x of [-1.86,1.86])for(const z of [-1.53,1.53])box(g,.18,h+.06,.18,palette.lightWood,x,.35+h/2,z);
  for(let y=.52;y<h;y+=.37)box(g,3.74,.035,.04,'#e1ca9b',0,y,1.57);
  for(const side of [-1,1]) {
    const wall=group(g,side*1.94,0,0);wall.rotation.y=side*Math.PI/2;
    windowPane(wall,0,1.6,.01,.8,.85);
    for(const wx of [-.59,.59])box(wall,.25,.91,.08,'#86ac98',wx,1.6,.1);
    if(level>=2)windowPane(wall,0,2.96,.01,.65,.65);
  }
  // Front door with arched lintel and bronze knocker
  box(g,.96,1.55,.17,palette.roofEdge,-.55,1.13,1.62);
  box(g,.74,1.22,.09,'#4b8e96',-.55,1.1,1.73);
  ball(g,.055,'#edbc64',-.28,.98,1.81);
  box(g,1.1,.12,.22,palette.lightWood,-.55,1.94,1.68); // Door lintel

  // Front window with flower box
  windowPane(g,.85,1.58,1.61,.7,.82);
  for(const x of [.3,1.4])box(g,.23,.86,.12,'#86ac98',x,1.58,1.72);
  box(g,1.05,.24,.34,'#b7825b',.85,1.06,1.9); // Planter box
  for(let i=0;i<5;i++){
    ball(g,.13,'#729658',.5+.18*i,1.24,1.9);
    ball(g,.07,i%3===0?'#f59ea0':i%3===1?'#ffd464':'#9ec5f7',.5+.18*i,1.35,1.92);
  }

  // Entrance steps & porch doormat
  box(g,1.7,.14,.75,palette.lightWood,-.55,.41,1.9);
  box(g,2.0,.14,.5,'#c7bd9e',-.55,.15,2.35);
  box(g,.85,.04,.42,'#bd7951',-.55,.49,1.97);

  // Little porch hanging wall lantern by the entrance door
  const porchLamp = group(g, -.08, 1.72, 1.76);
  cylinder(porchLamp, .03, .03, .22, '#3b302b', 0, 0, 0).rotation.x = Math.PI / 2;
  box(porchLamp, .16, .22, .16, '#ffd98a', 0, -.12, .08);
  box(porchLamp, .2, .04, .2, '#3b302b', 0, -.01, .08);
  box(porchLamp, .18, .04, .18, '#3b302b', 0, -.23, .08);

  if(level>=2){windowPane(g,-.75,2.91,1.62,.66,.7);windowPane(g,.75,2.91,1.62,.66,.7);}
  roof(g,3.8,3.1,.35+h);

  // Masonry stone chimney with cap
  const chim = group(g, 1.05, h + .4, -.55);
  box(chim, .54, 1.8, .54, '#7a8084', 0, .5, 0);
  // Irregular stone relief bands
  for(let ci = 0; ci < 4; ci++) {
    box(chim, .58, .22, .58, (ci % 2 === 0 ? '#63696d' : '#8d9499'), 0, .1 + ci * .38, 0);
  }
  box(chim, .72, .16, .72, '#484d50', 0, 1.45, 0); // Stone top mantle
  cylinder(chim, .15, .15, .25, '#3b3d40', 0, 1.62, 0); // Flue pot

  // Terracotta flower pots on porch
  for(const x of [-1.5,1.5]) {
    cylinder(g,.24,.17,.34,'#c78060',x,.53,1.82);
    ball(g,.33,'#6d9b52',x,.86,1.82);
    ball(g,.1,'#f1ce74',x+.08,1.12,1.84);
    ball(g,.08,'#ea7996',x-.08,1.06,1.82);
  }
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
export function pen(p,built,level=1) {
  const g=group(p,5.3,0,2.3);g.userData.place='pen';
  const width=level>=2?6.2:5.2;
  box(g,width,.08,4.2,built?'#b3c579':'#a4b870',0,.05,0,.15);
  if(!built) {
    for(const x of [-2.6,2.6])for(const z of [-2.1,2.1])box(g,.14,.4,.14,palette.lightWood,x,.2,z);
    for(const z of [-2.1,2.1])box(g,5.2,.045,.06,palette.cream,0,.1,z);
    return bake(g);
  }
  fence(g,0,0,width,4.2);
  const hutch=group(g,0,0,-.8);box(hutch,2,.9,1.3,palette.lightWood,0,1,0);box(hutch,.65,.65,.08,'#674934',.42,.91,.69);
  for(const x of [-.8,.8])for(const z of [-.5,.5])box(hutch,.13,.65,.13,palette.wood,x,.33,z);
  roof(hutch,2,1.3,1.5);
  const ramp=box(hutch,.72,.09,1.15,palette.wood,.42,.37,1.12);ramp.rotation.x=.42;
  for(let i=0;i<4;i++)box(hutch,.67,.08,.09,palette.lightWood,.42,.14+i*.11,1.62-i*.23);
  cylinder(g,.3,.33,.16,'#819cac',1.5,.13,1.1);cylinder(g,.24,.24,.012,'#81cbd1',1.5,.22,1.1);
  box(g,.7,.27,.5,'#e7bf6b',-1.6,.23,-1);
  if(level>=2){
    box(g,1.4,.65,1,'#c8ab82',-2,.4,1.1);roof(g,1.4,1,.85,'#ac7245');
    box(g,.5,.25,.8,'#e7bf6b',-1.8,.15,1.2);
  }
  if(level>=3){
    box(g,1.3,.2,.4,'#98a7a7',2.1,.15,-1.2);cylinder(g,.18,.18,.02,'#81cbd1',2.1,.26,-1.2);
  }
  return bake(g);
}
export function stall(p,built) {
  const g=group(p,-1.2,0,8.5);g.userData.place='stall';shadow(g,0,0,1.5,1.3);
  if(!built){
    box(g,2,.12,1.5,'#c2b090',0,.06,0);
    for(const x of [-.9,.9])for(const z of [-.6,.6])box(g,.1,.35,.1,palette.wood,x,.2,z);
    return bake(g);
  }
  // Wooden deck and counter
  box(g,2.2,.15,1.6,palette.lightWood,0,.1,0);
  box(g,2,.85,.8,'#b98b5a',0,.52,.25);
  box(g,2.15,.12,1,palette.cream,0,.96,.25);
  // Posts supporting awning
  for(const x of [-.95,.95])box(g,.11,2.1,.11,palette.wood,x,1.1,-.55);
  for(const x of [-.95,.95])box(g,.11,1.9,.11,palette.wood,x,1,.55);
  // Scalloped striped fabric awning
  for(let i=0;i<5;i++){
    const awn=box(g,.44,.1,1.8,i%2?'#e06b52':'#fff1d2',-.88+i*.44,2.2,0);awn.rotation.x=.12;
    box(g,.43,.25,.08,i%2?'#e06b52':'#fff1d2',-.88+i*.44,1.95,.88);
  }
  // Crates with apples, carrots and cute pumpkins
  box(g,.55,.22,.55,palette.wood,-.6,.98,.25);
  for(let i=0;i<4;i++)ball(g,.09,'#e04a4a',-.7+i%2*.18,1.12,.17+Math.floor(i/2)*.18);
  box(g,.55,.22,.55,palette.wood,.6,.98,.25);
  for(let i=0;i<3;i++)cylinder(g,.05,.02,.24,'#e89240',.52+i*.1,1.1,.25).rotation.z=.4;

  // Center display: cute harvest pumpkin
  const pmp = ball(g, .15, '#e87b28', 0, 1.14, .25, 1.2, .85, 1.2);
  cylinder(g, .025, .02, .08, '#4d753b', 0, 1.26, .25);

  // Side rustic barrel
  const barrel = cylinder(g, .24, .2, .55, '#82593b', 1.28, .36, .2, 10);
  cylinder(g, .25, .25, .04, '#54463d', 1.28, .22, .2, 10);
  cylinder(g, .25, .25, .04, '#54463d', 1.28, .48, .2, 10);
  return bake(g);
}
export function helper(p,active) {
  const root=group(p,-3.8,0,6.8);root.userData.place='helper';
  if(!active){
    box(root,.4,.7,.4,'#c8ab82',0,.35,0);
    ball(root,.18,'#d5ba8c',0,.8,0);
    return {root,update:()=>{}};
  }
  shadow(root,0,0,.55,.45);
  const body=group(root);
  // Franek helper: friendly gardener in denim overalls, plaid shirt & straw hat
  // Legs and boots
  box(body,.13,.35,.16,'#3d678a',-.12,.18,0);
  box(body,.13,.35,.16,'#3d678a',.12,.18,0);
  box(body,.14,.12,.22,'#5a3d28',-.12,.06,.03);
  box(body,.14,.12,.22,'#5a3d28',.12,.06,.03);
  // Overalls torso
  box(body,.42,.45,.28,'#467199',0,.55,0);
  cylinder(body,.18,.2,.35,'#df6c4f',0,.82,0);
  // Head & face
  const head=group(body,0,1.15,0);
  ball(head,.2,'#f4d9bf',0,0,0,1,1.05,.95);
  // Eyes & rosy cheeks
  for(const s of [-1,1]){
    ball(head,.025,'#2b2219',s*.07,.02,.17);
    ball(head,.035,'#f09b8d',s*.12,-.04,.15);
  }
  // Straw hat
  cylinder(head,.48,.48,.04,'#e5c583',0,.16,0);
  cylinder(head,.28,.28,.18,'#d3aa5e',0,.26,0);
  // Watering can in hands
  const can=group(body,.32,.55,.18);
  cylinder(can,.13,.15,.26,'#4e8489',0,0,0);
  const spout=cylinder(can,.03,.05,.28,'#4e8489',.14,.12,0);spout.rotation.z=-.75;
  const handle=new T.Mesh(new T.TorusGeometry(.1,.02,6,12),material('#4e8489'));handle.position.set(-.12,.06,0);can.add(handle);
  function update(time){
    body.position.y=Math.abs(Math.sin(time*2.5))*.03;
    can.rotation.z=Math.sin(time*2)*.2;
    head.rotation.y=Math.sin(time*.9)*.25;
  }
  return {root,body,update};
}

export function visitor(p,index=0) {
  const root=group(p);
  root.userData.place='stall';
  const body=group(root);
  const coatColors=['#4a7b64','#7c527e','#b86d3b','#4f6e91'];
  const hatColors=['#8a6e53','#5e4638','#a3835e','#3c556b'];
  const coat=coatColors[index%coatColors.length];
  const hat=hatColors[index%hatColors.length];

  // Traveler boots and legs
  box(body,.12,.3,.15,'#49392c',-.11,.15,0);
  box(body,.12,.3,.15,'#49392c',.11,.15,0);
  // Warm traveler coat
  cylinder(body,.22,.18,.65,coat,0,.55,0);
  cylinder(body,.24,.22,.28,coat,0,.82,0);
  // Traveler backpack
  box(body,.34,.42,.26,'#684b36',0,.65,-.24);
  cylinder(body,.08,.08,.32,'#987b5a',0,.86,-.24).rotation.z=Math.PI/2;
  // Head & traveler hat
  const head=group(body,0,1.14,0);
  ball(head,.19,'#f5ddc5',0,0,0);
  for(const s of [-1,1]){
    ball(head,.024,'#2a201b',s*.065,.02,.16);
    ball(head,.03,'#efa294',s*.11,-.03,.14);
  }
  cylinder(head,.44,.44,.04,hat,0,.15,0);
  cylinder(head,.26,.24,.16,hat,0,.24,0);
  shadow(root,0,0,.5,.4);

  function update(time,offset=0){
    body.position.y=Math.abs(Math.sin((time+offset)*3))*.035;
    head.rotation.y=Math.sin((time+offset)*1.2)*.3;
  }
  return {root,body,head,update,phase:index*1.8};
}

export function owl(p, x = 1.6, z = -5.0) {
  const root=group(p,x,0,z);root.userData.place='owl';shadow(root,0,0,.5,.4);
  // Carved wooden post with base and crossbar
  cylinder(root,.14,.18,.3,palette.wood,0,.15,0);
  cylinder(root,.11,.13,1.45,palette.wood,0,.85,0);
  const cross=cylinder(root,.09,.09,.8,palette.lightWood,0,1.52,0);cross.rotation.z=Math.PI/2;
  // Little lantern on one side of post
  const lantern=group(root,-.35,1.38,0);
  cylinder(lantern,.06,.06,.15,'#3a3328',0,0,0);
  ball(lantern,.045,'#ffea88',0,0,0);
  // The Wise Owl Klara
  const bird=group(root,0,1.6,0);
  // Body and breast plumage
  ball(bird,.3,'#825532',0,.24,0,.92,1.18,.92);
  ball(bird,.22,'#fbf3e2',0,.22,.12,.82,1.02,.55);
  // Head
  const head=group(bird,0,.52,0);
  ball(head,.26,'#926038',0,0,0,1.06,.94,1.02);
  // Big expressive owl eyes with golden rings & pupils
  for(const side of [-1,1]){
    ball(head,.11,'#ffe875',side*.1,.05,.19);
    ball(head,.08,'#ffffff',side*.1,.05,.22);
    ball(head,.052,'#26190e',side*.1,.05,.26);
    ball(head,.02,'#ffffff',side*.1-.015,.068,.285);
    const feather=box(head,.06,.18,.06,'#6f4322',side*.16,.24,-.02);feather.rotation.z=-side*.35;
  }
  // Beak
  const beak=cylinder(head,0,.045,.11,'#f0a032',0,-.03,.28);beak.rotation.x=Math.PI/2;
  // Wings
  const wings=[];
  for(const side of [-1,1]){
    const wing=ball(bird,.24,'#704322',side*.28,.22,-.02,.45,1.25,.88);
    wing.rotation.z=side*.22;
    wings.push(wing);
  }
  function update(time){
    head.rotation.y=Math.sin(time*.7)*.6+Math.sin(time*2.3)*.15;
    head.rotation.x=Math.sin(time*1.3)*.09;
    bird.position.y=1.6+Math.sin(time*2.2)*.018;
    wings[0].rotation.z=-.22+Math.sin(time*4)*.08;
    wings[1].rotation.z=.22-Math.sin(time*4)*.08;
  }
  return {root,bird,head,update};
}
export function garden(p,s) {
  const g=group(p,-4.8,0,5);g.userData.place='garden';
  const plot=(x,z)=>{
    // Enriched dark soil bed with raised wooden planter rim
    box(g,2.4,.18,2,'#593a26',x,.15,z,.09);
    for(const side of [-1,1]) {
      box(g,2.6,.25,.13,palette.lightWood,x,.24,z+side*1);
      box(g,.13,.25,2.1,palette.lightWood,x+side*1.24,.24,z);
    }
    // Wooden corner pegs
    for(const sx of [-1.24, 1.24]) for(const sz of [-1, 1]) {
      cylinder(g, .08, .08, .36, palette.wood, x + sx, .26, z + sz);
      ball(g, .06, palette.cream, x + sx, .45, z + sz);
    }
    for(let row=0;row<3;row++)for(let col=0;col<4;col++) {
      const px=x-.82+col*.55,pz=z-.63+row*.62;
      if(s.planted) {
        if(s.watered) {
          // Lush carrot with orange top poking out
          cylinder(g,.12,.04,.35,'#f07f24',px,.28,pz);
          // 4-leaf crown of carrot fronds
          for(let n=0;n<4;n++) {
            const leaf=box(g,.09,.38,.05,n%2?'#77b83d':'#549129',px+Math.cos(n*1.5)*.06,.58,pz+Math.sin(n*1.5)*.06);
            leaf.rotation.z=(n===0?-.4:n===2?.4:0);
            leaf.rotation.x=(n===1?-.4:n===3?.4:0);
          }
        } else {
          // Seedling sprouts
          cylinder(g,.04,.02,.12,'#e89240',px,.24,pz);
          const sprout=box(g,.06,.15,.04,'#8bc34a',px,.32,pz);sprout.rotation.z=.25;
        }
      } else {
        // Tilled soil mounds
        box(g,.38,.06,.14,'#422919',px,.25,pz);
      }
    }
  };
  plot(0,0);plot(0,2.65);
  for(let i=0;i<s.landLevel;i++)plot(16.1+i*2.8,0);

  // Little carved wooden garden sign
  const sign = group(g, 1.45, 0, -.8);
  cylinder(sign, .06, .07, .9, palette.wood, 0, .45, 0);
  box(sign, .7, .45, .08, palette.lightWood, 0, .85, 0);
  // Little orange carrot painted on sign
  cylinder(sign, .04, .01, .2, '#f07f24', 0, .84, .05).rotation.z = .6;
  box(sign, .03, .07, .02, '#77b83d', -.06, .93, .05).rotation.z = -.4;
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
// 3D chibi hero replaces the old flat sprite billboard.
export function person(p, avatar = 'girl') {
  return createHero(p, avatar);
}

export function cat(p, x = -1.7, z = 1.8) {
  const root = group(p, x, 0, z);
  root.userData.place = 'cat';
  shadow(root, 0, 0, .45, .38);

  const body = group(root);
  // Ginger tabby cat body with white tummy/bib
  const ginger = '#e88232', darkStripe = '#be5918', white = '#fff8ee', pink = '#f59a9e';
  ball(body, .21, ginger, 0, .21, 0, 1.05, .98, 1.28);
  ball(body, .13, white, 0, .19, .13, .9, .95, .6);
  ball(body, .11, darkStripe, 0, .26, -.06, .9, .3, .9);

  // 4 cute white paws
  const paws = [];
  for (const sx of [-.12, .12]) {
    for (const sz of [-.12, .14]) {
      const paw = ball(body, .06, white, sx, .055, sz, .9, .7, 1.1);
      paws.push(paw);
    }
  }

  // Head
  const head = group(body, 0, .35, .18);
  ball(head, .18, ginger, 0, 0, 0, 1.08, .94, .98);
  // White muzzle
  ball(head, .10, white, 0, -.035, .11, 1.15, .72, .75);
  // Pink nose
  ball(head, .024, pink, 0, -.01, .185);

  // Big expressive eyes
  const eyes = [];
  for (const s of [-1, 1]) {
    const e = group(head, s * .075, .035, .15);
    ball(e, .034, '#241d18', 0, 0, 0); // eye pupil
    ball(e, .011, '#ffffff', -.009, .01, .018); // reflection shine
    eyes.push(e);
  }

  // Ears (perky triangles with pink inner fuzz)
  const ears = [];
  for (const s of [-1, 1]) {
    const ear = group(head, s * .1, .14, 0);
    const outer = cylinder(ear, 0, .065, .12, ginger, 0, 0, 0, 4);
    outer.rotation.y = Math.PI / 4; outer.rotation.z = -s * .25;
    const inner = cylinder(ear, 0, .04, .08, pink, 0, -.01, .018, 4);
    inner.rotation.y = Math.PI / 4; inner.rotation.z = -s * .25;
    ears.push(ear);
  }

  // Curled tail
  const tail = group(body, 0, .22, -.22);
  cylinder(tail, .035, .04, .18, ginger, 0, .08, -.04).rotation.x = -.8;
  cylinder(tail, .025, .035, .16, ginger, 0, .19, -.08).rotation.x = -.2;
  ball(tail, .032, white, 0, .26, -.07); // white tip

  function update(time, petted = false) {
    body.position.y = Math.sin(time * 2.5) * .012; // breathing purr
    tail.rotation.y = Math.sin(time * 2.0) * .35 + (petted ? Math.sin(time * 6) * .2 : 0);
    head.rotation.y = Math.sin(time * .7) * .22;
    head.rotation.x = Math.sin(time * 1.1) * .06;
    if (petted) {
      ears.forEach((e, i) => { e.rotation.z = (i === 0 ? -1 : 1) * Math.sin(time * 8) * .15; });
    }
  }

  return { root, body, head, tail, ears, update };
}
