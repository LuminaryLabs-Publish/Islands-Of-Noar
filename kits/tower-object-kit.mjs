// Product-scoped Tower Object Kit. Its geometry descriptors are renderer-neutral.
export const TOWER_OBJECT_SCHEMA = 'noar.tower-object/1';
export const PLAYER_MOTION = Object.freeze({gravity: 20, jumpSpeed: 9.4, moveSpeed: 8.5, radius: 0.52});
const finite = n => typeof n === 'number' && Number.isFinite(n);
export const reachedHeight = (jumpSpeed = PLAYER_MOTION.jumpSpeed, gravity = PLAYER_MOTION.gravity) => jumpSpeed ** 2 / (2 * gravity);
export function createTowerObject(spec = {}) {
  const {
    id = 'tower', name = 'Tower', center = [0, 35, 0], stepCount = 28,
    rise = 1.36, radius = 7.2, stepAngle = 0.40, stepStart = 0,
    palette = ['#7c8c9e', '#b5b3ac', '#c5a574', '#70d9e9'], style = 'citadel',
    ornament = 'banners', roof = 'crown', seed = 1,
  } = spec;
  if (!Array.isArray(center) || center.length !== 3 || center.some(x => !finite(x))) throw Error('Tower center must be finite XYZ');
  if (!Number.isInteger(stepCount) || stepCount < 14 || stepCount > 48) throw Error('Tower steps outside supported range');
  if (!finite(rise) || rise <= 0 || rise > reachedHeight() * 0.76) throw Error('Tower ascent exceeds jump envelope');
  if (!finite(radius) || radius < 5.8 || radius > 9.5 || !finite(stepAngle) || stepAngle <= 0 || stepAngle > 0.5) throw Error('Tower route unsupported');
  if (!Array.isArray(palette) || palette.length !== 4 || palette.some(x => !/^#[0-9a-f]{6}$/i.test(x))) throw Error('Invalid tower palette');
  const [cx, by, cz] = center, height = (stepCount + 1) * rise;
  const solids = [], ledges = [], collision = [];
  const box = (x,y,z,w,h,d,material='stone',yaw=0,part='architectural') => {
    const node = {type:'box', x,y,z,w,h,d,material,yaw,part};
    solids.push(node); return node;
  };
  box(cx, by + height/2, cz, 8, height, 8, 'core', 0, 'tower-core');
  box(cx, by + 0.8, cz, 13.5, 1.6, 13.5, 'trim', 0, 'base');
  for (const [dx,dz] of [[-4,-4],[4,-4],[-4,4],[4,4]]) {
    box(cx+dx, by+height/2, cz+dz, 1.25, height+3, 1.25, 'trim',0,'buttress');
    for (let y=by+3;y<by+height-2;y+=6.8) box(cx+dx, y, cz+dz, 1.6,0.56,1.6,'accent',0,'buttress-band');
  }
  // Architectural massing: the same ascent contract supports three different silhouettes.
  if (style === 'fortress') {
    for (const [dx,dz] of [[-4.6,-4.6],[4.6,-4.6],[-4.6,4.6],[4.6,4.6]]) {
      box(cx+dx,by+height*.43,cz+dz,2.7,height*.86,2.7,'core',0,'corner-turret');
      box(cx+dx,by+height*.86+.58,cz+dz,3.25,1.16,3.25,'accent',0,'turret-crown');
      box(cx+dx,by+height*.86+2.7,cz+dz,.85,3.5,.85,'trim',0,'turret-needle');
    }
    for (let tier=1;tier<4;tier++)box(cx,by+height*tier/4,cz,11.6,.95,11.6,'trim',0,'defense-band');
  } else if (style === 'needle') {
    for(let side=0;side<4;side++) {
      const angle=side*Math.PI/2;
      for(let tier=0;tier<4;tier++) {
        const h=height*(.68+tier*.055),r=4.65+tier*.22;
        box(cx+Math.cos(angle)*r,by+h/2,cz+Math.sin(angle)*r,.4,h,.52,'trim',angle,'vertical-fin');
      }
    }
    box(cx,by+height*.75,cz,10,1.2,10,'accent',0,'sky-gallery');
  } else {
    for (const a of [0,Math.PI/2,Math.PI,3*Math.PI/2]) {
      box(cx+5.2*Math.cos(a),by+height*.38,cz+5.2*Math.sin(a),1.6,height*.76,1.6,'core',a,'outer-pier');
      box(cx+5.2*Math.cos(a),by+height*.76+1.1,cz+5.2*Math.sin(a),2.3,2.2,2.3,'accent',a,'pier-finial');
    }
    for(let h=10;h<height-3;h+=11)box(cx,by+h,cz,11.2,.6,11.2,'trim',0,'high-gallery');
  }
  for (let level = 0; level < stepCount; level++) {
    const theta = stepStart + level * stepAngle;
    const x = cx + radius*Math.cos(theta), z = cz + radius*Math.sin(theta);
    const top = by + (level + 1)*rise;
    const ledge = {index:level,center:[x,top,z],angle:theta, width:3.8, depth:3.5, top, checkpoint:level%7===6};
    ledges.push(ledge);
    box(x,top-0.32,z,3.8,0.64,3.5,'step',theta,'jump-platform');
    box(x,top-0.71,z,2.2,0.2,2.15,'trim',theta,'platform-support');
    if (level % 3===0) {
      box(cx+4.17*Math.cos(theta), top+0.66, cz+4.17*Math.sin(theta),0.4,1.3,0.4,'accent',theta,'rune-light');
    }
    if (level%6===3) {
      box(cx+9*Math.cos(theta),top+1.25,cz+9*Math.sin(theta),0.24,2.5,0.24,'trim',theta,'banner-post');
      box(cx+9*Math.cos(theta),top+1.55,cz+9*Math.sin(theta),0.2,1.3,0.9,'accent',theta,'banner');
    }
    collision.push({x,z,y:top,r:2.45,kind:'ledge',index:level});
  }
  const summit = by+height;
  box(cx,summit-0.5,cz,12,1,12,'step',0,'summit-floor');
  for (let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    box(cx+5.6*Math.cos(a),summit+0.67,cz+5.6*Math.sin(a),1.1,1.35,1.1,'trim',a,'crenellation');
  }
  for (let i=0;i<6;i++) {
    const a=i*Math.PI/3;
    box(cx+3.4*Math.cos(a),summit+3.4,cz+3.4*Math.sin(a),0.45,6.8,0.45,'accent',a,'roof-spire');
  }
  box(cx,summit+3.0,cz,4.7,0.45,4.7,'accent',0,'summit-canopy');
  box(cx,summit+1.35,cz,2.1,2.7,2.1,'portal',0,'portal');
  collision.push({x:cx,z:cz,y:summit,r:5.95,kind:'summit',index:stepCount});
  // Vertical decoration varies independently of the collision route.
  const belt = style==='needle'?3.5:style==='fortress'?6.2:5.1;
  for(let y=by+belt;y<summit-1;y+=belt) {
    box(cx,y,cz,9.1,0.52,9.1,'trim',0,'cornice');
    for(let f=0;f<4;f++){
      const a=f*Math.PI/2, px=cx+4.09*Math.cos(a), pz=cz+4.09*Math.sin(a);
      box(px,y-1.35,pz,0.18,2.15,1.2,ornament==='crystal'?'portal':'accent',a,'window');
    }
  }
  if(roof==='spire')box(cx,summit+6.2,cz,1.3,7.5,1.3,'accent',0,'pinnacle');
  if(roof==='lantern')box(cx,summit+5.1,cz,3.3,4,3.3,'portal',0,'lantern');
  const start=[cx+radius+2.1,by,cz];
  return {schema:TOWER_OBJECT_SCHEMA,id,name,style,ornament,roof,seed,center,baseY:by,height,stepCount,rise,stepAngle,palette,solids,ledges,collision,summit,start,portal:[cx,summit+1.35,cz]};
}
export function validateTowerRoute(tower, motion=PLAYER_MOTION){
  const jumpHeight = reachedHeight(motion.jumpSpeed,motion.gravity);
  const failures=[];
  if(tower.rise>jumpHeight*0.76)failures.push('vertical gap');
  for(let i=1;i<tower.ledges.length;i++){
    const [ax,,az]=tower.ledges[i-1].center, [bx,,bz]=tower.ledges[i].center;
    const distance=Math.hypot(ax-bx,az-bz);
    const airtime=(motion.jumpSpeed+Math.sqrt(Math.max(0,motion.jumpSpeed**2-2*motion.gravity*tower.rise)))/motion.gravity;
    if(distance>airtime*motion.moveSpeed+2)failures.push('ledge gap '+i);
  }
  const last=tower.ledges.at(-1), d=Math.hypot(last.center[0]-tower.center[0],last.center[2]-tower.center[2]);
  if(d>(last.width/2+5.95))failures.push('summit gap');
  return {ok:failures.length===0,failures,stepCount:tower.ledges.length,jumpHeight};
}
