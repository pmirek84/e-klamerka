import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL, normalize, transact, BREED_TIME, MAX_BABIES, loadGame } from '../src/game.js';
test('legacy save preserves resources, house and rabbit family',()=>{
  const old={name:'Tola',wood:17,stone:9,coins:31,babies:7,house:true,houseLevel:2,pen:true,rabbits:true,nextBirthAt:50};
  const s=loadGame({getItem:key=>key==='farm-v2'?JSON.stringify(old):null});
  assert.equal(s.houseLevel,2);assert.equal(s.coins,31);assert.equal(s.babies,7);assert.equal(s.name,'Tola');assert.equal(s.nextBirthAt,null);
});
test('a baby is sold exactly once and parents are preserved',()=>{
  const start={...INITIAL,pen:true,rabbits:true,babies:1,coins:8};
  const sale=transact(start,'sell-baby');assert.equal(sale.state.coins,13);assert.equal(sale.state.babies,0);assert.equal(sale.state.rabbits,true);
  const again=transact(sale.state,'sell-baby');assert.equal(again.ok,false);assert.strictEqual(again.state,sale.state);assert.equal(start.coins,8);
});
test('feeding is charged once, does not restart pending pregnancy, and produces one baby',()=>{
  const start={...INITIAL,pen:true,rabbits:true,carrots:2};
  const fed=transact(start,'feed',1000);assert.equal(fed.state.carrots,0);
  assert.equal(transact(fed.state,'feed',1500).ok,false);
  assert.equal(transact(fed.state,'tick',1000+BREED_TIME-1).ok,false);
  const born=transact(fed.state,'tick',1000+BREED_TIME);assert.equal(born.state.babies,1);assert.equal(born.state.carrots,0);assert.equal(born.state.nextBirthAt,null);
  assert.equal(transact(born.state,'tick',999999).ok,false);
});
test('capacity blocks feeding without taking payment',()=>{
  const s={...INITIAL,pen:true,rabbits:true,babies:MAX_BABIES,carrots:10};
  assert.strictEqual(transact(s,'feed').state,s);
});
test('shop and garden form a complete paid production loop',()=>{
  let s={...INITIAL};s=transact(s,'buy-seeds').state;assert.equal(s.coins,6);assert.equal(s.seeds,1);
  s=transact(s,'garden').state;assert.equal(s.seeds,0);assert.equal(s.coins,6);
  s=transact(s,'garden').state;s=transact(s,'garden').state;assert.equal(s.carrots,3);assert.equal(s.planted,false);
  assert.equal(transact(s,'garden').ok,false);
});
test('failed payments leave the whole state intact and gathering permits recovery from zero coins',()=>{
  const broke={...INITIAL,coins:0,wood:0,stone:0};assert.strictEqual(transact(broke,'buy-seeds').state,broke);assert.strictEqual(transact(broke,'house').state,broke);
  const logs=transact(broke,'forest').state;const sale=transact(logs,'sell-wood').state;assert.equal(sale.coins,2);assert.equal(sale.wood,0);
});
test('normalization clamps invalid counts and supports each upgrade',()=>{
  const s=normalize({coins:-9,houseLevel:10,landLevel:40});assert.equal(s.coins,0);assert.equal(s.houseLevel,3);assert.equal(s.landLevel,3);
  let g={...INITIAL,wood:100,stone:100,coins:100};for(let i=0;i<3;i++)g=transact(g,'house').state;assert.equal(g.houseLevel,3);assert.equal(transact(g,'house').ok,false);
});

test('world migration preserves the farm and defaults to an open woodland',()=>{
  const s=normalize({coins:24,houseLevel:2});assert.equal(s.coins,24);assert.deepEqual(s.world.visited,['farm']);assert.equal(s.world.quarry,false);assert.equal(s.crystals,0);
});
test('bridge unlocking is paid once, requires a home and persists',()=>{
  let s={...INITIAL,wood:100,stone:100,crystals:10};assert.equal(transact(s,'unlock:quarry').ok,false);
  s={...s,houseLevel:1};s=transact(s,'unlock:quarry').state;assert.equal(s.wood,90);assert.equal(s.stone,94);assert.equal(s.world.quarry,true);
  assert.strictEqual(transact(s,'unlock:quarry').state,s);assert.equal(normalize(JSON.parse(JSON.stringify(s))).world.quarry,true);
  s=transact(s,'unlock:meadow').state;assert.equal(s.crystals,7);assert.equal(s.world.meadow,true);
});
test('locked regions cannot produce resources; forest chest cannot be claimed twice',()=>{
  assert.equal(transact(INITIAL,'crystals').ok,false);const chest=transact(INITIAL,'chest');assert.equal(chest.state.coins,16);assert.equal(chest.state.seeds,2);assert.strictEqual(transact(chest.state,'chest').state,chest.state);
});
test('remote gathering has a cooldown and meadow buildings improve future harvests',()=>{
  let s={...INITIAL,houseLevel:1,wood:100,stone:100,coins:100,crystals:10};s=transact(s,'unlock:quarry').state;
  const mined=transact(s,'crystals',100000);assert.equal(mined.state.crystals,11);assert.equal(transact(mined.state,'crystals',100001).ok,false);assert.equal(transact(mined.state,'crystals',112000).ok,true);
  s=transact(mined.state,'unlock:meadow').state;s=transact(s,'orchard').state;s=transact(s,'windmill').state;s=transact({...s,planted:true,watered:true},'garden').state;assert.equal(s.carrots,7);
});
