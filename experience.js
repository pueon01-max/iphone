
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
const S = await import(URL.createObjectURL(new Blob([document.getElementById('surface').textContent], { type: 'text/javascript' })));
const D = JSON.parse(document.getElementById('data').textContent);
const dec = (s, T) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new T(u.buffer); };
const img = src => new Promise((resolve,reject) => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; c.getContext('2d').drawImage(i, 0, 0); resolve(c); }; i.onerror = () => reject(new Error('Model texture could not be decoded')); i.src = src; });
const tex = {}, depth = {};
for (const n in D.views) { const v = D.views[n]; tex[n] = { tex: await img(v.tex), detail: await img(v.detail), stats: v.stats }; depth[n] = { data: dec(v.depth, Float32Array), R: v.R }; }
const model = { dims: D.dims, sideDir: D.sideDir, cell: D.cell, depth };
const L = await import(URL.createObjectURL(new Blob([document.getElementById('look').textContent], { type: 'text/javascript' })));
const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); r.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2)); r.outputColorSpace = THREE.SRGBColorSpace; document.body.append(r.domElement);
const scene = new THREE.Scene();
const k1 = new THREE.DirectionalLight(0xffffff, .9); k1.position.set(-3, 4, 5); scene.add(k1); const k2 = new THREE.DirectionalLight(0xcfe0ff, 1.2); k2.position.set(4, 2, -4); scene.add(k2);
const cam = new THREE.PerspectiveCamera(30, 1, .05, 100); cam.position.set(0, innerWidth < 650 ? .65 : .4, innerWidth < 650 ? 7.8 : 6.2);
const look = new L.Look(r, scene, cam); await look.set(D.look || L.LOOKS.studio); if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) look.safe = true;
const ctl = new OrbitControls(cam, r.domElement); ctl.target.set(0, innerWidth < 650 ? .42 : .18, 0); ctl.enableDamping = true; ctl.enablePan = false; ctl.enableZoom = true; ctl.minDistance = 2.8; ctl.maxDistance = 12; ctl.autoRotate = true; ctl.autoRotateSpeed = 0.75;
const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(dec(D.pos, Float32Array), 3)); g.setAttribute('normal', new THREE.BufferAttribute(dec(D.nor, Float32Array), 3)); g.setIndex(new THREE.BufferAttribute(dec(D.idx, D.big ? Uint32Array : Uint16Array), 1));
const U = S.makeUniforms(THREE, model, tex), q = D.params || {};
const extra = { uKeep: { value: q.keep ?? .6 }, uRim: { value: q.rim ?? .1 }, uRimColor: { value: new THREE.Color(0xdfe8ff) } };
U.uDepthAmt.value = q.depth ?? 0; U.uLogo.value = q.logo ?? 1;
const mat = new THREE.MeshPhysicalMaterial({ roughness: q.roughness, metalness: q.metalness, clearcoat: q.clearcoat, clearcoatRoughness: q.clearcoatRoughness, transmission: q.transmission, thickness: q.thickness, ior: q.ior, iridescence: q.iridescence, iridescenceIOR: 1.3, iridescenceThicknessRange: [180, 520], sheen: q.sheen, sheenColor: new THREE.Color(0xffffff), envMapIntensity: q.envMapIntensity, dispersion: q.dispersion || 0, specularIntensity: q.specularIntensity ?? 1 });
S.patchMaterial(mat, U, extra);
const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.scale.setScalar(D.scale); const holder = new THREE.Group(); holder.add(mesh); scene.add(holder);
// Original photographic reconstruction is preserved; the lettering below is a separate object.
const typeGroup = new THREE.Group(); scene.add(typeGroup);
const typeMat = new THREE.MeshPhysicalMaterial({color:0xe4e8f2,roughness:.055,metalness:1,clearcoat:.6,clearcoatRoughness:.035,transmission:0,thickness:.8,ior:1.5,iridescence:0,iridescenceIOR:1.3,iridescenceThicknessRange:[180,520],envMapIntensity:2.2,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
const typeLines = ['BEYOND FRAME?', 'I just needed', 'to graduate'];
try {
 const font = await Promise.race([new FontLoader().loadAsync('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json'),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Font loading timed out')),4500))]);
 for (let i=0;i<typeLines.length;i++) {
   const tg=new TextGeometry(typeLines[i],{font,size:i===0?.31:.245,depth:.085,curveSegments:12,bevelEnabled:true,bevelThickness:.018,bevelSize:.013,bevelSegments:4});
   tg.computeBoundingBox();tg.translate(-(tg.boundingBox.max.x+tg.boundingBox.min.x)/2,0,0);
   const obj=new THREE.Mesh(tg,typeMat);obj.position.y=.43-i*.48;typeGroup.add(obj);
 }
} catch (error) {
 console.warn('3D font unavailable, using accessible fallback',error);
 const fallback=document.createElement('div');fallback.id='fallback-type';fallback.textContent='BEYOND FRAME?\nI just needed to graduate';fallback.style.cssText='position:fixed;inset:0;display:flex;white-space:pre-line;text-align:center;align-items:center;justify-content:center;font:bold clamp(26px,5vw,65px) Arial;letter-spacing:-.03em;pointer-events:none;color:#e5ebfa;text-shadow:2px 3px 0 #8491b0,5px 8px 20px #5e7398';document.body.append(fallback);window.__fallbackType=fallback;
}
const clamp01=v=>Math.max(0,Math.min(1,v));
const smooth=v=>{v=clamp01(v);return v*v*(3-2*v)};
let introStart=performance.now(), lastInteraction=-1e8, activated=false;
const replay=()=>{document.getElementById('persistent-title').classList.remove('shown');introStart=performance.now();activated=false;lastInteraction=performance.now();ctl.autoRotate=false;ctl.reset();cam.position.set(0,innerWidth<650?.65:.4,innerWidth<650?7.8:6.2);ctl.target.set(0,innerWidth<650?.42:.18,0);ctl.update();};
document.getElementById('replay').addEventListener('click',replay);
ctl.addEventListener('start',()=>{lastInteraction=performance.now();ctl.autoRotate=false;});
const stopAuto=()=>{lastInteraction=performance.now();ctl.autoRotate=false;};
r.domElement.addEventListener('pointerdown',stopAuto,{passive:true});r.domElement.addEventListener('wheel',stopAuto,{passive:true});r.domElement.addEventListener('touchstart',stopAuto,{passive:true});r.domElement.addEventListener('pointermove',e=>{if(e.buttons)stopAuto();},{passive:true});r.domElement.addEventListener('touchmove',stopAuto,{passive:true});
replay();document.getElementById('loading').classList.add('hide');
g.computeBoundingBox(); look.setFloor(g.boundingBox.min.y * D.scale - .015);
let mx = 0, my = 0; addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
const size = () => {const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);r.setPixelRatio(Math.min(devicePixelRatio,w<700?1.5:2));r.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();look.resize(w,h);}; addEventListener('resize', size); size();
const clock = new THREE.Clock();
addEventListener("webglcontextlost",e=>{e.preventDefault();const el=document.getElementById("loading");el.textContent="3D CONTEXT LOST · RELOAD TO RESTORE";el.classList.remove("hide");});
addEventListener("unhandledrejection",e=>{console.error(e.reason);const el=document.getElementById("loading");el.textContent="3D COULD NOT LOAD · PLEASE REFRESH";el.classList.remove("hide");});
r.setAnimationLoop(() => {
 const t=clock.getElapsedTime(), now=performance.now(), e=(now-introStart)/1000;
 // 0–4.6s: typography rises and turns; 4.6–6.5s: original object emerges.
 const typIn=smooth((e-.15)/1.2),typOut=1-smooth((e-3.75)/1.15),typAlpha=typIn*typOut;
 const objIn=smooth((e-4.65)/1.55);
 const title=document.getElementById("persistent-title");const shouldShow=e>=5.1;if(title.classList.contains("shown")!==shouldShow)title.classList.toggle("shown",shouldShow);
 typeGroup.visible=typAlpha>.005;
 typeMat.opacity=typAlpha;
 typeGroup.rotation.y=.52+(1-smooth(e/3.4))*.95+Math.sin(t*.6)*.055;
 typeGroup.rotation.x=.09+Math.sin(t*.43)*.035;
 typeGroup.position.y=(1-typIn)*-.38;
 typeGroup.scale.setScalar(.68+.32*typIn);
 if(window.__fallbackType)window.__fallbackType.style.opacity=typAlpha;
 holder.visible=objIn>.002;
 holder.scale.setScalar(.62+.38*objIn);
 holder.position.y=(1-objIn)*-.7;
 if(objIn<.999){mat.transparent=true;mat.opacity=objIn;mat.depthWrite=false;}else{mat.transparent=false;mat.opacity=1;mat.depthWrite=true;}
 if (D.fx.float) mesh.position.y=Math.sin(t*1.1)*.04;
 if(e>5.2){
  // Allow full orbit while moving the model, no automatic parallax fighting the user's drag.
  if(!ctl.autoRotate && now-lastInteraction>=4500)ctl.autoRotate=true;
  if(!activated){activated=true;lastInteraction=now;ctl.autoRotate=false;}
 }
 ctl.update();mesh.updateWorldMatrix(true,false);U.uCamObj.value.copy(mesh.worldToLocal(cam.position.clone()));look.render(.016,t);
});
