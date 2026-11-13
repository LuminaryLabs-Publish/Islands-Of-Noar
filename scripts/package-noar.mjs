import {cp,copyFile,mkdir,rm,readFile,writeFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ISLAND_SCENES} from '../kits/island-scene-kit.mjs';
import {validateTowerRoute} from '../kits/tower-object-kit.mjs';
const target='builds/noar';await rm(target,{recursive:true,force:true});await mkdir(target,{recursive:true});
for(const name of ['index.html','game','kits','assets/floating-islands'])await cp(name,`${target}/${name}`,{recursive:true});
const files={};for(const s of ISLAND_SCENES){if(!validateTowerRoute(s.tower).ok)throw Error('Unreachable tower: '+s.id);const p=target+'/'+s.island.asset;const data=await readFile(p);if(data.subarray(0,4).toString()!=='glTF')throw Error('Invalid GLB: '+p);files[s.island.asset]=createHash('sha256').update(data).digest('hex');}
files['index.html']=createHash('sha256').update(await readFile(`${target}/index.html`)).digest('hex');
await writeFile(`${target}/manifest.json`,JSON.stringify({schema:'noar.preview/1',version:'0.3.0-preview.1',scenes:ISLAND_SCENES.length,towerPrefabTypes:10,files},null,2)+'\n');
console.log('Built Islands of Noar preview: 20 GLBs, 20 scenes, 10 tower types. Root game entry: index.html.');
