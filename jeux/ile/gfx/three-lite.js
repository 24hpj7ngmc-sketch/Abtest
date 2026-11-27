// three-lite : un sous-ensemble de l'API three.js r128, écrit pour l'APERÇU LOCAL uniquement (WebGL2).
// Il sert à faire tourner le jeu dans le navigateur de test (sans accès à internet) et à voir ce qu'on modélise.
// Le jeu publié, lui, charge le vrai three.js r128. Tout ce qui est ici doit donc se comporter COMME three r128
// (repères, ordre des rotations, sens des faces, éclairage Lambert/Phong sans conversion de couleur).
(function(){
'use strict';
const T={REVISION:'lite-128'};
// ---------------------------------------------------------------- maths
class Vector2{constructor(x=0,y=0){this.x=x;this.y=y;}set(x,y){this.x=x;this.y=y;return this;}copy(v){this.x=v.x;this.y=v.y;return this;}clone(){return new Vector2(this.x,this.y);}setScalar(s){this.x=this.y=s;return this;}}
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
  set(x,y,z){this.x=x;this.y=y;this.z=z===undefined?this.z:z;return this;}setScalar(s){this.x=this.y=this.z=s;return this;}
  copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}clone(){return new Vector3(this.x,this.y,this.z);}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
  addVectors(a,b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;return this;}subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}
  addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}divideScalar(s){return this.multiplyScalar(1/s);}
  multiply(v){this.x*=v.x;this.y*=v.y;this.z*=v.z;return this;}negate(){this.x=-this.x;this.y=-this.y;this.z=-this.z;return this;}
  dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;}length(){return Math.sqrt(this.lengthSq());}
  normalize(){const l=this.length()||1;return this.multiplyScalar(1/l);}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}
  cross(v){return this.crossVectors(this,v);}crossVectors(a,b){const ax=a.x,ay=a.y,az=a.z,bx=b.x,by=b.y,bz=b.z;this.x=ay*bz-az*by;this.y=az*bx-ax*bz;this.z=ax*by-ay*bx;return this;}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;}equals(v){return v.x===this.x&&v.y===this.y&&v.z===this.z;}
  applyMatrix4(m){const e=m.elements,x=this.x,y=this.y,z=this.z,w=1/(e[3]*x+e[7]*y+e[11]*z+e[15]);this.x=(e[0]*x+e[4]*y+e[8]*z+e[12])*w;this.y=(e[1]*x+e[5]*y+e[9]*z+e[13])*w;this.z=(e[2]*x+e[6]*y+e[10]*z+e[14])*w;return this;}
  setFromMatrixPosition(m){const e=m.elements;this.x=e[12];this.y=e[13];this.z=e[14];return this;}toArray(a=[],o=0){a[o]=this.x;a[o+1]=this.y;a[o+2]=this.z;return a;}fromArray(a,o=0){this.x=a[o];this.y=a[o+1];this.z=a[o+2];return this;}}
class Euler{constructor(x=0,y=0,z=0,order='XYZ'){this.x=x;this.y=y;this.z=z;this.order=order;}set(x,y,z,order){this.x=x;this.y=y;this.z=z;if(order)this.order=order;return this;}copy(e){this.x=e.x;this.y=e.y;this.z=e.z;this.order=e.order;return this;}clone(){return new Euler(this.x,this.y,this.z,this.order);}
  setFromRotationMatrix(m,order){const te=m.elements,m11=te[0],m12=te[4],m13=te[8],m21=te[1],m22=te[5],m23=te[9],m31=te[2],m32=te[6],m33=te[10],cl=v=>Math.max(-1,Math.min(1,v));order=order||this.order;
    if(order==='YXZ'){this.x=Math.asin(-cl(m23));if(Math.abs(m23)<.9999999){this.y=Math.atan2(m13,m33);this.z=Math.atan2(m21,m22);}else{this.y=Math.atan2(-m31,m11);this.z=0;}}
    else{this.y=Math.asin(cl(m13));if(Math.abs(m13)<.9999999){this.x=Math.atan2(-m23,m33);this.z=Math.atan2(-m12,m11);}else{this.x=Math.atan2(m32,m22);this.z=0;}}
    this.order=order;return this;}}
class Matrix4{constructor(){this.elements=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
  identity(){this.elements.set([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);return this;}copy(m){this.elements.set(m.elements);return this;}clone(){return new Matrix4().copy(this);}
  multiplyMatrices(a,b){const ae=a.elements,be=b.elements,o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=ae[r]*be[c*4]+ae[4+r]*be[c*4+1]+ae[8+r]*be[c*4+2]+ae[12+r]*be[c*4+3];this.elements.set(o);return this;}
  multiply(m){return this.multiplyMatrices(this,m);}premultiply(m){return this.multiplyMatrices(m,this);}
  // three : 'XYZ' = Rx·Ry·Rz, 'YXZ' = Ry·Rx·Rz, etc.
  makeRotationFromEuler(eu){const X=(a)=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,c,-s,0,s,c];},Y=(a)=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,s,0,1,0,-s,0,c];},Z=(a)=>{const c=Math.cos(a),s=Math.sin(a);return[c,-s,0,s,c,0,0,0,1];};
    const mm=(a,b)=>{const o=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)o[r*3+c]=a[r*3]*b[c]+a[r*3+1]*b[3+c]+a[r*3+2]*b[6+c];return o;},M={X:X(eu.x),Y:Y(eu.y),Z:Z(eu.z)},o=eu.order||'XYZ',r=mm(mm(M[o[0]],M[o[1]]),M[o[2]]),e=this.elements;
    e[0]=r[0];e[4]=r[1];e[8]=r[2];e[1]=r[3];e[5]=r[4];e[9]=r[5];e[2]=r[6];e[6]=r[7];e[10]=r[8];e[3]=e[7]=e[11]=e[12]=e[13]=e[14]=0;e[15]=1;return this;}
  compose(p,eu,s){this.makeRotationFromEuler(eu);const e=this.elements;e[0]*=s.x;e[1]*=s.x;e[2]*=s.x;e[4]*=s.y;e[5]*=s.y;e[6]*=s.y;e[8]*=s.z;e[9]*=s.z;e[10]*=s.z;e[12]=p.x;e[13]=p.y;e[14]=p.z;return this;}
  setPosition(x,y,z){const e=this.elements;if(x&&x.x!==undefined){e[12]=x.x;e[13]=x.y;e[14]=x.z;}else{e[12]=x;e[13]=y;e[14]=z;}return this;}
  determinant(){const e=this.elements;return e[0]*(e[5]*e[10]-e[9]*e[6])-e[4]*(e[1]*e[10]-e[9]*e[2])+e[8]*(e[1]*e[6]-e[5]*e[2]);} // partie 3x3 (suffit pour le sens des faces)
  invert(){const m=this.elements,inv=new Float32Array(16);
    inv[0]=m[5]*m[10]*m[15]-m[5]*m[11]*m[14]-m[9]*m[6]*m[15]+m[9]*m[7]*m[14]+m[13]*m[6]*m[11]-m[13]*m[7]*m[10];inv[4]=-m[4]*m[10]*m[15]+m[4]*m[11]*m[14]+m[8]*m[6]*m[15]-m[8]*m[7]*m[14]-m[12]*m[6]*m[11]+m[12]*m[7]*m[10];
    inv[8]=m[4]*m[9]*m[15]-m[4]*m[11]*m[13]-m[8]*m[5]*m[15]+m[8]*m[7]*m[13]+m[12]*m[5]*m[11]-m[12]*m[7]*m[9];inv[12]=-m[4]*m[9]*m[14]+m[4]*m[10]*m[13]+m[8]*m[5]*m[14]-m[8]*m[6]*m[13]-m[12]*m[5]*m[10]+m[12]*m[6]*m[9];
    inv[1]=-m[1]*m[10]*m[15]+m[1]*m[11]*m[14]+m[9]*m[2]*m[15]-m[9]*m[3]*m[14]-m[13]*m[2]*m[11]+m[13]*m[3]*m[10];inv[5]=m[0]*m[10]*m[15]-m[0]*m[11]*m[14]-m[8]*m[2]*m[15]+m[8]*m[3]*m[14]+m[12]*m[2]*m[11]-m[12]*m[3]*m[10];
    inv[9]=-m[0]*m[9]*m[15]+m[0]*m[11]*m[13]+m[8]*m[1]*m[15]-m[8]*m[3]*m[13]-m[12]*m[1]*m[11]+m[12]*m[3]*m[9];inv[13]=m[0]*m[9]*m[14]-m[0]*m[10]*m[13]-m[8]*m[1]*m[14]+m[8]*m[2]*m[13]+m[12]*m[1]*m[10]-m[12]*m[2]*m[9];
    inv[2]=m[1]*m[6]*m[15]-m[1]*m[7]*m[14]-m[5]*m[2]*m[15]+m[5]*m[3]*m[14]+m[13]*m[2]*m[7]-m[13]*m[3]*m[6];inv[6]=-m[0]*m[6]*m[15]+m[0]*m[7]*m[14]+m[4]*m[2]*m[15]-m[4]*m[3]*m[14]-m[12]*m[2]*m[7]+m[12]*m[3]*m[6];
    inv[10]=m[0]*m[5]*m[15]-m[0]*m[7]*m[13]-m[4]*m[1]*m[15]+m[4]*m[3]*m[13]+m[12]*m[1]*m[7]-m[12]*m[3]*m[5];inv[14]=-m[0]*m[5]*m[14]+m[0]*m[6]*m[13]+m[4]*m[1]*m[14]-m[4]*m[2]*m[13]-m[12]*m[1]*m[6]+m[12]*m[2]*m[5];
    inv[3]=-m[1]*m[6]*m[11]+m[1]*m[7]*m[10]+m[5]*m[2]*m[11]-m[5]*m[3]*m[10]-m[9]*m[2]*m[7]+m[9]*m[3]*m[6];inv[7]=m[0]*m[6]*m[11]-m[0]*m[7]*m[10]-m[4]*m[2]*m[11]+m[4]*m[3]*m[10]+m[8]*m[2]*m[7]-m[8]*m[3]*m[6];
    inv[11]=-m[0]*m[5]*m[11]+m[0]*m[7]*m[9]+m[4]*m[1]*m[11]-m[4]*m[3]*m[9]-m[8]*m[1]*m[7]+m[8]*m[3]*m[5];inv[15]=m[0]*m[5]*m[10]-m[0]*m[6]*m[9]-m[4]*m[1]*m[10]+m[4]*m[2]*m[9]+m[8]*m[1]*m[6]-m[8]*m[2]*m[5];
    let det=m[0]*inv[0]+m[1]*inv[4]+m[2]*inv[8]+m[3]*inv[12];det=det?1/det:0;for(let i=0;i<16;i++)this.elements[i]=inv[i]*det;return this;}
  lookAt(eye,target,up){const z=new Vector3().subVectors(eye,target);if(z.lengthSq()===0)z.z=1;z.normalize();const x=new Vector3().crossVectors(up,z);if(x.lengthSq()===0){if(Math.abs(up.z)===1)z.x+=.0001;else z.z+=.0001;z.normalize();x.crossVectors(up,z);}x.normalize();const y=new Vector3().crossVectors(z,x),e=this.elements;
    e[0]=x.x;e[4]=y.x;e[8]=z.x;e[1]=x.y;e[5]=y.y;e[9]=z.y;e[2]=x.z;e[6]=y.z;e[10]=z.z;return this;}
  makePerspective(fov,aspect,near,far){const t=near*Math.tan(fov*Math.PI/360),r=t*aspect,e=this.elements;e.fill(0);e[0]=near/r;e[5]=near/t;e[10]=-(far+near)/(far-near);e[11]=-1;e[14]=-2*far*near/(far-near);return this;}
  makeOrthographic(l,r,t,b,n,f){const e=this.elements;e.fill(0);e[0]=2/(r-l);e[5]=2/(t-b);e[10]=-2/(f-n);e[12]=-(r+l)/(r-l);e[13]=-(t+b)/(t-b);e[14]=-(f+n)/(f-n);e[15]=1;return this;}}
let _cx=null;
class Color{constructor(r,g,b){this.r=1;this.g=1;this.b=1;if(g===undefined&&b===undefined){if(r!==undefined)this.set(r);}else this.setRGB(r,g,b);}
  set(v){if(v&&v.isColor)this.copy(v);else if(typeof v==='number')this.setHex(v);else if(typeof v==='string')this.setStyle(v);return this;}
  setHex(h){h=Math.floor(h);this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this;}setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}
  setStyle(s){if(!_cx)_cx=document.createElement('canvas').getContext('2d');_cx.fillStyle='#000';_cx.fillStyle=s;const f=_cx.fillStyle;if(f[0]==='#')return this.setHex(parseInt(f.slice(1),16));const m=f.match(/[\d.]+/g);return this.setRGB(m[0]/255,m[1]/255,m[2]/255);}
  getHex(){return Math.round(Math.max(0,Math.min(1,this.r))*255)<<16^Math.round(Math.max(0,Math.min(1,this.g))*255)<<8^Math.round(Math.max(0,Math.min(1,this.b))*255);}
  copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this;}clone(){return new Color(this.r,this.g,this.b);}multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this;}multiply(c){this.r*=c.r;this.g*=c.g;this.b*=c.b;return this;}
  lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this;}}
Color.prototype.isColor=true;
// ---------------------------------------------------------------- graphe de scène
let _id=1;const _up=new Vector3(0,1,0);
class Object3D{constructor(){this.id=_id++;this.parent=null;this.children=[];this.position=new Vector3();this.rotation=new Euler();this.scale=new Vector3(1,1,1);this.up=new Vector3(0,1,0);this.matrix=new Matrix4();this.matrixWorld=new Matrix4();
    this.visible=true;this.castShadow=false;this.receiveShadow=false;this.frustumCulled=true;this.renderOrder=0;this.userData={};this.name='';}
  add(o){if(o.parent)o.parent.remove(o);o.parent=this;this.children.push(o);return this;}remove(o){const i=this.children.indexOf(o);if(i>=0){this.children.splice(i,1);o.parent=null;}return this;}
  updateMatrix(){this.matrix.compose(this.position,this.rotation,this.scale);}
  updateMatrixWorld(){this.updateMatrix();if(this.parent)this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix);else this.matrixWorld.copy(this.matrix);for(const c of this.children)c.updateMatrixWorld();}
  lookAt(x,y,z){const t=x&&x.x!==undefined?x:new Vector3(x,y,z),m=new Matrix4();if(this.isCamera||this.isLight)m.lookAt(this.position,t,this.up);else m.lookAt(t,this.position,this.up);this.rotation.setFromRotationMatrix(m,this.rotation.order);}
  traverse(f){f(this);for(const c of this.children)c.traverse(f);}getWorldPosition(v){return v.setFromMatrixPosition(this.matrixWorld);}}
Object3D.prototype.isObject3D=true;
class Group extends Object3D{}Group.prototype.isGroup=true;
class Scene extends Object3D{constructor(){super();this.background=null;this.fog=null;}}Scene.prototype.isScene=true;
class Mesh extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m;}}Mesh.prototype.isMesh=true;
class InstancedMesh extends Mesh{constructor(g,m,n){super(g,m);this.count=n;this.instanceMatrix=new BufferAttribute(new Float32Array(n*16),16);}setMatrixAt(i,m){this.instanceMatrix.array.set(m.elements,i*16);this.instanceMatrix.version++;}getMatrixAt(i,m){m.elements.set(this.instanceMatrix.array.subarray(i*16,i*16+16));}}InstancedMesh.prototype.isInstancedMesh=true;
class Sprite extends Object3D{constructor(m){super();this.material=m||new SpriteMaterial();this.center=new Vector2(.5,.5);}}Sprite.prototype.isSprite=true;
class Camera extends Object3D{constructor(){super();this.projectionMatrix=new Matrix4();this.matrixWorldInverse=new Matrix4();}}Camera.prototype.isCamera=true;
class PerspectiveCamera extends Camera{constructor(fov=50,aspect=1,near=.1,far=2000){super();this.fov=fov;this.aspect=aspect;this.near=near;this.far=far;this.updateProjectionMatrix();}updateProjectionMatrix(){this.projectionMatrix.makePerspective(this.fov,this.aspect,this.near,this.far);}}
class Light extends Object3D{constructor(c,i=1){super();this.color=new Color(c===undefined?0xffffff:c);this.intensity=i;}}Light.prototype.isLight=true;
class AmbientLight extends Light{}AmbientLight.prototype.isAmbientLight=true;
class HemisphereLight extends Light{constructor(s,g,i){super(s,i);this.groundColor=new Color(g===undefined?0xffffff:g);this.position.set(0,1,0);}}HemisphereLight.prototype.isHemisphereLight=true;
class DirectionalLight extends Light{constructor(c,i){super(c,i);this.position.set(0,1,0);this.target=new Object3D();this.shadow={mapSize:new Vector2(512,512),camera:{left:-5,right:5,top:5,bottom:-5,near:.5,far:500},bias:0,normalBias:0,radius:1};}}DirectionalLight.prototype.isDirectionalLight=true;
class PointLight extends Light{constructor(c,i,d=0,decay=1){super(c,i);this.distance=d;this.decay=decay;}}PointLight.prototype.isPointLight=true;
class Fog{constructor(c,n=1,f=1000){this.color=new Color(c);this.near=n;this.far=f;}}
// ---------------------------------------------------------------- géométrie
class BufferAttribute{constructor(a,n){this.array=a;this.itemSize=n;this.count=a.length/n;this.version=1;}set needsUpdate(v){if(v)this.version++;}getX(i){return this.array[i*this.itemSize];}getY(i){return this.array[i*this.itemSize+1];}getZ(i){return this.array[i*this.itemSize+2];}setXYZ(i,x,y,z){const o=i*this.itemSize;this.array[o]=x;this.array[o+1]=y;this.array[o+2]=z;return this;}}
class Float32BufferAttribute extends BufferAttribute{constructor(a,n){super(a instanceof Float32Array?a:new Float32Array(a),n);}}
class Uint16BufferAttribute extends BufferAttribute{constructor(a,n){super(a instanceof Uint16Array?a:new Uint16Array(a),n);}}
class Uint32BufferAttribute extends BufferAttribute{constructor(a,n){super(a instanceof Uint32Array?a:new Uint32Array(a),n);}}
class BufferGeometry{constructor(){this.id=_id++;this.attributes={};this.index=null;this.boundingSphere=null;}
  setAttribute(n,a){this.attributes[n]=a;return this;}getAttribute(n){return this.attributes[n];}deleteAttribute(n){delete this.attributes[n];return this;}
  setIndex(i){this.index=Array.isArray(i)?new (Math.max.apply(null,i.length?i:[0])>65535?Uint32BufferAttribute:Uint16BufferAttribute)(i,1):i;return this;}
  toNonIndexed(){if(!this.index)return this.clone();const g=new BufferGeometry(),ix=this.index.array;for(const k in this.attributes){const a=this.attributes[k],n=a.itemSize,o=new Float32Array(ix.length*n);for(let i=0;i<ix.length;i++)for(let j=0;j<n;j++)o[i*n+j]=a.array[ix[i]*n+j];g.setAttribute(k,new BufferAttribute(o,n));}return g;}
  clone(){const g=new BufferGeometry();for(const k in this.attributes){const a=this.attributes[k];g.setAttribute(k,new BufferAttribute(a.array.slice(),a.itemSize));}if(this.index)g.index=new BufferAttribute(this.index.array.slice(),1);return g;}
  computeVertexNormals(){const p=this.attributes.position;if(!p)return;const n=new Float32Array(p.count*3),ix=this.index?this.index.array:null,cnt=ix?ix.length:p.count,P=p.array;
    for(let i=0;i<cnt;i+=3){const a=ix?ix[i]:i,b=ix?ix[i+1]:i+1,c=ix?ix[i+2]:i+2,ax=P[a*3],ay=P[a*3+1],az=P[a*3+2],ux=P[b*3]-ax,uy=P[b*3+1]-ay,uz=P[b*3+2]-az,vx=P[c*3]-ax,vy=P[c*3+1]-ay,vz=P[c*3+2]-az,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
      for(const q of[a,b,c]){n[q*3]+=nx;n[q*3+1]+=ny;n[q*3+2]+=nz;}}
    for(let i=0;i<n.length;i+=3){const l=Math.hypot(n[i],n[i+1],n[i+2])||1;n[i]/=l;n[i+1]/=l;n[i+2]/=l;}this.setAttribute('normal',new BufferAttribute(n,3));}
  applyMatrix4(m){const p=this.attributes.position,e=m.elements,v=new Vector3();for(let i=0;i<p.count;i++){v.fromArray(p.array,i*3).applyMatrix4(m).toArray(p.array,i*3);}p.version++;
    const n=this.attributes.normal;if(n){const it=new Matrix4().copy(m).invert().elements;for(let i=0;i<n.count;i++){const x=n.array[i*3],y=n.array[i*3+1],z=n.array[i*3+2],a=it[0]*x+it[1]*y+it[2]*z,b=it[4]*x+it[5]*y+it[6]*z,c=it[8]*x+it[9]*y+it[10]*z,l=Math.hypot(a,b,c)||1;n.array[i*3]=a/l;n.array[i*3+1]=b/l;n.array[i*3+2]=c/l;}n.version++;}return this;}
  translate(x,y,z){const p=this.attributes.position.array;for(let i=0;i<p.length;i+=3){p[i]+=x;p[i+1]+=y;p[i+2]+=z;}this.attributes.position.version++;return this;}
  scale(x,y,z){const p=this.attributes.position.array;for(let i=0;i<p.length;i+=3){p[i]*=x;p[i+1]*=y;p[i+2]*=z;}this.attributes.position.version++;return this;}
  rotateX(a){return this.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(a,0,0)));}rotateY(a){return this.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(0,a,0)));}rotateZ(a){return this.applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(0,0,a)));}
  computeBoundingSphere(){this.boundingSphere={radius:1};}computeBoundingBox(){}dispose(){this._gone=true;}}
BufferGeometry.prototype.isBufferGeometry=true;
function build(g,P,N,U,I){g.setAttribute('position',new Float32BufferAttribute(P,3));g.setAttribute('normal',new Float32BufferAttribute(N,3));g.setAttribute('uv',new Float32BufferAttribute(U,2));if(I)g.setIndex(I);return g;}
class BoxGeometry extends BufferGeometry{constructor(w=1,h=1,d=1){super();const P=[],N=[],U=[],I=[];let n=0;
    const pl=(u,v,wA,ud,vd,W,Hh,D)=>{const hw=W/2,hh=Hh/2,hd=D/2;for(let iy=0;iy<2;iy++)for(let ix=0;ix<2;ix++){const p=[0,0,0];p[u]=(ix*W-hw)*ud;p[v]=(iy*Hh-hh)*vd;p[wA]=hd;P.push(p[0],p[1],p[2]);const q=[0,0,0];q[wA]=D>0?1:-1;N.push(q[0],q[1],q[2]);U.push(ix,1-iy);}
      I.push(n,n+2,n+1,n+2,n+3,n+1);n+=4;};
    pl(2,1,0,-1,-1,d,h,w);pl(2,1,0,1,-1,d,h,-w);pl(0,2,1,1,1,w,d,h);pl(0,2,1,1,-1,w,d,-h);pl(0,1,2,1,-1,w,h,d);pl(0,1,2,-1,-1,w,h,-d);build(this,P,N,U,I);}}
class SphereGeometry extends BufferGeometry{constructor(r=1,ws=8,hs=6,ps=0,pl=Math.PI*2,ts=0,tl=Math.PI){super();ws=Math.max(3,Math.floor(ws));hs=Math.max(2,Math.floor(hs));const P=[],N=[],U=[],I=[],grid=[],te=Math.min(ts+tl,Math.PI);let idx=0;
    for(let iy=0;iy<=hs;iy++){const row=[],v=iy/hs;for(let ix=0;ix<=ws;ix++){const u=ix/ws,x=-r*Math.cos(ps+u*pl)*Math.sin(ts+v*tl),y=r*Math.cos(ts+v*tl),z=r*Math.sin(ps+u*pl)*Math.sin(ts+v*tl);P.push(x,y,z);const l=Math.hypot(x,y,z)||1;N.push(x/l,y/l,z/l);U.push(u,1-v);row.push(idx++);}grid.push(row);}
    for(let iy=0;iy<hs;iy++)for(let ix=0;ix<ws;ix++){const a=grid[iy][ix+1],b=grid[iy][ix],c=grid[iy+1][ix],d=grid[iy+1][ix+1];if(iy!==0||ts>0)I.push(a,b,d);if(iy!==hs-1||te<Math.PI)I.push(b,c,d);}build(this,P,N,U,I);}}
class CylinderGeometry extends BufferGeometry{constructor(rt=1,rb=1,h=1,rs=8,hs=1,open=false,ts=0,tl=Math.PI*2){super();rs=Math.floor(rs);hs=Math.floor(hs);const P=[],N=[],U=[],I=[],hh=h/2,slope=(rb-rt)/h,ia=[];let idx=0;
    for(let y=0;y<=hs;y++){const row=[],v=y/hs,rad=v*(rb-rt)+rt;for(let x=0;x<=rs;x++){const u=x/rs,th=u*tl+ts,s=Math.sin(th),c=Math.cos(th);P.push(rad*s,-v*h+hh,rad*c);const l=Math.hypot(s,slope,c);N.push(s/l,slope/l,c/l);U.push(u,1-v);row.push(idx++);}ia.push(row);}
    for(let x=0;x<rs;x++)for(let y=0;y<hs;y++){const a=ia[y][x],b=ia[y+1][x],c=ia[y+1][x+1],d=ia[y][x+1];I.push(a,b,d,b,c,d);}
    const cap=top=>{const cs=idx,rad=top?rt:rb,sg=top?1:-1;for(let x=1;x<=rs;x++){P.push(0,hh*sg,0);N.push(0,sg,0);U.push(.5,.5);idx++;}const ce=idx;
      for(let x=0;x<=rs;x++){const th=x/rs*tl+ts,c=Math.cos(th),s=Math.sin(th);P.push(rad*s,hh*sg,rad*c);N.push(0,sg,0);U.push(c*.5+.5,s*.5*sg+.5);idx++;}
      for(let x=0;x<rs;x++){const c=cs+x,i=ce+x;if(top)I.push(i,i+1,c);else I.push(i+1,i,c);}};
    if(!open){if(rt>0)cap(true);if(rb>0)cap(false);}build(this,P,N,U,I);}}
class ConeGeometry extends CylinderGeometry{constructor(r=1,h=1,rs=8,hs=1,open=false,ts=0,tl=Math.PI*2){super(0,r,h,rs,hs,open,ts,tl);}}
class TorusGeometry extends BufferGeometry{constructor(R=1,t=.4,rs=8,ts=6,arc=Math.PI*2){super();rs=Math.floor(rs);ts=Math.floor(ts);const P=[],N=[],U=[],I=[];
    for(let j=0;j<=rs;j++)for(let i=0;i<=ts;i++){const u=i/ts*arc,v=j/rs*Math.PI*2,x=(R+t*Math.cos(v))*Math.cos(u),y=(R+t*Math.cos(v))*Math.sin(u),z=t*Math.sin(v);P.push(x,y,z);const cx=R*Math.cos(u),cy=R*Math.sin(u),l=Math.hypot(x-cx,y-cy,z)||1;N.push((x-cx)/l,(y-cy)/l,z/l);U.push(i/ts,j/rs);}
    for(let j=1;j<=rs;j++)for(let i=1;i<=ts;i++){const a=(ts+1)*j+i-1,b=(ts+1)*(j-1)+i-1,c=(ts+1)*(j-1)+i,d=(ts+1)*j+i;I.push(a,b,d,b,c,d);}build(this,P,N,U,I);}}
class CircleGeometry extends BufferGeometry{constructor(r=1,s=8,ts=0,tl=Math.PI*2){super();s=Math.max(3,s);const P=[0,0,0],N=[0,0,1],U=[.5,.5],I=[];for(let i=0;i<=s;i++){const a=ts+i/s*tl;P.push(r*Math.cos(a),r*Math.sin(a),0);N.push(0,0,1);U.push(Math.cos(a)*.5+.5,Math.sin(a)*.5+.5);}for(let i=1;i<=s;i++)I.push(i,i+1,0);build(this,P,N,U,I);}}
class RingGeometry extends BufferGeometry{constructor(ri=.5,ro=1,ts=8,ps=1,st=0,tl=Math.PI*2){super();ts=Math.max(3,ts);ps=Math.max(1,ps);const P=[],N=[],U=[],I=[];let rad=ri;const step=(ro-ri)/ps;
    for(let j=0;j<=ps;j++){for(let i=0;i<=ts;i++){const a=st+i/ts*tl,x=rad*Math.cos(a),y=rad*Math.sin(a);P.push(x,y,0);N.push(0,0,1);U.push((x/ro+1)/2,(y/ro+1)/2);}rad+=step;}
    for(let j=0;j<ps;j++){const o=j*(ts+1);for(let i=0;i<ts;i++){const s=i+o,a=s,b=s+ts+1,c=s+ts+2,d=s+1;I.push(a,b,d,b,c,d);}}build(this,P,N,U,I);}}
class PlaneGeometry extends BufferGeometry{constructor(w=1,h=1,ws=1,hs=1){super();const P=[],N=[],U=[],I=[];for(let iy=0;iy<=hs;iy++)for(let ix=0;ix<=ws;ix++){P.push(ix/ws*w-w/2,-(iy/hs*h-h/2),0);N.push(0,0,1);U.push(ix/ws,1-iy/hs);}
    for(let iy=0;iy<hs;iy++)for(let ix=0;ix<ws;ix++){const a=ix+(ws+1)*iy,b=ix+(ws+1)*(iy+1),c=ix+1+(ws+1)*(iy+1),d=ix+1+(ws+1)*iy;I.push(a,b,d,b,c,d);}build(this,P,N,U,I);}}
// polyèdres : enveloppe convexe des sommets (les faces sont planes, donc le découpage en triangles ne change rien à l'œil), non indexés comme dans three
function hullTris(V){const n=V.length,faces=[],seen=new Set(),sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],cr=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dt=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let k=j+1;k<n;k++){let nr=cr(sub(V[j],V[i]),sub(V[k],V[i]));const l=Math.hypot(nr[0],nr[1],nr[2]);if(l<1e-9)continue;nr=nr.map(x=>x/l);let d=dt(nr,V[i]);if(d<0){nr=nr.map(x=>-x);d=-d;}
    let ok=true;const on=[];for(let q=0;q<n;q++){const s=dt(nr,V[q])-d;if(s>1e-6){ok=false;break;}if(s>-1e-6)on.push(q);}if(!ok)continue;const key=on.join(',');if(seen.has(key))continue;seen.add(key);
    const c=[0,0,0];for(const q of on)for(let a=0;a<3;a++)c[a]+=V[q][a]/on.length;const u=sub(V[on[0]],c),ul=Math.hypot(u[0],u[1],u[2]),ux=u.map(x=>x/ul),vx=cr(nr,ux);
    on.sort((p,q)=>Math.atan2(dt(sub(V[p],c),vx),dt(sub(V[p],c),ux))-Math.atan2(dt(sub(V[q],c),vx),dt(sub(V[q],c),ux)));for(let q=1;q<on.length-1;q++)faces.push([on[0],on[q],on[q+1]]);}
  return faces;}
class PolyhedronGeometry extends BufferGeometry{constructor(verts,_ix,radius=1,detail=0){super();const V=[];for(let i=0;i<verts.length;i+=3){const l=Math.hypot(verts[i],verts[i+1],verts[i+2]);V.push([verts[i]/l,verts[i+1]/l,verts[i+2]/l]);}
    const P=[],cols=detail+1,nz=p=>{const l=Math.hypot(p[0],p[1],p[2]);return[p[0]/l*radius,p[1]/l*radius,p[2]/l*radius];},lp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
    for(const f of hullTris(V)){const a=V[f[0]],b=V[f[1]],c=V[f[2]],v=[];for(let i=0;i<=cols;i++){v[i]=[];const aj=lp(a,c,i/cols),bj=lp(b,c,i/cols),rows=cols-i;for(let j=0;j<=rows;j++)v[i][j]=j===0&&i===cols?aj:lp(aj,bj,j/(rows||1));}
      for(let i=0;i<cols;i++)for(let j=0;j<2*(cols-i)-1;j++){const k=Math.floor(j/2);const tri=j%2===0?[v[i][k+1],v[i+1][k],v[i][k]]:[v[i][k+1],v[i+1][k+1],v[i+1][k]];for(const p of tri){const q=nz(p);P.push(q[0],q[1],q[2]);}}}
    this.setAttribute('position',new Float32BufferAttribute(P,3));if(detail===0)this.computeVertexNormals();else{const N=new Float32Array(P.length);for(let i=0;i<P.length;i+=3){const l=Math.hypot(P[i],P[i+1],P[i+2])||1;N[i]=P[i]/l;N[i+1]=P[i+1]/l;N[i+2]=P[i+2]/l;}this.setAttribute('normal',new BufferAttribute(N,3));}
    this.setAttribute('uv',new BufferAttribute(new Float32Array(P.length/3*2),2));}}
const PHI=(1+Math.sqrt(5))/2,RPHI=1/PHI;
class TetrahedronGeometry extends PolyhedronGeometry{constructor(r=1,d=0){super([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],null,r,d);}}
class OctahedronGeometry extends PolyhedronGeometry{constructor(r=1,d=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],null,r,d);}}
class IcosahedronGeometry extends PolyhedronGeometry{constructor(r=1,d=0){super([-1,PHI,0,1,PHI,0,-1,-PHI,0,1,-PHI,0,0,-1,PHI,0,1,PHI,0,-1,-PHI,0,1,-PHI,PHI,0,-1,PHI,0,1,-PHI,0,-1,-PHI,0,1],null,r,d);}}
class DodecahedronGeometry extends PolyhedronGeometry{constructor(r=1,d=0){super([-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-RPHI,-PHI,0,-RPHI,PHI,0,RPHI,-PHI,0,RPHI,PHI,-RPHI,-PHI,0,-RPHI,PHI,0,RPHI,-PHI,0,RPHI,PHI,0,-PHI,0,-RPHI,PHI,0,-RPHI,-PHI,0,RPHI,PHI,0,RPHI],null,r,d);}}
// ---------------------------------------------------------------- matières et textures
const C={FrontSide:0,BackSide:1,DoubleSide:2,NoBlending:0,NormalBlending:1,AdditiveBlending:2,NeverDepth:0,AlwaysDepth:1,LessDepth:2,LessEqualDepth:3,EqualDepth:4,GreaterEqualDepth:5,GreaterDepth:6,NotEqualDepth:7,
  BasicShadowMap:0,PCFShadowMap:1,PCFSoftShadowMap:2,RepeatWrapping:1000,ClampToEdgeWrapping:1001,MirroredRepeatWrapping:1002,NearestFilter:1003,LinearFilter:1006,LinearMipmapLinearFilter:1008,LinearMipMapLinearFilter:1008,RGBAFormat:1023,RGBFormat:1022,UnsignedByteType:1009};
Object.assign(T,C);
class Material{constructor(){this.id=_id++;this.opacity=1;this.transparent=false;this.side=0;this.depthTest=true;this.depthWrite=true;this.depthFunc=3;this.colorWrite=true;this.blending=1;this.visible=true;this.fog=true;this.polygonOffset=false;this.polygonOffsetFactor=0;this.polygonOffsetUnits=0;this.vertexColors=false;this.flatShading=false;this.alphaTest=0;}
  setValues(o){if(!o)return;for(const k in o){const v=o[k],c=this[k];if(v===undefined)continue;if(c&&c.isColor)c.set(v);else this[k]=v;}}dispose(){}set needsUpdate(v){}}
class MeshBasicMaterial extends Material{constructor(o){super();this.color=new Color(0xffffff);this.map=null;this.lit=0;this.setValues(o);}}
class MeshLambertMaterial extends Material{constructor(o){super();this.color=new Color(0xffffff);this.map=null;this.emissive=new Color(0);this.emissiveIntensity=1;this.lit=1;this.setValues(o);}}
class MeshPhongMaterial extends Material{constructor(o){super();this.color=new Color(0xffffff);this.map=null;this.emissive=new Color(0);this.emissiveIntensity=1;this.specular=new Color(0x111111);this.shininess=30;this.lit=2;this.setValues(o);}}
class MeshStandardMaterial extends MeshPhongMaterial{constructor(o){super();this.roughness=1;this.metalness=0;this.setValues(o);this.shininess=Math.max(2,(1-this.roughness)*90);this.specular.setRGB(.04+this.metalness*.6,.04+this.metalness*.6,.04+this.metalness*.6);}}
class SpriteMaterial extends Material{constructor(o){super();this.color=new Color(0xffffff);this.map=null;this.rotation=0;this.sizeAttenuation=true;this.transparent=true;this.setValues(o);}}SpriteMaterial.prototype.isSpriteMaterial=true;
class ShaderMaterial extends Material{constructor(o){super();this.uniforms={};this.vertexShader='';this.fragmentShader='';this.fog=false;this.setValues(o);}}ShaderMaterial.prototype.isShaderMaterial=true;
class Texture{constructor(img){this.image=img;this.wrapS=1001;this.wrapT=1001;this.magFilter=1006;this.minFilter=1008;this.repeat=new Vector2(1,1);this.offset=new Vector2(0,0);this.anisotropy=1;this.flipY=true;this.generateMipmaps=true;this.version=0;}set needsUpdate(v){if(v)this.version++;}dispose(){this._gone=true;}}Texture.prototype.isTexture=true;
class CanvasTexture extends Texture{constructor(c){super(c);this.version=1;}}
class DataTexture extends Texture{constructor(d,w,h,f){super({data:d,width:w,height:h});this.format=f;this.magFilter=1003;this.minFilter=1003;this.flipY=false;this.generateMipmaps=false;}}
// ---------------------------------------------------------------- rendu
const PRE_V='#version 300 es\n#define attribute in\n#define varying out\n#define texture2D texture\nprecision highp float;precision highp int;uniform mat4 modelMatrix,modelViewMatrix,projectionMatrix,viewMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;layout(location=0) in vec3 position;layout(location=1) in vec3 normal;layout(location=2) in vec2 uv;\n';
const PRE_F='#version 300 es\n#define varying in\nlayout(location=0) out highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n#define texture2D texture\nprecision highp float;precision highp int;uniform mat4 viewMatrix;uniform vec3 cameraPosition;\n';
const STD_V=`#version 300 es
precision highp float;layout(location=0) in vec3 position;layout(location=1) in vec3 normal;layout(location=2) in vec2 uv;layout(location=3) in vec3 color;layout(location=4) in mat4 instanceMatrix;
uniform mat4 modelMatrix,viewMatrix,projectionMatrix;uniform vec2 uvRep;out vec3 vW;out vec3 vN;out vec2 vUv;out vec3 vCol;out float vDepth;
void main(){mat4 m=modelMatrix*instanceMatrix;vec4 w=m*vec4(position,1.0);vW=w.xyz;vN=normalize(transpose(inverse(mat3(m)))*normal);vUv=uv*uvRep;vCol=color;vec4 mv=viewMatrix*w;vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;
const STD_F=`#version 300 es
precision highp float;in vec3 vW;in vec3 vN;in vec2 vUv;in vec3 vCol;in float vDepth;out vec4 o;
uniform int lit;uniform vec3 diffuse,emissive,specular;uniform float opacity,shininess;uniform bool useMap,useVC,flatS,useFog,recv,hasSh,dbl;uniform sampler2D map;
uniform vec3 hemiSky,hemiGround,ambient,dirDir,dirColor,ptPos,ptColor;uniform float ptDist,ptDecay;uniform vec3 fogColor;uniform float fogNear,fogFar;uniform vec3 cameraPosition;
uniform highp sampler2D shMap;uniform mat4 shMat;uniform float shBias,shNB,shTexel;
float shadow(vec3 N){if(!hasSh||!recv)return 1.0;vec4 c=shMat*vec4(vW+N*shNB,1.0);vec3 p=c.xyz/c.w*0.5+0.5;if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;float s=0.0;
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float d=texture(shMap,p.xy+vec2(float(x),float(y))*shTexel).r;s+=(p.z+shBias>d)?0.0:1.0;}return s/9.0;}
void main(){vec4 d=vec4(diffuse,opacity);if(useMap)d*=texture(map,vUv);if(useVC)d.rgb*=vCol;vec3 col;
  if(lit==0)col=d.rgb;else{vec3 N=flatS?normalize(cross(dFdx(vW),dFdy(vW))):normalize(vN);if(dbl&&!flatS&&!gl_FrontFacing)N=-N;
    vec3 irr=ambient+mix(hemiGround,hemiSky,0.5*N.y+0.5);float ndl=max(dot(N,dirDir),0.0),sh=shadow(N);vec3 direct=dirColor*ndl*sh;
    vec3 pl=ptPos-vW;float pd=length(pl);vec3 pt=vec3(0.0);if(ptDist>0.0&&pd<ptDist){pt=ptColor*max(dot(N,pl/pd),0.0)*pow(clamp(1.0-pd/ptDist,0.0,1.0),ptDecay);}
    col=d.rgb*(irr+direct+pt)+emissive;
    if(lit==2){vec3 V=normalize(cameraPosition-vW),Hh=normalize(V+dirDir);col+=specular*pow(max(dot(N,Hh),0.0),shininess)*(shininess*0.5+1.0)*0.25*dirColor*ndl*sh;}}
  if(useFog)col=mix(col,fogColor,smoothstep(fogNear,fogFar,vDepth));o=vec4(col,d.a);}`;
const DEP_V=`#version 300 es
precision highp float;layout(location=0) in vec3 position;layout(location=4) in mat4 instanceMatrix;uniform mat4 modelMatrix,vp;void main(){gl_Position=vp*modelMatrix*instanceMatrix*vec4(position,1.0);}`;
const DEP_F=`#version 300 es
precision highp float;out vec4 o;void main(){o=vec4(1.0);}`;
const SPR_V=`#version 300 es
precision highp float;layout(location=0) in vec2 corner;uniform mat4 modelMatrix,viewMatrix,projectionMatrix;uniform vec2 center;uniform float rot;uniform vec2 uvRep;out vec2 vUv;out float vDepth;
void main(){vec2 sc=vec2(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz));vec4 mv=viewMatrix*modelMatrix*vec4(0.0,0.0,0.0,1.0);vec2 a=(corner-center)*sc;float c=cos(rot),s=sin(rot);mv.xy+=vec2(c*a.x-s*a.y,s*a.x+c*a.y);vUv=corner*uvRep;vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;
const SPR_F=`#version 300 es
precision highp float;in vec2 vUv;in float vDepth;out vec4 o;uniform vec3 diffuse;uniform float opacity;uniform bool useMap,useFog;uniform sampler2D map;uniform vec3 fogColor;uniform float fogNear,fogFar;
void main(){vec4 d=vec4(diffuse,opacity);if(useMap)d*=texture(map,vUv);if(useFog)d.rgb=mix(d.rgb,fogColor,smoothstep(fogNear,fogFar,vDepth));o=d;}`;
class WebGLRenderer{constructor(o={}){const canvas=o.canvas||document.createElement('canvas');this.domElement=canvas;const gl=canvas.getContext('webgl2',{antialias:o.antialias!==false,alpha:false,preserveDrawingBuffer:true});if(!gl)throw new Error('WebGL2 indisponible');
    this.gl=gl;this.pr=1;this.shadowMap={enabled:false,type:1};this.info={render:{calls:0,triangles:0}};this.capabilities={getMaxAnisotropy:()=>1,isWebGL2:true};this._prog={};this._w=canvas.width;this._h=canvas.height;
    this._std=this._mk(STD_V,STD_F,'std');this._dep=this._mk(DEP_V,DEP_F,'dep');this._spr=this._mk(SPR_V,SPR_F,'spr');this._quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this._quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([0,0,1,0,1,1,0,0,1,1,0,1]),gl.STATIC_DRAW);
    this._white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this._white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));}
  _mk(v,f,name){const gl=this.gl,sh=(ty,src)=>{const s=gl.createShader(ty);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const m='[three-lite] shader '+name+' : '+gl.getShaderInfoLog(s);console.error(m);(window.__shaderErrors=window.__shaderErrors||[]).push(m);}return s;},p=gl.createProgram();
    gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const m='[three-lite] lien '+name+' : '+gl.getProgramInfoLog(p);console.error(m);(window.__shaderErrors=window.__shaderErrors||[]).push(m);}
    const u={},n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);u[a.name.replace(/\[0\]$/,'')]={loc:gl.getUniformLocation(p,a.name),type:a.type};}return{p,u};}
  setPixelRatio(v){this.pr=v;this.setSize(this._cw||this.domElement.width,this._ch||this.domElement.height,false);}getPixelRatio(){return this.pr;}
  setSize(w,h,style){this._cw=w;this._ch=h;const c=this.domElement;c.width=Math.floor(w*this.pr);c.height=Math.floor(h*this.pr);if(style!==false){c.style.width=w+'px';c.style.height=h+'px';}}
  dispose(){}
  _buf(geo,name){const gl=this.gl,a=name==='index'?geo.index:geo.attributes[name];if(!a)return null;if(!a._b){a._b=gl.createBuffer();a._v=-1;}if(a._v!==a.version){const tg=name==='index'?gl.ELEMENT_ARRAY_BUFFER:gl.ARRAY_BUFFER;gl.bindBuffer(tg,a._b);gl.bufferData(tg,a.array,gl.STATIC_DRAW);a._v=a.version;}return a;}
  _tex(t){const gl=this.gl;if(!t._t){t._t=gl.createTexture();t._v=-1;}gl.bindTexture(gl.TEXTURE_2D,t._t);
    if(t._v!==t.version||(t._v===-1)){gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,t.flipY?1:0);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,0);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);const im=t.image;
      if(im&&im.data)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,im.width,im.height,0,gl.RGBA,gl.UNSIGNED_BYTE,im.data);else if(im)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
      const wr=v=>v===1000?gl.REPEAT:v===1002?gl.MIRRORED_REPEAT:gl.CLAMP_TO_EDGE,mip=t.generateMipmaps&&t.minFilter===1008;gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,wr(t.wrapS));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,wr(t.wrapT));
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,t.magFilter===1003?gl.NEAREST:gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:t.minFilter===1003?gl.NEAREST:gl.LINEAR);if(mip)gl.generateMipmap(gl.TEXTURE_2D);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,0);t._v=t.version;}}
  _state(m,flip){const gl=this.gl;if(m.side===2)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(m.side===1?gl.FRONT:gl.BACK);}gl.frontFace(flip?gl.CW:gl.CCW);
    if(m.depthTest){gl.enable(gl.DEPTH_TEST);gl.depthFunc([gl.NEVER,gl.ALWAYS,gl.LESS,gl.LEQUAL,gl.EQUAL,gl.GEQUAL,gl.GREATER,gl.NOTEQUAL][m.depthFunc]);}else gl.disable(gl.DEPTH_TEST);gl.depthMask(!!m.depthWrite);gl.colorMask(m.colorWrite,m.colorWrite,m.colorWrite,m.colorWrite);
    if(m.transparent||m.blending===2){gl.enable(gl.BLEND);if(m.blending===2)gl.blendFunc(gl.SRC_ALPHA,gl.ONE);else gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);}else gl.disable(gl.BLEND);
    if(m.polygonOffset){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(m.polygonOffsetFactor,m.polygonOffsetUnits);}else gl.disable(gl.POLYGON_OFFSET_FILL);}
  _attrs(o,withAll){const gl=this.gl,g=o.geometry,bind=(name,loc,n)=>{const a=this._buf(g,name);if(a){gl.bindBuffer(gl.ARRAY_BUFFER,a._b);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,n,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(loc,0);}else{gl.disableVertexAttribArray(loc);if(loc===3)gl.vertexAttrib3f(3,1,1,1);else if(loc===1)gl.vertexAttrib3f(1,0,1,0);else gl.vertexAttrib2f(loc,0,0);}};
    bind('position',0,3);if(withAll){bind('normal',1,3);bind('uv',2,2);bind('color',3,3);}
    if(o.isInstancedMesh){const im=o.instanceMatrix;if(!im._b){im._b=gl.createBuffer();im._v=-1;}gl.bindBuffer(gl.ARRAY_BUFFER,im._b);if(im._v!==im.version){gl.bufferData(gl.ARRAY_BUFFER,im.array,gl.DYNAMIC_DRAW);im._v=im.version;}
      for(let i=0;i<4;i++){gl.enableVertexAttribArray(4+i);gl.vertexAttribPointer(4+i,4,gl.FLOAT,false,64,i*16);gl.vertexAttribDivisor(4+i,1);}}
    else for(let i=0;i<4;i++){gl.disableVertexAttribArray(4+i);gl.vertexAttribDivisor(4+i,0);gl.vertexAttrib4f(4+i,i===0?1:0,i===1?1:0,i===2?1:0,i===3?1:0);}}
  _draw(o){const gl=this.gl,g=o.geometry,ix=this._buf(g,'index'),n=ix?ix.count:g.attributes.position.count,inst=o.isInstancedMesh?o.count:0;this.info.render.calls++;this.info.render.triangles+=n/3*(inst||1);
    if(ix){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ix._b);const ty=ix.array instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;if(inst)gl.drawElementsInstanced(gl.TRIANGLES,n,ty,0,inst);else gl.drawElements(gl.TRIANGLES,n,ty,0);}
    else if(inst)gl.drawArraysInstanced(gl.TRIANGLES,0,n,inst);else gl.drawArrays(gl.TRIANGLES,0,n);}
  _uni(pr,name,v){const gl=this.gl,u=pr.u[name];if(!u||v===undefined||v===null)return;const l=u.loc;
    if(typeof v==='number'||typeof v==='boolean'){if(u.type===gl.INT||u.type===gl.BOOL||u.type===gl.SAMPLER_2D)gl.uniform1i(l,+v);else gl.uniform1f(l,+v);}
    else if(v.isColor)gl.uniform3f(l,v.r,v.g,v.b);else if(v.elements)(v.elements.length===9?gl.uniformMatrix3fv(l,false,v.elements):gl.uniformMatrix4fv(l,false,v.elements));
    else if(v.z!==undefined&&v.w!==undefined)gl.uniform4f(l,v.x,v.y,v.z,v.w);else if(v.z!==undefined)gl.uniform3f(l,v.x,v.y,v.z);else if(v.y!==undefined)gl.uniform2f(l,v.x,v.y);
    else if(v.length===16)gl.uniformMatrix4fv(l,false,v);else if(v.length===3)gl.uniform3fv(l,v);else if(v.length===2)gl.uniform2fv(l,v);}
  render(scene,camera){const gl=this.gl,cv=this.domElement,W=cv.width,H=cv.height;this.info.render.calls=0;this.info.render.triangles=0;
    scene.updateMatrixWorld();if(!camera.parent)camera.updateMatrixWorld();camera.matrixWorldInverse.copy(camera.matrixWorld).invert();const view=camera.matrixWorldInverse,proj=camera.projectionMatrix,camPos=new Vector3().setFromMatrixPosition(camera.matrixWorld);
    // listes
    const opaque=[],transp=[],L={hemiSky:new Color(0),hemiGround:new Color(0),ambient:new Color(0),dirDir:new Vector3(0,1,0),dirColor:new Color(0),ptPos:new Vector3(),ptColor:new Color(0),ptDist:0,ptDecay:1};let sun=null;const ve=view.elements;
    const walk=(o,vis)=>{vis=vis&&o.visible;if(!vis)return;
      if(o.isLight){if(o.isHemisphereLight){L.hemiSky.copy(o.color).multiplyScalar(o.intensity);L.hemiGround.copy(o.groundColor).multiplyScalar(o.intensity);}else if(o.isAmbientLight)L.ambient.copy(o.color).multiplyScalar(o.intensity);
        else if(o.isDirectionalLight){const p=new Vector3().setFromMatrixPosition(o.matrixWorld),t=new Vector3().setFromMatrixPosition(o.target.matrixWorld);L.dirDir.subVectors(p,t).normalize();L.dirColor.copy(o.color).multiplyScalar(o.intensity);sun=o;sun._p=p;sun._t=t;}
        else if(o.isPointLight){L.ptPos.setFromMatrixPosition(o.matrixWorld);L.ptColor.copy(o.color).multiplyScalar(o.intensity);L.ptDist=o.distance||1e6;L.ptDecay=o.decay;}}
      else if((o.isMesh||o.isSprite)&&o.material&&o.material.visible!==false&&(o.isSprite||(o.geometry&&o.geometry.attributes.position))){const e=o.matrixWorld.elements;o._z=-(ve[2]*e[12]+ve[6]*e[13]+ve[10]*e[14]+ve[14]);(o.material.transparent?transp:opaque).push(o);}
      for(const c of o.children)walk(c,vis);};
    walk(scene,true);if(sun&&sun.target&&!sun.target.parent)sun.target.updateMatrixWorld();
    opaque.sort((a,b)=>a.renderOrder-b.renderOrder||a._z-b._z||a.id-b.id);transp.sort((a,b)=>a.renderOrder-b.renderOrder||b._z-a._z||a.id-b.id);
    // ombres du soleil
    let shOn=false;const shMat=new Matrix4();
    if(this.shadowMap.enabled&&sun&&sun.castShadow){const S=sun.shadow,sz=S.mapSize.x;if(!this._sh||this._sh.sz!==sz){const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,sz,sz,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        const fb=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,tex,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);this._sh={tex,fb,sz};}
      const lv=new Matrix4().lookAt(sun._p,sun._t,_up);lv.setPosition(sun._p);lv.invert();const c=S.camera,lp=new Matrix4().makeOrthographic(c.left,c.right,c.top,c.bottom,c.near,c.far);shMat.multiplyMatrices(lp,lv);
      gl.bindFramebuffer(gl.FRAMEBUFFER,this._sh.fb);gl.viewport(0,0,sz,sz);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);gl.colorMask(false,false,false,false);gl.disable(gl.BLEND);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(this._dep.p);this._uni(this._dep,'vp',shMat);
      for(const o of opaque.concat(transp)){if(!o.castShadow||!o.isMesh||o.material.isShaderMaterial)continue;const m=o.material;if(m.side===2)gl.disable(gl.CULL_FACE);else{gl.enable(gl.CULL_FACE);gl.cullFace(m.side===1?gl.BACK:gl.FRONT);}gl.frontFace(o.matrixWorld.determinant()<0?gl.CW:gl.CCW);
        this._uni(this._dep,'modelMatrix',o.matrixWorld);this._attrs(o,false);this._draw(o);}
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);shOn=true;}
    const calls0=this.info.render.calls,tris0=this.info.render.triangles;this.info.render.calls=0;this.info.render.triangles=0;this.info.shadow={calls:calls0,triangles:tris0};
    gl.viewport(0,0,W,H);gl.colorMask(true,true,true,true);gl.depthMask(true);const bg=scene.background&&scene.background.isColor?scene.background:new Color(0);gl.clearColor(bg.r,bg.g,bg.b,1);gl.clearDepth(1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const fog=scene.fog,mv=new Matrix4();
    for(const o of opaque.concat(transp)){const m=o.material,flip=o.matrixWorld.determinant()<0;
      if(o.isSprite){const pr=this._spr;gl.useProgram(pr.p);this._state(m,false);gl.disable(gl.CULL_FACE);this._uni(pr,'modelMatrix',o.matrixWorld);this._uni(pr,'viewMatrix',view);this._uni(pr,'projectionMatrix',proj);this._uni(pr,'center',o.center);this._uni(pr,'rot',m.rotation||0);
        this._uni(pr,'diffuse',m.color);this._uni(pr,'opacity',m.opacity);this._uni(pr,'useMap',!!m.map);this._uni(pr,'uvRep',m.map?m.map.repeat:new Vector2(1,1));gl.activeTexture(gl.TEXTURE0);if(m.map)this._tex(m.map);else gl.bindTexture(gl.TEXTURE_2D,this._white);this._uni(pr,'map',0);
        this._uni(pr,'useFog',!!(fog&&m.fog));if(fog){this._uni(pr,'fogColor',fog.color);this._uni(pr,'fogNear',fog.near);this._uni(pr,'fogFar',fog.far);}
        for(let i=1;i<8;i++){gl.disableVertexAttribArray(i);gl.vertexAttribDivisor(i,0);}gl.bindBuffer(gl.ARRAY_BUFFER,this._quad);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.vertexAttribDivisor(0,0);gl.drawArrays(gl.TRIANGLES,0,6);this.info.render.calls++;continue;}
      if(m.isShaderMaterial){let pr=m._pr;if(!pr||m._src!==m.vertexShader+m.fragmentShader){pr=m._pr=this._mk(PRE_V+m.vertexShader,PRE_F+m.fragmentShader,'ShaderMaterial');m._src=m.vertexShader+m.fragmentShader;}gl.useProgram(pr.p);this._state(m,flip);
        mv.multiplyMatrices(view,o.matrixWorld);this._uni(pr,'modelMatrix',o.matrixWorld);this._uni(pr,'viewMatrix',view);this._uni(pr,'modelViewMatrix',mv);this._uni(pr,'projectionMatrix',proj);this._uni(pr,'cameraPosition',camPos);
        let unit=0;for(const k in m.uniforms){const v=m.uniforms[k].value;if(v&&v.isTexture){gl.activeTexture(gl.TEXTURE0+unit);this._tex(v);this._uni(pr,k,unit++);}else this._uni(pr,k,v);}
        this._attrs(o,true);this._draw(o);continue;}
      const pr=this._std;gl.useProgram(pr.p);this._state(m,flip);this._uni(pr,'modelMatrix',o.matrixWorld);this._uni(pr,'viewMatrix',view);this._uni(pr,'projectionMatrix',proj);this._uni(pr,'cameraPosition',camPos);
      this._uni(pr,'lit',m.lit|0);this._uni(pr,'diffuse',m.color);this._uni(pr,'opacity',m.opacity);const em=m.emissive?m.emissive.clone().multiplyScalar(m.emissiveIntensity===undefined?1:m.emissiveIntensity):new Color(0);this._uni(pr,'emissive',em);this._uni(pr,'specular',m.specular||new Color(0));this._uni(pr,'shininess',m.shininess||30);
      this._uni(pr,'useMap',!!m.map);this._uni(pr,'useVC',!!m.vertexColors);this._uni(pr,'flatS',!!m.flatShading);this._uni(pr,'dbl',m.side===2);this._uni(pr,'uvRep',m.map?m.map.repeat:new Vector2(1,1));
      gl.activeTexture(gl.TEXTURE0);if(m.map)this._tex(m.map);else gl.bindTexture(gl.TEXTURE_2D,this._white);this._uni(pr,'map',0);
      for(const k in L)this._uni(pr,k,L[k]);this._uni(pr,'useFog',!!(fog&&m.fog));if(fog){this._uni(pr,'fogColor',fog.color);this._uni(pr,'fogNear',fog.near);this._uni(pr,'fogFar',fog.far);}
      this._uni(pr,'hasSh',shOn);this._uni(pr,'recv',!!o.receiveShadow);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shOn?this._sh.tex:this._white);this._uni(pr,'shMap',1);
      if(shOn){this._uni(pr,'shMat',shMat);this._uni(pr,'shBias',sun.shadow.bias*1.0-0.0006);this._uni(pr,'shNB',sun.shadow.normalBias||0);this._uni(pr,'shTexel',1/this._sh.sz);}
      this._attrs(o,true);this._draw(o);}
    gl.depthMask(true);gl.colorMask(true,true,true,true);}}
Object.assign(T,{Vector2,Vector3,Euler,Matrix4,Color,Object3D,Group,Scene,Mesh,InstancedMesh,Sprite,Camera,PerspectiveCamera,Light,AmbientLight,HemisphereLight,DirectionalLight,PointLight,Fog,
  BufferAttribute,Float32BufferAttribute,Uint16BufferAttribute,Uint32BufferAttribute,BufferGeometry,BoxGeometry,SphereGeometry,CylinderGeometry,ConeGeometry,TorusGeometry,CircleGeometry,RingGeometry,PlaneGeometry,
  PolyhedronGeometry,TetrahedronGeometry,OctahedronGeometry,IcosahedronGeometry,DodecahedronGeometry,Material,MeshBasicMaterial,MeshLambertMaterial,MeshPhongMaterial,MeshStandardMaterial,SpriteMaterial,ShaderMaterial,Texture,CanvasTexture,DataTexture,WebGLRenderer});
// alias historiques de three (r128 les accepte encore)
for(const k of['Box','Sphere','Cylinder','Cone','Torus','Circle','Ring','Plane','Octahedron','Icosahedron','Dodecahedron','Tetrahedron'])T[k+'BufferGeometry']=T[k+'Geometry'];
window.THREE=T;
})();
