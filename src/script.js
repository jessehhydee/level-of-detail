import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';


const container  = document.querySelector('.container');
const canvas     = document.querySelector('.canvas');

let sizes,
camera,
scene,
light,
renderer,
labelRenderer,
lod,
controls,
iceSphere,
groundSphere,
cleanMemGroup,
keepInMemGroup,
gltfLoader,
assetLoading,
loadedAsset;


const init = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };
  
  camera            = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 1, 5000);
  camera.position.z = 1200;
  
  scene             = new THREE.Scene();

  cleanMemGroup     = new THREE.Group(); 
  keepInMemGroup    = new THREE.Group();
  scene.add(cleanMemGroup);
  scene.add(keepInMemGroup);
  
  light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1).normalize();
  scene.add(light);
      
  renderer = new THREE.WebGLRenderer({
    canvas:     canvas,
    antialias:  false,
    alpha:      true
  });
  renderer.setPixelRatio(window.devicePixelRatio * 0.8);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(labelRenderer.domElement);

  gltfLoader    = new GLTFLoader();

  assetLoading  = false;
  lod           = [
    {
      asset:    'groundstone_sphere/scene.gltf',
      distance: 50
    },
    {
      asset:    'ice_sphere/scene.gltf',
      distance: 1000
    }
  ]
  
  controls               = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  
  createAllLabels();
  createWireframe();
  useThreeLOD();
  cleanMemoryLOD(lod);
  keepInMemoryLOD(lod);
  resize();
  listenTo();
  render();

}

/**
 * USES THREE LOD.
 * 
 * Creates many geometric spheres with varying detail (vertices) and level distances.
 * Store them in @var geometry.
 * 
 * Loop through spheres, create mesh for each one & add each mesh as a level.
 * 
 * Add LOD to scene.
 */
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

  lod.position.set(-510, 0, 0);
  lod.updateMatrix();
  lod.matrixAutoUpdate = false;
  scene.add(lod);

}

const useThreeLOD = async () => {

  const onLoad = async (gltf) => {

    switch(gltf.scene.name) {
      case 'ice_sphere':
        iceSphere = gltf.scene;
        break;
      case 'ground_sphere':
        groundSphere = gltf.scene;
        break;
    }

    return gltf.scene;

  }

  gltfLoader.load('ice_sphere/scene.gltf', onLoad);
  gltfLoader.load('groundstone_sphere/scene.gltf', onLoad);

  const lodModel = new THREE.LOD();

  setTimeout(() => {
  
    lodModel.addLevel(iceSphere, 1000);
    lodModel.addLevel(groundSphere, 50);
  
    lodModel.position.set(-170, 0, 0);
    lodModel.scale.set(1.5, 1.5, 1.5);

    lodModel.updateMatrix();
    lodModel.matrixAutoUpdate = false;

    scene.add(lodModel);
    
  }, 1000);

}

const cleanMemoryLOD = (details) => {

  const distance = camera.position.distanceTo(new THREE.Vector3(170, 0, 0));

  for(let i = 0; i < details.length; i++) {

    let nextDistance = 100000;
    if(i !== details.length - 1) nextDistance = details[i + 1].distance;

    if(distance >= details[i].distance 
        && distance < nextDistance
        && details[i].asset !== loadedAsset) gltfLoader.load(details[i].asset, (gltf) => {
            cleanMemGroup.remove(...cleanMemGroup.children);
            gltf.scene.position.set(170, 0, 0);
            gltf.scene.scale.set(1.5, 1.5, 1.5);
            cleanMemGroup.add(gltf.scene);
            loadedAsset = details[i].asset;
          });

  }

}

const keepInMemoryLOD = (details) => {

  const distance = camera.position.distanceTo(new THREE.Vector3(510, 0, 0));

  for(let i = 0; i < details.length; i++) {

    let nextDistance = 100000;
    if(i !== details.length - 1) nextDistance = details[i + 1].distance;

    if(distance >= details[i].distance 
        && distance < nextDistance
        && !assetLoading
        && keepInMemGroup.children.filter(el => el.name === details[i].asset).length === 0) {
          
          assetLoading = true;

          gltfLoader.load(details[i].asset, (gltf) => {
            gltf.scene.position.set(510, 0, 0);
            gltf.scene.scale.set(1.5, 1.5, 1.5);
            gltf.scene.name = details[i].asset;
            keepInMemGroup.add(gltf.scene);
            assetLoading = false;
            return;
          });

    }

    if(distance >= details[i].distance 
        && distance < nextDistance
        && !assetLoading) keepInMemGroup.children.forEach(el => el.name === details[i].asset ? el.visible = true : el.visible = false);

  }

}

const createAllLabels = () => {

  createLabel('THREE.LOD', new THREE.Vector3(-510, 200, 0));                  // createWireframe()
  createLabel('THREE.LOD', new THREE.Vector3(-170, 200, 0));                  // useThreeLOD()
  createLabel('Lazy Load & Clear Memory', new THREE.Vector3(170, 200, 0));    // cleanMemoryLOD()
  createLabel('Lazy Load & Keep Memory', new THREE.Vector3(510, 200, 0));     // keepInMemoryLOD()

}

const createLabel = (label, position) => {
  
  const locationLabelChild      = document.createElement('div');
  locationLabelChild.className  = 'label';
  const locationLabelText       = document.createElement('p');
  locationLabelText.textContent = label;

  locationLabelChild.appendChild(locationLabelText);

  const locationLabel = new CSS2DObject(locationLabelChild);
  locationLabel.position.set(position.x, position.y, position.z);

  scene.add(locationLabel);

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
  controls.addEventListener('change', () => {
    cleanMemoryLOD(lod);
    keepInMemoryLOD(lod);
  });

}

const render = () => {

  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
  requestAnimationFrame(render.bind(this))

}

init();
