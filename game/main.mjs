import {ISLAND_SCENES,nextIslandScene} from '../kits/island-scene-kit.mjs';
import {PLAYER_MOTION} from '../kits/tower-object-kit.mjs';
import {NoarRenderer} from './webgl.mjs';
const $=q=>document.querySelector(q), clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
import {NOAR_SAVE_KEY as SAVE_KEY,safeProgress,findLanding,supportedSurface,portalReady,resolveTowerWall} from '../kits/island-progression-kit.mjs';
const state={scene:ISLAND_SCENES[0],player:null,mode:'ground',checkpoint:null,highest:-1,visited:0,phase:'loading',clock:0,transition:0,noticeUntil:0};
const input=new Set();let jumpQueued=false;const camera={yaw:1.18,pitch:.21,distance:25};let renderer,last=0,acc=0,sceneRequest=0;const canvas=$('#world');
function message(text,seconds=3){$('#toast').textContent=text;$('#toast').classList.add('visible');state.noticeUntil=state.clock+seconds;}
function setTitle(t){$('#islandName').textContent=t.name;$('#region').textContent=t.biome.toUpperCase()+' ARCHIPELAGO';$('#counter').textContent=`${String(t.number).padStart(2,'0')} / 20`;$('#towerName').textContent=t.tower.name;$('#objective').textContent=t.objective;$('#steps').textContent=`0 / ${t.tower.stepCount}`;$('#sceneList').innerHTML='';
 for(let i=0;i<ISLAND_SCENES.length;i++){const item=document.createElement('span');item.className='scene-dot'+(i<t.index?' done':i===t.index?' active':'');item.title=`Island ${i+1}: ${ISLAND_SCENES[i].name}`;$('#sceneList').append(item);}}
async function enterScene(index){const generation=++sceneRequest;const scene=ISLAND_SCENES[index];if(!scene)throw Error('Invalid scene');state.phase='loading';$('#loading').classList.remove('hidden');$('#loadingStatus').textContent=`Arriving at ${scene.name}...`;
 try{const count=await renderer.loadIsland(scene.island.asset,scene.biome);if(generation!==sceneRequest)return;
 state.scene=scene;state.player={x:scene.spawn[0],y:scene.spawn[1],z:scene.spawn[2],vy:0,grounded:true,flight:false};state.checkpoint=[...scene.spawn];state.highest=-1;state.visited=Math.max(state.visited,index);state.phase='play';state.mode='ground';state.transition=0;setTitle(scene);$('#loading').classList.add('hidden');message(`${scene.name}  ·  ${count} imported mesh sections`,3);}
 catch(error){if(generation!==sceneRequest)return;state.phase='error';$('#loadingStatus').textContent='Unable to load island GLB: '+error.message;console.error(error);}}
function restartScene(){if(state.phase==='play'){const p=state.player;[p.x,p.y,p.z]=state.checkpoint;p.vy=0;p.flight=false;p.grounded=true;message('Returned to your last checkpoint',1.8);}}
function setFlight(on){const p=state.player;if(!p||state.phase!=='play')return;p.flight=!!on;p.grounded=!on&&p.grounded;p.vy=0;state.mode=on?'flying':'ground';message(on?'Free flight · Space rise · C descend':'Flight disengaged',2);}
function completeScene(){if(state.phase!=='play')return;const next=nextIslandScene(state.scene);state.phase=next?'transition':'complete';state.transition=0;
 if(next){try{localStorage.setItem(SAVE_KEY,JSON.stringify({next:next.index}));}catch{}message('The skyway opens · '+next.name,3.5);}
 else {try{localStorage.setItem(SAVE_KEY,JSON.stringify({next:0,complete:true}));}catch{}$('#ending').classList.remove('hidden');message('All twenty islands discovered',8);}}
function step(dt){state.clock+=dt;if(state.noticeUntil<state.clock)$('#toast').classList.remove('visible');
 if(state.phase==='transition'){state.transition+=dt;const p=state.player;p.y+=dt*8;p.z-=dt*11;state.mode='flying';if(state.transition>3.5)enterScene(state.scene.index+1);return;}
 if(state.phase!=='play')return;
 const p=state.player,moveX=Number(input.has('KeyD')||input.has('ArrowRight'))-Number(input.has('KeyA')||input.has('ArrowLeft')),moveZ=Number(input.has('KeyW')||input.has('ArrowUp'))-Number(input.has('KeyS')||input.has('ArrowDown'));
 const len=Math.hypot(moveX,moveZ)||1,spd=PLAYER_MOTION.moveSpeed*(input.has('ShiftLeft')?1.3:1)*(p.flight?1.65:1);
 p.x+=((Math.cos(camera.yaw)*moveX-Math.sin(camera.yaw)*moveZ)/len)*spd*dt;
 p.z+=((-Math.sin(camera.yaw)*moveX-Math.cos(camera.yaw)*moveZ)/len)*spd*dt;
 [p.x,p.z]=resolveTowerWall(state.scene,p.x-(Math.cos(camera.yaw)*moveX-Math.sin(camera.yaw)*moveZ)/len*spd*dt,p.z-(-Math.sin(camera.yaw)*moveX-Math.cos(camera.yaw)*moveZ)/len*spd*dt,p.x,p.z,p.y);
 const oldY=p.y;
 if(p.flight){const up=Number(input.has('Space'))-Number(input.has('KeyC')||input.has('ControlLeft'));p.y+=up*dt*12;p.y=clamp(p.y,sceneMinY(),state.scene.tower.summit+60);p.grounded=false;}
 else {
  if(p.grounded){const support=supportedSurface(state.scene,p.x,p.z,p.y);if(!support){p.grounded=false;p.vy=0;}else if(jumpQueued){p.vy=PLAYER_MOTION.jumpSpeed;p.grounded=false;jumpQueued=false;}}
  if(!p.grounded){p.vy-=PLAYER_MOTION.gravity*dt;p.y+=p.vy*dt;if(p.vy<=0){const land=findLanding(state.scene,p.x,p.z,oldY,p.y);if(land){p.y=land.y;p.vy=0;p.grounded=true;if(land.index>state.highest){state.highest=land.index;$('#steps').textContent=`${Math.min(state.highest+1,state.scene.tower.stepCount)} / ${state.scene.tower.stepCount}`;}
   if(land.kind==='ledge'&&land.index%7===6&&land.index>=0){state.checkpoint=[p.x,p.y,p.z];message(`Tower checkpoint ${Math.floor(land.index/7)+1} reached`,2);}}}}
 }
 if(p.y<state.scene.island.surfaceY-45){[p.x,p.y,p.z]=state.checkpoint;p.vy=0;p.flight=false;p.grounded=true;state.mode='ground';message('Recovered at checkpoint',2);}
 const near=portalReady(state.scene,p);
 $('#portalHint').classList.toggle('visible',near);if(near&&input.has('KeyE'))completeScene();
 const pct=clamp((p.y-state.scene.island.surfaceY)/(state.scene.tower.height),0,1);$('#heightFill').style.height=(pct*100).toFixed(1)+'%';$('#heightValue').textContent=Math.round(pct*100)+'%';
}
function sceneMinY(){return state.scene.island.surfaceY-32;}
function frame(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;acc+=dt;let steps=0;while(acc>=1/60&&steps++<4){step(1/60);acc-=1/60;}if(acc>1/60)acc=0;
 if(state.player&&renderer)renderer.render(state.scene,state.player,camera,state.clock,state.mode);requestAnimationFrame(frame);}
function onKeyDown(e){if(e.code==='Space'&&!e.repeat)jumpQueued=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyF'&&!e.repeat)setFlight(!state.player?.flight);if(e.code==='KeyR'&&!e.repeat)restartScene();if(e.code==='KeyN'&&!e.repeat){try{localStorage.removeItem(SAVE_KEY);}catch{}$('#ending').classList.add('hidden');enterScene(0);}if(e.code==='Escape')$('#help').classList.toggle('hidden');input.add(e.code);}
window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',e=>{input.delete(e.code);if(e.code==='Space')jumpQueued=false;});window.addEventListener('blur',()=>input.clear());
let touch=null;canvas.addEventListener('pointerdown',e=>{touch=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!touch)return;const dx=e.clientX-touch[0],dy=e.clientY-touch[1];camera.yaw-=dx*.0055;camera.pitch=clamp(camera.pitch+dy*.0035,-.2,1.05);touch=[e.clientX,e.clientY];});canvas.addEventListener('pointerup',()=>touch=null);canvas.addEventListener('pointercancel',()=>touch=null);canvas.addEventListener('wheel',e=>{camera.distance=clamp(camera.distance+e.deltaY*.02,12,46);},{passive:true});
for(const button of document.querySelectorAll('[data-key]')){const k=button.dataset.key;button.addEventListener('pointerdown',e=>{e.preventDefault();input.add(k);if(k==='Space')jumpQueued=true;button.setPointerCapture(e.pointerId);});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>{input.delete(k);if(k==='Space')jumpQueued=false;});}
$('#flight').addEventListener('click',()=>setFlight(!state.player?.flight));$('#restart').addEventListener('click',restartScene);$('#how').addEventListener('click',()=>$('#help').classList.toggle('hidden'));$('#closeHelp').addEventListener('click',()=>$('#help').classList.add('hidden'));$('#replay').addEventListener('click',()=>{try{localStorage.removeItem(SAVE_KEY);}catch{}$('#ending').classList.add('hidden');enterScene(0);});
window.NoarGame={getState:()=>({phase:state.phase,sceneId:state.scene.id,index:state.scene.index,mode:state.mode,highestStep:state.highest,player:state.player&&{...state.player},meshSections:renderer?.islandMeshes.length}),sceneCount:ISLAND_SCENES.length};
try{renderer=new NoarRenderer(canvas);let saved=null;try{saved=localStorage.getItem(SAVE_KEY);}catch{}enterScene(safeProgress(saved));requestAnimationFrame(frame);}catch(error){$('#loadingStatus').textContent=error.message;console.error(error);}
