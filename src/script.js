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
  camera.position.z = 1800;
  
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
  terrainToPlane();
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

  for(let i = 0; i < geometry.length; i ++) {
    const mesh = new THREE.Mesh(geometry[i][0], material);
    mesh.scale.set(1.5, 1.5, 1.5);
    lod.addLevel(mesh, geometry[i][1]);
  }

  lod.position.set(-680, 0, 0);
  lod.updateMatrix();
  lod.matrixAutoUpdate = false;
  scene.add(lod);

}

/**
 * USES THREE LOD.
 * 
 * Loads two different sphere models and stores them each to a unique variable for later reference.
 * 
 * Set up THREE.LOD and pass it each sphere model with different level thresholds.
 * 
 * Add LOD to scene.
 */
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
  
    lodModel.position.set(-340, 0, 0);
    lodModel.scale.set(1.5, 1.5, 1.5);

    lodModel.updateMatrix();
    lodModel.matrixAutoUpdate = false;

    scene.add(lodModel);
    
  }, 1000);

}

/**
 * This is called everytime controls update, ie. user moves around the scene.
 * 
 * @param details - Array containing asset and distance information for each level.
 *                  lod = [
                            {
                              asset:    'groundstone_sphere/scene.gltf',
                              distance: 50
                            },
                            {
                              asset:    'ice_sphere/scene.gltf',
                              distance: 1000
                            }
                          ]

   Get distance between camera and objects center point.

   Loop through @var details
   For each level, capture the next levels distance threshold.
   If there isn't a next level, the next distance will be 100000 (for no particualr reason other then it's far away).

   If asset not currently loaded and the distance is in the range of the assets level, load the new GLTF.
   After loading, clear everything in cleanMemGroup.
   This removes the previous asset from memory.

   Add new GLTF to cleanMemGroup.

 */
const cleanMemoryLOD = (details) => {

  const distance = camera.position.distanceTo(new THREE.Vector3(0, 0, 0));

  for(let i = 0; i < details.length; i++) {

    let nextDistance = 100000;
    if(i !== details.length - 1) nextDistance = details[i + 1].distance;

    if(distance >= details[i].distance 
        && distance < nextDistance
        && details[i].asset !== loadedAsset) gltfLoader.load(details[i].asset, (gltf) => {
            cleanMemGroup.remove(...cleanMemGroup.children);
            gltf.scene.position.set(0, 0, 0);
            gltf.scene.scale.set(1.5, 1.5, 1.5);
            cleanMemGroup.add(gltf.scene);
            loadedAsset = details[i].asset;
          });

  }

}

/**
 * This is called everytime controls update, ie. user moves around the scene.
 * 
 * @param details - Array containing asset and distance information for each level.
 *                  lod = [
                            {
                              asset:    'groundstone_sphere/scene.gltf',
                              distance: 50
                            },
                            {
                              asset:    'ice_sphere/scene.gltf',
                              distance: 1000
                            }
                          ]

   Get distance between camera and objects center point.

   Loop through @var details
   For each level, capture the next levels distance threshold.
   If there isn't a next level, the next distance will be 100000 (for no particualr reason other then it's far away).

   If asset not currently loaded within keepInMemGroup and the distance is in the range of the assets level, 
   and a asset is not currently loading (this process isn't already happening in the dom), load gltf asset.
   After loading, add new GLTF to keepInMemGroup.

   If the asset is already loaded within keepInMemGroup and the distance is in the range of the assets level, 
   and an asset is not currently loading, loop through keepInMemGroup's children (gltf's) and make current asset visible, and leave all others invisible.

 */
const keepInMemoryLOD = (details) => {

  const distance = camera.position.distanceTo(new THREE.Vector3(340, 0, 0));

  for(let i = 0; i < details.length; i++) {

    let nextDistance = 100000;
    if(i !== details.length - 1) nextDistance = details[i + 1].distance;

    if(distance >= details[i].distance 
        && distance < nextDistance
        && !assetLoading
        && keepInMemGroup.children.filter(el => el.name === details[i].asset).length === 0) {
          
          assetLoading = true;

          gltfLoader.load(details[i].asset, (gltf) => {
            gltf.scene.position.set(340, 0, 0);
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

/**
 * This is an example of how one can change a 3D terrain asset into a plane when the user is not near the particular terrain section.
 * When the terrain tile/section is changed to a plane, we overlay the plane with the terrains texture.
 * By doing this, we reduce all vertices in the tile to 4 (a plane contains 4 vertices), keep it looking visually recognisable due to the texture still being the same, and overall improve rendering performance.
 */
const terrainToPlane = () => {

  let   plane;
  const lodTerrain = new THREE.LOD();

  const onLoad = async (gltf) => {

    if(gltf.scene.children[0].children[0].children[0].children[0] instanceof THREE.Mesh) {      // Will need to revisit how deep the MESH is on each use case
  
      const gltfMin = gltf.scene.children[0].children[0].children[0].children[0].geometry.boundingBox.min;
      const gltfMax = gltf.scene.children[0].children[0].children[0].children[0].geometry.boundingBox.max;
  
      const size = {
        height: gltfMax.z - gltfMin.z,
        width:  gltfMax.x - gltfMin.x,
        depth:  gltfMax.y - gltfMin.y
      };
  
      const geometry    = new THREE.PlaneGeometry(size.width, size.depth);
      const texture     = new THREE.TextureLoader().load('terrain/textures/Hills_baseColor.png');
      texture.flipY     = false;
      const material    = new THREE.MeshLambertMaterial({map: texture, side: THREE.DoubleSide});
      plane             = new THREE.Mesh(geometry, material);
      plane.position.set(680, 0, 0);
      plane.scale.set(150, 150, 150);
      plane.rotation.x  = -(Math.PI / 2) * 0.7;
  
    }

    gltf.scene.position.set(680, 0, 0);
    gltf.scene.scale.set(150, 150, 150);
    gltf.scene.rotation.x = 0.6;
  
    setTimeout(() => {
    
      lodTerrain.addLevel(gltf.scene, 50);
      lodTerrain.addLevel(plane, 1000);
  
      lodTerrain.updateMatrix();
      lodTerrain.matrixAutoUpdate = false;
  
      scene.add(lodTerrain);
      
    }, 1000);

  }

  gltfLoader.load('terrain/scene.gltf', onLoad);

}

const createAllLabels = () => {

  createLabel('THREE.LOD', new THREE.Vector3(-680, 200, 0));                  // createWireframe()
  createLabel('THREE.LOD', new THREE.Vector3(-340, 200, 0));                  // useThreeLOD()
  createLabel('Lazy Load & Clear Memory', new THREE.Vector3(0, 200, 0));      // cleanMemoryLOD()
  createLabel('Lazy Load & Keep Memory', new THREE.Vector3(340, 200, 0));     // keepInMemoryLOD()
  createLabel('Terrain to Plane', new THREE.Vector3(680, 200, 0));            // terrainToPlane()

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
  labelRenderer.setSize(sizes.width, sizes.height);

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
