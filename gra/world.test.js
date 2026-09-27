import test from 'node:test';
import assert from 'node:assert/strict';
import {insideWorld,regionAt,normalizeWorld} from '../src/world/regions.js';
import {findPath} from '../src/world/navigation.js';
const locked={landLevel:0,world:normalizeWorld()},open={landLevel:0,world:{quarry:true,meadow:true}};
test('walkable space includes bridges, excludes gaps and locked islands',()=>{
  assert(insideWorld(-16,0,locked));assert(!insideWorld(-16,3,locked));assert(!insideWorld(0,-16,locked));assert(!insideWorld(0,-29,locked));assert(!insideWorld(31,-1,locked));
  assert(insideWorld(0,-16,open));assert(insideWorld(17,-3,open));assert(!insideWorld(17,-5,open));assert.equal(regionAt(-29,0),'woodland');
});
test('routes cross all three bridges in both directions and stay over ground',()=>{
  for(const point of [[-29,1],[0,-27],[28,2]])for(const [start,end] of [[[0,6],point],[point,[0,6]]]){
    const route=findPath(start,end,(x,z)=>insideWorld(x,z,open));assert(route.length>0);assert(route.every(([x,z])=>insideWorld(x,z,open)));
    const last=route.at(-1);assert(Math.hypot(last[0]-end[0],last[1]-end[1])<.5);
  }
});
test('closed bridges cannot be crossed and routes do not cut obstacle corners',()=>{
  assert.equal(findPath([0,6],[0,-27],(x,z)=>insideWorld(x,z,locked)).length,0);
  const blocked=(x,z)=>insideWorld(x,z,open)&&!(x>-2&&x<2&&z>-3&&z<3);
  const route=findPath([0,6],[0,-9],blocked);assert(route.length>0);assert(route.every(p=>blocked(...p)));
});
