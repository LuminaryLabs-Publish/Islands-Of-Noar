// Single source of truth for island progression, jump surfaces and save recovery.
import {ISLAND_SCENES} from './island-scene-kit.mjs';
export const NOAR_SAVE_KEY='islands-of-noar-progress-v1';
export function safeProgress(raw){
 try {const data=JSON.parse(raw||'{}');return Number.isInteger(data.next)&&data.next>=0&&data.next<ISLAND_SCENES.length?data.next:0;}
 catch {return 0;}
}
export function findLanding(scene,x,z,oldY,newY){
 const candidates=[];
 if(x*x+z*z<scene.island.collisionRadius**2)candidates.push({y:scene.island.surfaceY,kind:'island',index:-1});
 for(const step of scene.tower.collision)if((x-step.x)**2+(z-step.z)**2<step.r**2)candidates.push(step);
 return candidates.filter(surface=>oldY>=surface.y-.08&&newY<=surface.y+.12).sort((a,b)=>b.y-a.y)[0]||null;
}
export function supportedSurface(scene,x,z,y){return findLanding(scene,x,z,y+.1,y-.1);}
export function portalReady(scene,player){return Math.hypot(player.x-scene.tower.center[0],player.z-scene.tower.center[2])<5.5&&player.y>=scene.tower.summit-1.2;}
export function nextIndex(index){if(!Number.isInteger(index)||index<0||index>=ISLAND_SCENES.length)throw Error('Bad island index');return index+1<ISLAND_SCENES.length?index+1:null;}

export function resolveTowerWall(scene,fromX,fromZ,toX,toZ,feetY){
 const [cx,,cz]=scene.tower.center,half=4.55;
 if(feetY>=scene.tower.summit||feetY<scene.tower.baseY)return [toX,toZ];
 const dx=toX-cx,dz=toZ-cz;if(Math.abs(dx)>=half||Math.abs(dz)>=half)return [toX,toZ];
 const oldX=fromX-cx,oldZ=fromZ-cz;
 if(Math.abs(oldX)>Math.abs(oldZ))return [cx+Math.sign(oldX||dx||1)*half,toZ];
 return [toX,cz+Math.sign(oldZ||dz||1)*half];
}
