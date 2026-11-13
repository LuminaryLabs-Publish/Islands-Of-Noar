// Small, dependency-free WebGL2 presentation adapter for the game-specific scene kits.
// NexusEngine Studio authoring source remains preserved separately in project/.
const I=()=>new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
export function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
export function trs(pos=[0,0,0],scale=[1,1,1],q=[0,0,0,1]){const [x,y,z,w]=q, [sx,sy,sz]=scale;return new Float32Array([
 (1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,
 2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,
 2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,
 pos[0],pos[1],pos[2],1]);}
function perspective(fovy,aspect,near,far){const f=1/Math.tan(fovy/2), d=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*d,-1,0,0,2*far*near*d,0]);}
function lookAt(eye,target){const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm=a=>{let d=Math.hypot(...a)||1;return a.map(x=>x/d)};
const z=norm(sub(eye,target)),x=norm(cross([0,1,0],z)),y=cross(z,x);
return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]);}
function rgb(hex){const c=hex.replace('#','');return [0,2,4].map(i=>parseInt(c.slice(i,i+2),16)/255);}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
const VS=`#version 300 es
layout(location=0) in vec3 aPosition;layout(location=1) in vec3 aNormal;
uniform mat4 uVP,uModel;out vec3 vNormal;out vec3 vPosition;
void main(){vec4 p=uModel*vec4(aPosition,1.);vPosition=p.xyz;vNormal=mat3(uModel)*aNormal;gl_Position=uVP*p;}`;
const FS=`#version 300 es
precision highp float;in vec3 vNormal;in vec3 vPosition;
uniform vec3 uColor,uEye,uSky;uniform float uGlow;out vec4 color;
void main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-0.55,0.9,0.55));float d=max(0.,dot(n,l));
float hemi=clamp(n.y*.32+.48,.18,.84);vec3 base=uColor*(.45+.56*d+.30*hemi);
float rim=pow(1.-max(0.,dot(n,normalize(uEye-vPosition))),3.);base+=rim*vec3(.09,.15,.24);
base+=uColor*uGlow*.75;float dist=distance(uEye,vPosition);float fog=1.-exp(-dist*dist*.0000037);
base=mix(base,uSky,clamp(fog,0.,.8));base=base/(base+vec3(.26));color=vec4(pow(base,vec3(.93)),1.);}`;
function cubeGeometry(){const faces=[[[0,0,1],[[ -1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]]],[[0,0,-1],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]]],[[1,0,0],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]]],[[-1,0,0],[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]]],[[0,1,0],[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]]],[[0,-1,0],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]]];const pos=[],norm=[],indices=[];faces.forEach(([n,verts],f)=>{for(const v of verts){pos.push(...v.map(x=>x*.5));norm.push(...n);}const k=f*4;indices.push(k,k+1,k+2,k,k+2,k+3);});return {pos:new Float32Array(pos),norm:new Float32Array(norm),idx:new Uint16Array(indices)};}
function uploadGeometry(gl,pos,norm,idx){const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffers=[];
 for(const [slot,data] of [[0,pos],[1,norm]]){const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(slot);gl.vertexAttribPointer(slot,3,gl.FLOAT,false,0,0);}
 const b=gl.createBuffer();buffers.push(b);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);gl.bindVertexArray(null);
 return {vao,buffers,count:idx.length,indexType:idx instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT};}
function decodeAccessor(json,bin,index){const a=json.accessors[index],v=json.bufferViews[a.bufferView];const n=a.count*(a.type==='VEC3'?3:a.type==='VEC2'?2:1);const stride=v.byteStride||0;
 const size=a.componentType===5126?4:a.componentType===5125?4:2,components=a.type==='VEC3'?3:a.type==='VEC2'?2:1,off=(v.byteOffset||0)+(a.byteOffset||0);
 const d=new DataView(bin),arr=new (a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array)(n);
 for(let i=0;i<a.count;i++)for(let k=0;k<components;k++){const p=off+i*(stride||components*size)+k*size;arr[i*components+k]=a.componentType===5126?d.getFloat32(p,true):a.componentType===5125?d.getUint32(p,true):d.getUint16(p,true);}
 return arr;}
export function parseGlb(buffer){const v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==buffer.byteLength)throw Error('Invalid GLB header');
let offset=12,json=null,bin=null;while(offset+8<=buffer.byteLength){const length=v.getUint32(offset,true),type=v.getUint32(offset+4,true);offset+=8;if(offset+length>buffer.byteLength)throw Error('Invalid GLB chunk');if(type===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,offset,length)));if(type===0x004e4942)bin=buffer.slice(offset,offset+length);offset+=length;}
if(!json||!bin||!json.meshes?.length)throw Error('Incomplete GLB');return {json,bin};}
const biomes={Meadow:'#6a9865',Forest:'#426e57',Desert:'#bd8d62',Tundra:'#b4d6d7'};
export class NoarRenderer {
 constructor(canvas){const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,powerPreference:'high-performance'});if(!gl)throw Error('WebGL2 is required');this.gl=gl;this.canvas=canvas;this.islandMeshes=[];this.cube=uploadGeometry(gl,...Object.values(cubeGeometry()));const program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,VS));gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,FS));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));this.program=program;this.u={};for(const name of ['uVP','uModel','uColor','uEye','uSky','uGlow'])this.u[name]=gl.getUniformLocation(program,name);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);}
 disposeIsland(){const gl=this.gl;for(const item of this.islandMeshes){gl.deleteVertexArray(item.mesh.vao);for(const b of item.mesh.buffers)gl.deleteBuffer(b);}this.islandMeshes=[];}
 async loadIsland(path,biome){const res=await fetch(path);if(!res.ok)throw Error(`Island model HTTP ${res.status}: ${path}`);const {json,bin}=parseGlb(await res.arrayBuffer());this.disposeIsland();const scene=json.scenes?.[json.scene||0]||json.scenes?.[0];const visit=(index,parent)=>{const node=json.nodes[index],local=node.matrix?new Float32Array(node.matrix):trs(node.translation||[0,0,0],node.scale||[1,1,1],node.rotation||[0,0,0,1]),world=multiply(parent,local);
 if(node.mesh!==undefined){for(const p of json.meshes[node.mesh].primitives){if(p.mode!==undefined&&p.mode!==4)continue;const pos=decodeAccessor(json,bin,p.attributes.POSITION),norm=p.attributes.NORMAL!==undefined?decodeAccessor(json,bin,p.attributes.NORMAL):new Float32Array(pos.length).fill(0),idx=p.indices!==undefined?decodeAccessor(json,bin,p.indices):Uint32Array.from({length:pos.length/3},(_,i)=>i);const mesh=uploadGeometry(this.gl,pos,norm,idx);const mat=json.materials?.[p.material]||{};let col=mat.pbrMetallicRoughness?.baseColorFactor?.slice(0,3)||[1,1,1];if(/Top Terrain|Sunlit Ground/.test(mat.name||''))col=rgb(biomes[biome]||'#8bab8e');this.islandMeshes.push({mesh,model:world,color:col});}}
 for(const child of node.children||[])visit(child,world);};for(const root of scene?.nodes||[])visit(root,I());return this.islandMeshes.length;}
 drawMesh(mesh,model,color,glow=0){const gl=this.gl;gl.uniformMatrix4fv(this.u.uModel,false,model);gl.uniform3fv(this.u.uColor,color);gl.uniform1f(this.u.uGlow,glow);gl.bindVertexArray(mesh.vao);gl.drawElements(gl.TRIANGLES,mesh.count,mesh.indexType,0);}
 drawBox(b,color,glow=0){const q=[0,Math.sin((b.yaw||0)/2),0,Math.cos((b.yaw||0)/2)];this.drawMesh(this.cube,trs([b.x,b.y,b.z],[b.w,b.h,b.d],q),color,glow);}
 render(scene,player,camera,elapsed,mode){const gl=this.gl,canvas=this.canvas,scale=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.floor(canvas.clientWidth*scale)),h=Math.max(1,Math.floor(canvas.clientHeight*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
 gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(this.program);const target=[player.x,player.y+3,player.z],eye=[player.x+Math.sin(camera.yaw)*camera.distance*Math.cos(camera.pitch),player.y+5+Math.sin(camera.pitch)*camera.distance,player.z+Math.cos(camera.yaw)*camera.distance*Math.cos(camera.pitch)];const vp=multiply(perspective(.91,w/h,.08,1600),lookAt(eye,target));gl.uniformMatrix4fv(this.u.uVP,false,vp);gl.uniform3fv(this.u.uEye,eye);gl.uniform3fv(this.u.uSky,[.40,.58,.74]);
 const islandModel=trs([0,0,0],[scene.island.scale,scene.island.scale,scene.island.scale]);for(const p of this.islandMeshes)this.drawMesh(p.mesh,multiply(islandModel,p.model),p.color);
 const [core,trim,step,accent]=scene.tower.palette.map(rgb);const mats={core,trim,step,accent,stone:core,portal:rgb('#9beaff')};
 for(const b of scene.tower.solids)this.drawBox(b,mats[b.material]||core,b.material==='portal'?.6:b.part==='rune-light'?.3:0);
 const pulse=.5+.5*Math.sin(elapsed*3);this.drawBox({x:scene.tower.center[0],y:scene.tower.summit+2,z:scene.tower.center[2],w:1.2+pulse*.2,h:3.5,d:1.2},rgb('#b3f7ff'),1.3);
 // Player: visible faceted drifter; presented independently from authority/collision.
 const playerColor=mode==='flying'?'#c4f8ff':'#f5e2a0';this.drawBox({x:player.x,y:player.y+0.8,z:player.z,w:1.12,h:1.55,d:.86,yaw:camera.yaw},rgb(playerColor),mode==='flying'?.4:.08);
 this.drawBox({x:player.x,y:player.y+1.82,z:player.z,w:.85,h:.72,d:.8,yaw:camera.yaw},rgb('#fff1d3'),.04);
 // Simple wings read clearly when gliding.
 if(mode==='flying'){for(const sign of [-1,1])this.drawBox({x:player.x+sign*1.12,y:player.y+1.05,z:player.z,w:2.3,h:.17,d:1.15,yaw:camera.yaw},rgb('#b0d4ee'),.18);}
 }
}
