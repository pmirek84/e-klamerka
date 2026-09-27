import {group,box,ball,cylinder,tree,bake,palette as C} from './models.js';
import {REGIONS} from './regions.js';

export function buildRegions(scene){
  const roots=[];
  for(const [id,r] of Object.entries(REGIONS)){
    if(id==='farm')continue;
    const g=group(scene,r.x,0,r.z);roots.push(g);
    cylinder(g,r.rx+.35,r.rx-1.2,2.8,id==='quarry'?'#99999d':'#baa07b',0,-1.4,0,32).scale.z=r.rz/r.rx;
    cylinder(g,r.rx+.4,r.rx+.25,.24,id==='quarry'?'#b1bcb0':id==='meadow'?'#b0bb66':'#6e9e59',0,-.06,0,40).scale.z=r.rz/r.rx;
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2;ball(g,.8,id==='quarry'?'#9b9cad':'#b7b6a0',Math.cos(a)*r.rx,-1.4,Math.sin(a)*r.rz,1,1.2,1);}
    const path=(x,z,w,d)=>box(g,w,.035,d,'#d9c391',x,.085,z,.015);
    if(id==='woodland'){
      path(0,1,18,1.3);path(-3,2.5,1.2,4);
      for(const [i,[x,z,scale]] of [[-6,-4,1.5],[-2,-4,1.5],[3,-5,1.3],[6,-2,1.1],[-7,1,1.2],[-5,6,1],[0,6,1.2],[5,5,1.2]].entries())tree(g,x,z,scale,i);
      for(let i=0;i<4;i++){const log=cylinder(g,.25,.25,2,C.wood,-1+i*.34,.3+i%2*.5,-1);log.rotation.z=Math.PI/2;}
      // Little woodland camp: a low tent, a lantern and a ring of unlit stones.
      const tent=cylinder(g,0,1,1.7,'#dcad71',3,.85,2.9,3);tent.rotation.y=.5;
      for(let i=0;i<7;i++)ball(g,.17,'#979f91',2.7+Math.cos(i)*.6,.18,5+Math.sin(i)*.6);
      for(let i=0;i<18;i++){const x=Math.sin(i*4.2)*7,z=Math.cos(i*2.7)*6;if(Math.abs(z)<1.7)continue;cylinder(g,.06,.07,.24,'#efe3c4',x,.2,z);ball(g,.17,i%2?'#d89765':'#c9816e',x,.4,z,1,.5,1);}
    }
    if(id==='quarry'){
      path(0,3.5,1.5,10);path(1,-1,5,1.5);
      for(let i=0;i<9;i++){const a=i*.8;const rock=ball(g,1.2,'#8d98a4',Math.cos(a)*5,-.1+(i%3)*.3,Math.sin(a)*5-1,1,1.5+i%2,1);rock.rotation.y=a;}
      for(let i=0;i<7;i++){const x=.3+Math.cos(i*2.4)*2,z=-1+Math.sin(i*2.4)*1.6,h=1.2+(i%3)*.5;cylinder(g,.24,.33,h,'#79b8c9',x,h/2+.25,z,5);cylinder(g,0,.24,.6,'#afd7d9',x,h+.55,z,5);}
      for(let i=0;i<8;i++){box(g,.85,.09,.12,C.wood,2,.15,2.2+i*.45);}
      for(const x of [1.72,2.28])box(g,.06,.1,3.5,'#707c83',x,.2,3.75);
      const cart=group(g,2,.45,3.3);box(cart,1,.5,1.25,C.lightWood,0,.35,0);for(const x of [-.55,.55])for(const z of [-.45,.45]){const wheel=cylinder(cart,.18,.18,.1,'#667983',x,0,z);wheel.rotation.z=Math.PI/2;}
    }
    if(id==='meadow'){
      path(0,-2,20,1.4);path(-2,0,1.3,5);path(2,-2.3,4,1.5);
      for(let i=0;i<42;i++){const a=i*2.4,x=Math.cos(a)*(5+i%4),z=Math.sin(a)*(5+i%3);if(Math.abs(z+2)<1)continue;const stem=cylinder(g,.025,.03,.35,'#769b4b',x,.25,z);ball(g,.11,i%3?'#f7df9c':'#e4b2b3',stem.position.x,.46,z,1,.5,1);}
      tree(g,-6,5,1.1,2);tree(g,6,4,1.2,2);tree(g,-5,-5,1,2);
    }
    if(id==='lake'){
      path(0,-2,1.4,12);path(-2,2,8,1.4);
      // Azure water pond
      cylinder(g,6.5,6.5,.12,'#4fa5c9',0,.08,2,32);
      cylinder(g,6.8,6.8,.08,'#88c4d8',0,.06,2,32);
      // Wooden dock/pier
      const dock=group(g,0,.15,-1);
      for(let i=0;i<8;i++)box(dock,1.8,.1,.38,C.lightWood,0,.08,i*.42);
      for(const side of [-1,1]){for(let i=0;i<4;i++)cylinder(dock,.07,.09,.8,C.wood,side*.9,.2,i*.9);}
      // Little rowing boat
      const boat=group(g,1.8,.2,1.6);boat.rotation.y=.4;
      box(boat,1.8,.35,.9,'#b67b4c',0,.1,0);box(boat,1.5,.3,.6,'#d8ab79',0,.14,0);
      for(let i=0;i<8;i++){const a=i*.8;ball(g,.6,'#90aab6',Math.cos(a)*7.2,-.1,Math.sin(a)*6.2+2,1,1.1,1);}
      for(let i=0;i<14;i++){const x=Math.sin(i*3.1)*6,z=Math.cos(i*2.3)*5+2;if(Math.hypot(x,z-2)<4.5)continue;cylinder(g,.04,.05,.6,'#588950',x,.3,z);ball(g,.14,'#a8d594',x,.65,z,1,.4,1);}
    }
    if(id==='clouds'){
      path(-2,2,10,1.4);path(0,0,1.4,8);
      // Observatory tower & celestial dome
      const obs=group(g,0,0,0);
      cylinder(obs,2.2,2.5,2.4,'#ded8eb',0,1.2,0,16);
      ball(obs,2.1,'#9581bf',0,2.4,0,1,.8,1);
      // Brass telescope pointing up
      const scope=cylinder(obs,.16,.24,2.2,'#d8ab48',.6,3.6,-.4);
      scope.rotation.x=Math.PI*0.35;scope.rotation.z=-Math.PI*0.15;
      // Floating stardust crystals
      for(let i=0;i<8;i++){
        const a=i*0.8,x=Math.cos(a)*5.5,z=Math.sin(a)*4.8,h=1.4+(i%3)*.6;
        cylinder(g,.18,.25,h,'#b39ddb',x,h/2+.2,z,6);
        ball(g,.3,'#d1c4e9',x,h+.4,z,1,1.4,1);
      }
    }
    bake(g);
  }
  return roots;
}
export function buildWorldChanges(parent,state){
  const g=group(parent),w=state.world||{};
  function bridge(x,z,length,vertical,built,rotY=0){
    const b=group(g,x,0,z);
    if(rotY) b.rotation.y=rotY;
    else if(vertical) b.rotation.y=Math.PI/2;
    if(built){
      for(let i=0;i<Math.ceil(length/.42);i++)box(b,.39,.15,2.25,C.lightWood,-length/2+i*.42,.01,0);
      for(const side of [-1,1]){
        for(let x=-length/2;x<=length/2;x+=1.7){cylinder(b,.08,.11,1,C.wood,x,.43,side*1.19);ball(b,.105,C.cream,x,.94,side*1.19);}
        box(b,length,.08,.08,C.cream,0,.78,side*1.19);
      }
    }else{
      for(const end of [-1,1])for(let i=0;i<3;i++)box(b,.39,.15,2.25,C.lightWood,end*(length/2-i*.42),.01,0);
      for(const end of [-1,1]){
        box(b,.13,1.2,.13,C.wood,end*(length/2-.1),.6,-1.1);box(b,.13,1.2,.13,C.wood,end*(length/2-.1),.6,1.1);
        const bar=box(b,.13,.15,2.35,'#e2b67e',end*(length/2-.1),.75,0);bar.rotation.x=.16;
      }
    }
  }
  bridge(-16.4,0,9.6,false,true);
  bridge(0,-15.7,10.8,true,w.quarry);
  bridge(16.8,-3,10.2,false,w.meadow);
  bridge(0,15.9,10.8,true,w.lake);
  bridge(14.5,-14.5,12.5,false,w.clouds,-Math.PI*0.25);
  // Chest lid visibly opens and stays open after the one-time reward.
  const chest=group(g,-33,0,4);box(chest,1.05,.55,.75,C.wood,0,.36,0);for(const x of [-.38,.38])box(chest,.08,.58,.8,'#e6c67c',x,.36,0);
  const hinge=group(chest,0,.65,-.36);const lid=box(hinge,1.1,.18,.8,'#c89a5e',0,.02,.35);hinge.rotation.x=w.chest?-1.2:0;box(chest,.15,.16,.08,'#f6d785',0,.58,.4);
  if(w.orchard){for(let i=0;i<6;i++)tree(g,30+(i%3)*1.5,1+Math.floor(i/3)*2.6,.7,i%2*2);}
  else{box(g,4.5,.12,4,C.soil,31,.06,2);for(const z of [.5,1.7,2.9,4])box(g,4.2,.03,.1,C.lightWood,31,.14,z);}
  if(!w.windmill){box(g,2.6,.12,2.6,'#b9b8a1',34,.1,-4);for(const x of [33,35])box(g,.13,.7,.13,C.lightWood,x,.4,-3);}
  bake(g);
  let rotor=null;
  if(w.windmill){
    const mill=group(g,34,0,-4);cylinder(mill,.8,1.1,3.7,C.cream,0,1.9,0,8);cylinder(mill,0,1.25,1.4,C.roof,0,4.45,0,8);
    box(mill,.6,1.1,.1,C.roofEdge,0,.65,1.03);box(mill,.5,.5,.1,'#dca558',0,2.4,.9);bake(mill);
    rotor=group(g,34,3.5,-2.88);
    for(let i=0;i<4;i++){const arm=group(rotor);arm.rotation.z=i*Math.PI/2;box(arm,.1,2.1,.09,C.wood,0,1,0);box(arm,.56,1.3,.055,'#f9ead0',.2,1.34,.05);for(let j=0;j<4;j++)box(arm,.6,.04,.07,C.lightWood,.2,.8+j*.32,.09);}
    cylinder(rotor,.2,.2,.22,C.wood,0,0,.08).rotation.x=Math.PI/2;bake(rotor);
  }
  return {root:g,rotor};
}
