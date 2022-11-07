import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


const container  = document.querySelector('.container');
const canvas     = document.querySelector('.canvas');

let sizes,
camera,
scene,
light,
renderer,
controls,
iceSphere,
groundSphere;


const init = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };
  
  camera             = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 1, 5000);
  camera.position.z  = 500;
  
  scene              = new THREE.Scene();
  
  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1).normalize();
  scene.add(light);
      
  renderer = new THREE.WebGLRenderer({
    canvas:     canvas,
    antialias:  false,
    alpha:      true
  });
  renderer.setPixelRatio(window.devicePixelRatio * 0.8);
  
  controls               = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  createWireframe();
  createModel();
  resize();
  listenTo();
  render();

}


const createWireframe = () => {

  const geometry  = [
    [new THREE.IcosahedronGeometry( 100, 16 ), 50],
    [new THREE.IcosahedronGeometry( 100, 8 ), 300],
    [new THREE.IcosahedronGeometry( 100, 4 ), 1000],
    [new THREE.IcosahedronGeometry( 100, 2 ), 2000],
    [new THREE.IcosahedronGeometry( 100, 1 ), 8000]
  ];

  const material  = new THREE.MeshLambertMaterial({color: 0xffffff, wireframe: true});
  const lod       = new THREE.LOD();

  for ( let i = 0; i < geometry.length; i ++ ) {

    const mesh = new THREE.Mesh(geometry[i][0], material);
    mesh.scale.set(1.5, 1.5, 1.5);
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    lod.addLevel(mesh, geometry[i][1]);

  }

  lod.position.set(-170, 0, 0);
  lod.updateMatrix();
  lod.matrixAutoUpdate = false;
  scene.add(lod);

}

const createModel = async () => {

  const onLoad = async (gltf) => {

    switch(gltf.scene.name) {
      case 'ice_sphere':
        iceSphere = gltf.scene;
        break;
      case 'ground_sphere':
        groundSphere = gltf.scene;
        break;
    }

  }

  const gltfLoader = new GLTFLoader();

  gltfLoader.load('ice_sphere/scene.gltf', onLoad);
  gltfLoader.load('groundstone_sphere/scene.gltf', onLoad);

  const lodModel = new THREE.LOD();

  setTimeout(() => {
  
    lodModel.addLevel(iceSphere, 1000);
    lodModel.addLevel(groundSphere, 50);
  
    lodModel.position.set(170, 0, 0);
    lodModel.scale.set(1.5, 1.5, 1.5);

    lodModel.updateMatrix();
    lodModel.matrixAutoUpdate = false;

    scene.add(lodModel);
    
  }, 1000);

}

const resize = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  }
  
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);

}

const listenTo = () => {

  window.addEventListener('resize', resize.bind(this));

}

const render = () => {

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render.bind(this))

}

init();
