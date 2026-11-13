import {createTowerObject,validateTowerRoute} from './tower-object-kit.mjs';
export const TOWER_PREFAB_SCHEMA='noar.tower-prefab/1';
// Ten reusable tower silhouettes. All structural and traversal differences are data.
export const TOWER_PREFABS=Object.freeze([
  {id:'harbor-watch',name:'Harbor Watch',style:'citadel',ornament:'banners',roof:'crown',stepCount:25,rise:1.36,stepAngle:.4,palette:['#667b8a','#b7bbbd','#e4b77d','#7ce1ee']},
  {id:'windward-belfry',name:'Windward Belfry',style:'needle',ornament:'banners',roof:'spire',stepCount:29,rise:1.3,stepAngle:.43,palette:['#60786f','#b5c5a3','#b4a578','#e1f8ad']},
  {id:'mossbound-sanctum',name:'Mossbound Sanctum',style:'fortress',ornament:'vines',roof:'crown',stepCount:27,rise:1.42,stepAngle:.39,palette:['#485d53','#8a9f79','#bda78a','#90e7be']},
  {id:'sunward-obelisk',name:'Sunward Obelisk',style:'needle',ornament:'glyphs',roof:'spire',stepCount:31,rise:1.34,stepAngle:.41,palette:['#b67b51','#dfb785','#f5d693','#f9a852']},
  {id:'ember-citadel',name:'Ember Citadel',style:'fortress',ornament:'banners',roof:'crown',stepCount:30,rise:1.4,stepAngle:.42,palette:['#754b49','#be8870','#eec195','#ff8263']},
  {id:'azure-archive',name:'Azure Archive',style:'citadel',ornament:'glyphs',roof:'lantern',stepCount:28,rise:1.35,stepAngle:.44,palette:['#4e6a8b','#96b7c9','#d8d4bd','#63cefa']},
  {id:'duskspire',name:'Duskspire',style:'needle',ornament:'crystal',roof:'spire',stepCount:34,rise:1.3,stepAngle:.39,palette:['#57516d','#a79bbd','#a89eae','#bba3ff']},
  {id:'frostward-keep',name:'Frostward Keep',style:'fortress',ornament:'glyphs',roof:'lantern',stepCount:32,rise:1.36,stepAngle:.4,palette:['#657a8a','#c3d8de','#faf2e3','#a2e9ff']},
  {id:'aurora-monolith',name:'Aurora Monolith',style:'needle',ornament:'crystal',roof:'lantern',stepCount:35,rise:1.31,stepAngle:.42,palette:['#446c7b','#99a6cf','#d9dee9','#b2ffde']},
  {id:'noar-crown',name:'The Crown of Noar',style:'citadel',ornament:'crystal',roof:'spire',stepCount:38,rise:1.38,stepAngle:.4,palette:['#545a7f','#b8b2cf','#f2d8a6','#f9e6a0']},
]);
export function createTowerPrefab(id,{center=[0,35,0],index=0}={}){
  const data=TOWER_PREFABS.find(x=>x.id===id);
  if(!data)throw Error('Unknown tower prefab: '+id);
  const tower=createTowerObject({...data,id:`${data.id}-${index}`,center,seed:index+1,stepStart:(index%3)*0.1});
  const check=validateTowerRoute(tower);if(!check.ok)throw Error(`Invalid tower route: ${check.failures.join(', ')}`);
  return {...tower,prefabSchema:TOWER_PREFAB_SCHEMA,prefabId:id};
}
