import {createTowerPrefab,TOWER_PREFABS} from './tower-prefab-kit.mjs';
export const ISLAND_SCENE_SCHEMA='noar.island-scene/1';
export const ISLAND_ASSETS=Object.freeze([
['FI-001-Cloverlight-Rise.glb','Meadow','Cloverlight Rise'],['FI-002-Windbell-Orchard.glb','Meadow','Windbell Orchard'],['FI-003-Fernstep-Vale.glb','Meadow','Fernstep Vale'],['FI-004-Sunmote-Commons.glb','Meadow','Sunmote Commons'],['FI-005-Amberfall-Meadow.glb','Meadow','Amberfall Meadow'],
['FI-011-Whisperpine-Crown.glb','Forest','Whisperpine Crown'],['FI-012-Ravenwood-Crown.glb','Forest','Ravenwood Crown'],['FI-013-Mossbarrow.glb','Forest','Mossbarrow'],['FI-014-Emberpine-Knoll.glb','Forest','Emberpine Knoll'],['FI-015-Elderwood-Split.glb','Forest','Elderwood Split'],
['FI-021-Sunspine-Mesa.glb','Desert','Sunspine Mesa'],['FI-022-Redglass-Spire.glb','Desert','Redglass Spire'],['FI-023-Copperwind-Table.glb','Desert','Copperwind Table'],['FI-024-Suncleft-Buttes.glb','Desert','Suncleft Buttes'],['FI-025-Dunehook-Reach.glb','Desert','Dunehook Reach'],
['FI-031-Frostwake-Reach.glb','Tundra','Frostwake Reach'],['FI-032-Blueglass-Fjord.glb','Tundra','Blueglass Fjord'],['FI-033-Stormhorn-Shelf.glb','Tundra','Stormhorn Shelf'],['FI-034-Paleveil-Glacier.glb','Tundra','Paleveil Glacier'],['FI-035-Rimewatch-Peaks.glb','Tundra','Rimewatch Peaks']]);
const variants=[0,1,2,3,4,5,6,7,8,9,2,3,4,5,6,7,8,1,0,9];
export function createIslandScene(index){
 if(!Number.isInteger(index)||index<0||index>=ISLAND_ASSETS.length)throw Error('Island out of range');
 const [asset,biome,name]=ISLAND_ASSETS[index];
 const tower=createTowerPrefab(TOWER_PREFABS[variants[index]].id,{center:[0,35,0],index});
 return {schema:ISLAND_SCENE_SCHEMA,id:`noar-island-${String(index+1).padStart(2,'0')}`,index,number:index+1,name,biome,
  island:{asset:`assets/floating-islands/${asset}`,scale:7,surfaceY:35,collisionRadius:30},tower,
  spawn:[tower.start[0],35,tower.start[2]],summit:tower.portal,
  objective:`Ascend ${tower.name} and reach the summit`,nextSceneId:index+1<ISLAND_ASSETS.length?`noar-island-${String(index+2).padStart(2,'0')}`:null};
}
export const ISLAND_SCENES=Object.freeze(ISLAND_ASSETS.map((_,i)=>createIslandScene(i)));
export function nextIslandScene(scene){return scene.nextSceneId?ISLAND_SCENES[scene.index+1]:null;}
