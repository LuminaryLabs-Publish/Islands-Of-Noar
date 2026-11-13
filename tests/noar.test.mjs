import test from 'node:test';import assert from 'node:assert/strict';import {readFile,stat} from 'node:fs/promises';
import {PLAYER_MOTION,createTowerObject,validateTowerRoute} from '../kits/tower-object-kit.mjs';
import {parseGlb,multiply,trs} from '../game/webgl.mjs';
import {TOWER_PREFABS,createTowerPrefab} from '../kits/tower-prefab-kit.mjs';
import {ISLAND_SCENES,ISLAND_ASSETS,nextIslandScene} from '../kits/island-scene-kit.mjs';
import {findLanding,supportedSurface,safeProgress,portalReady,nextIndex,resolveTowerWall} from '../kits/island-progression-kit.mjs';
const assetRoot=new URL('../assets/floating-islands/',import.meta.url);
test('ten unique tower prefab definitions produce traversable paths',()=>{
 assert.equal(TOWER_PREFABS.length,10);assert.equal(new Set(TOWER_PREFABS.map(t=>t.id)).size,10);
 for(const cfg of TOWER_PREFABS){const t=createTowerPrefab(cfg.id);const result=validateTowerRoute(t);assert.equal(result.ok,true,cfg.id+' '+result.failures);assert.equal(t.ledges.length,cfg.stepCount);assert.equal(t.portal[1]>65,true);assert.ok(t.solids.length>110);assert.ok(t.ledges.every((l,i)=>i===0||l.top>t.ledges[i-1].top));}
});
test('reject towers outside jumpable physical constraints',()=>{
 assert.throws(()=>createTowerObject({rise:2.2}),/jump envelope/);
 assert.throws(()=>createTowerObject({stepCount:5}),/range/);
 assert.throws(()=>createTowerPrefab('not-real'),/Unknown tower/);
 assert.ok(PLAYER_MOTION.jumpSpeed**2/(2*PLAYER_MOTION.gravity)>1.5);
});
test('twenty separate scenes reference real original GLBs and link sequentially',async()=>{
 assert.equal(ISLAND_SCENES.length,20);assert.equal(new Set(ISLAND_SCENES.map(s=>s.id)).size,20);
 assert.deepEqual(Object.entries(ISLAND_SCENES.reduce((d,s)=>(d[s.biome]=(d[s.biome]||0)+1,d),{})),[['Meadow',5],['Forest',5],['Desert',5],['Tundra',5]]);
 for(const s of ISLAND_SCENES){assert.match(s.island.asset,/\.glb$/);assert.ok((await stat(new URL('../'+s.island.asset,import.meta.url))).size>300000);assert.equal(s.nextSceneId,nextIslandScene(s)?.id??null);assert.equal(s.tower.baseY,s.island.surfaceY);}
 assert.equal(ISLAND_ASSETS.length,20);assert.equal(nextIndex(19),null);assert.throws(()=>nextIndex(20));
});
test('landing contacts and checkpoints preserve upward progression',()=>{
 for(const s of ISLAND_SCENES){const steps=s.tower.ledges;const ground=findLanding(s,s.spawn[0],s.spawn[2],36,34);assert.equal(ground?.y,35);
 for(const l of steps){const hit=findLanding(s,l.center[0],l.center[2],l.top+.6,l.top-.4);assert.equal(hit?.y,l.top,`island ${s.index} step ${l.index}`);assert.equal(supportedSurface(s,l.center[0],l.center[2],l.top)?.y,l.top);}
 assert.ok(portalReady(s,{x:0,y:s.tower.summit,z:0}));assert.equal(portalReady(s,{x:0,y:35,z:0}),false);
 }
});
test('tower central shaft blocks traversal until summit',()=>{const s=ISLAND_SCENES[0];const [x,z]=resolveTowerWall(s,7,0,0,0,40);assert.ok(x>=4.55);assert.equal(z,0);assert.deepEqual(resolveTowerWall(s,7,0,0,0,s.tower.summit+1),[0,0]);});
test('progress persistence is bounded and recoverable',()=>{
 for(const v of ['',null,'not-json','{}','{"next":-1}','{"next":20}','{"next":"2"}'])assert.equal(safeProgress(v),0);
 assert.equal(safeProgress('{"next":18}'),18);
});
test('GLB model files have actual glTF 2.0 binary headers',async()=>{
 for(const s of ISLAND_SCENES){const b=await readFile(new URL('../'+s.island.asset,import.meta.url));assert.equal(b.toString('ascii',0,4),'glTF');assert.equal(b.readUInt32LE(4),2);assert.equal(b.readUInt32LE(8),b.length);}
});

test('all twenty actual GLBs decode into scene geometry',async()=>{
 for(const s of ISLAND_SCENES){const b=await readFile(new URL('../'+s.island.asset,import.meta.url));const {json,bin}=parseGlb(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
  assert.ok(json.scenes.length===1);assert.ok(json.nodes.length>40);assert.ok(json.meshes.length>40);assert.ok(bin.byteLength>100000);
 }
});
test('model transforms preserve Y-up translation and scale',()=>{const m=multiply(trs([3,35,1],[7,7,7]),trs([0,5,0],[1,1,1]));assert.equal(m[13],70);assert.equal(m[12],3);});
