import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Deterministic layout: the same forest returns on each visit and refresh.
function randomGenerator(seed=1403){
  return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
}
const rand=randomGenerator();
export function createForest(scene){
  const animated=[];
  const obstacles=[];
  const jade=new THREE.Color('#4affaa');
  const rootMaterial=matrixMaterial(10,28,1.05,74);
  const foliageMaterial=matrixMaterial(21,16,.74,245);
  const branchMaterial=matrixMaterial(11,15,.65,481);
  const stoneMaterial=matrixMaterial(15,10,.85,22);
  const barkGeometry=new THREE.CylinderGeometry(.32,.56,1,7,1);
  const limbGeometry=new THREE.CylinderGeometry(.12,.2,1,5,1);
  const foliageGeometry=new THREE.ConeGeometry(1,1,7,1);
  const rockGeometry=new THREE.DodecahedronGeometry(1,0);
  const hexGeometry=new THREE.CylinderGeometry(1,1,1,6);
  const floor=new THREE.Mesh(new THREE.BoxGeometry(100,1,160),matrixMaterial(80,120,.38,7));
  floor.position.set(0,-.55,-181);scene.add(floor);
  // A continuous glowing walkway extends behind the Source Node.
  const path=new THREE.Mesh(new THREE.BoxGeometry(7,.055,156),matrixMaterial(12,150,1.25,32));
  path.position.set(0,.012,-181);scene.add(path);
  // Horizontal seams and roots help the player read the terrain's shape.
  for(let i=0;i<25;i++){
    const z=-113-i*5.6;
    for(let side of [-1,1]){
      const moss=new THREE.Mesh(new THREE.BoxGeometry(.14,.04,2+rand()*3),branchMaterial);
      moss.position.set(side*(4.3+rand()*3),.055,z);moss.rotation.y=rand()*.7;scene.add(moss);
    }
  }
  function tree(x,z,size,variant){
    const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
    const height=(7+rand()*6)*size;
    const trunk=new THREE.Mesh(barkGeometry,rootMaterial);
    trunk.scale.set(size,height,size);trunk.position.y=height/2;group.add(trunk);
    for(let k=0;k<3;k++){
      const y=height*(.52+k*.17);
      const crown=new THREE.Mesh(foliageGeometry,foliageMaterial);
      const width=size*(2.6-k*.55);
      crown.scale.set(width,height*(.53-k*.08),width);
      crown.position.y=y+height*.11;group.add(crown);
    }
    // Fine branches extend outward from the coded trunk.
    for(let j=0;j<3;j++){
      const theta=j*2.4+rand();
      const limb=new THREE.Mesh(limbGeometry,branchMaterial);
      const len=height*(.24+rand()*.12);
      limb.scale.set(size*.8,len,size*.8);
      limb.position.set(Math.cos(theta)*len*.24,height*(.4+j*.14),Math.sin(theta)*len*.24);
      limb.rotation.z=Math.cos(theta)*.8;limb.rotation.x=Math.sin(theta)*.8;
      group.add(limb);
    }
    obstacles.push({x,z,r:Math.max(.35,size*.57)});
    animated.push({group,phase:rand()*Math.PI*2,variant});
  }
  // A varied grove with a broad, obvious central route and organic gaps.
  for(let i=0;i<58;i++){
    let x=(rand()-.5)*83;
    let z=-116-rand()*134;
    if(Math.abs(x)<6.8)x+=(x<0?-1:1)*(7+rand()*7);
    const size=.55+rand()*.85;
    tree(x,z,size,i%3);
  }
  for(let i=0;i<38;i++){
    const x=(rand()-.5)*87,z=-118-rand()*130;
    if(Math.abs(x)<5.5)continue;
    const rock=new THREE.Mesh(rockGeometry,stoneMaterial);
    const size=.5+rand()*1.8;
    rock.scale.set(size, size*(.28+rand()*.35),size*(.7+rand()*.5));
    rock.position.set(x,rock.scale.y*.45,z);
    rock.rotation.set(rand()*.4,rand()*6.28,rand()*.25);
    scene.add(rock);
  }
  // Codified mushrooms / little lanterns guide the way near the path.
  const lanterns=[];
  const lights=[];
  const lanternStem=new THREE.CylinderGeometry(.09,.15,.78,6);
  const lanternCap=new THREE.ConeGeometry(.48,.54,7);
  for(let i=0;i<17;i++){
    const z=-117-i*7.6,side=i%2===0?1:-1;
    const x=side*(4.5+rand()*2.5);
    const g=new THREE.Group();g.position.set(x,0,z);
    const stem=new THREE.Mesh(lanternStem,rootMaterial);stem.position.y=.39;g.add(stem);
    const cap=new THREE.Mesh(lanternCap,matrixMaterial(11,7,1.9,i*7));cap.position.y=.91;g.add(cap);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({color:'#61ffbc',transparent:true,opacity:.27,depthWrite:false}));
    glow.position.y=.84;glow.scale.set(1.35,1.35,1);g.add(glow);
    scene.add(g);lanterns.push({glow,phase:i*.83});
    if(i%4===0){
      const light=new THREE.PointLight('#3bffae',1.7,10);light.position.set(x,1,z);scene.add(light);lights.push(light);
    }
  }
  // The Heart: a giant fractured tree and a listening pedestal.
  const heart=new THREE.Group();heart.position.set(0,0,-225);scene.add(heart);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(1.1,2.1,21,9,1),rootMaterial);
  trunk.position.y=10.5;heart.add(trunk);
  for(let k=0;k<5;k++){
    const canopy=new THREE.Mesh(new THREE.ConeGeometry(8.8-k*.9,10,10),foliageMaterial);
    canopy.position.y=13+k*3.2;heart.add(canopy);
  }
  const roots=[];
  for(let j=0;j<10;j++){
    const a=j*Math.PI*2/10;
    const root=new THREE.Mesh(new THREE.BoxGeometry(.32,.23,9),rootMaterial);
    root.position.set(Math.sin(a)*3,.19,Math.cos(a)*3);
    root.rotation.y=a;heart.add(root);roots.push(root);
  }
  const pedestal=new THREE.Mesh(hexGeometry,stoneMaterial);pedestal.scale.set(2.5,.55,2.5);
  pedestal.position.set(0,.3,8);heart.add(pedestal);
  const seed=new THREE.Mesh(new THREE.IcosahedronGeometry(.95,1),matrixMaterial(22,22,2.9,327));
  seed.position.set(0,2.3,8);heart.add(seed);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.9,.045,7,48),new THREE.MeshBasicMaterial({color:jade,transparent:true,opacity:.85}));
  ring.position.set(0,2.3,8);ring.rotation.x=Math.PI/2;heart.add(ring);
  const heartLight=new THREE.PointLight('#59ffc3',11,25);heartLight.position.set(0,6,-225);scene.add(heartLight);
  // Place the interactable at z=-217, in front of the tree.
  const interact={x:0,z:-217,completed:false};
  return {
    interact,obstacles,
    updateVisibility(position){for(const tree of animated){const dx=tree.group.position.x-position.x,dz=tree.group.position.z-position.z;tree.group.visible=dx*dx+dz*dz<115*115;}},
    animate(time,delta,reduceMotion=false){
      if(!reduceMotion){
        seed.rotation.y+=delta*.55;seed.position.y=2.3+Math.sin(time*1.3)*.2;
        ring.rotation.z+=delta*.15;
        for(const item of lanterns)item.glow.material.opacity=.18+.13*Math.sin(time*1.4+item.phase);
      }
    },
    activate(){
      interact.completed=true;
      seed.material=matrixMaterial(28,28,4.4,481);
      heartLight.intensity=26;heartLight.color.set('#c6fff0');
      ring.material.color.set('#d1ffef');
    }
  };
}
