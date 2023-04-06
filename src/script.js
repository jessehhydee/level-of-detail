import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DoubleSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { gsap } from "gsap";


const container  = document.querySelector('.container');
const canvas     = document.querySelector('.canvas');

let sizes,
camera,
scene,
renderer,
allObjects,
activeObj,
rockLOD,
controls,
cleanMemGroup,
keepInMemGroup,
gltfLoader,
assetLoading,
loadedAsset;

allObjects    = [];
activeObj     = -1;
assetLoading  = false;
rockLOD       = [
  {
    asset:          'high-poly-rock/scene.gltf',
    distance:       50,
    scale:          new THREE.Vector3(80, 80, 80),
    posYAdjustment: -3
  },
  {
    asset:          'low-poly-rock/scene.gltf',
    distance:       80,
    scale:          new THREE.Vector3(40, 40, 40),
    posYAdjustment: 3
  }
];


const init = () => {

  sizes = {
    width:  container.offsetWidth,
    height: container.offsetHeight
  };

  scene = new THREE.Scene();
      
  renderer = new THREE.WebGLRenderer({
    canvas:     canvas,
    antialias:  false,
    alpha:      true
  });
  renderer.setPixelRatio(window.devicePixelRatio * 0.8);

  camera            = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 1, 1000);
  camera.position.z = 40;

  controls               = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.HemisphereLight(0xffffbb, 0x080820, 1));
  // scene.add(new THREE.AmbientLight(0xffffbb, 2));

  gltfLoader = new GLTFLoader();
  
  setOuterSphere();
  setCleanMemGroup();
  setKeepInMemGroup();
  createWireframe();
  useThreeLOD(rockLOD);
  cleanMemoryLOD(rockLOD);
  keepInMemoryLOD(rockLOD);
  terrainToPlane();
  loopThrough();
  resize();
  listenTo();
  render();

}

const setOuterSphere = () => {

  const panoSphere    = new THREE.SphereGeometry(160, 50, 50);
  const panoMaterial  = new THREE.MeshStandardMaterial({
    color:  new THREE.Color(0, 0.133, 0.118),
    side:   DoubleSide,
  });

  scene.add(new THREE.Mesh(panoSphere, panoMaterial));
  
}

const setCleanMemGroup = () => {

  cleanMemGroup = new THREE.Group();
  cleanMemGroup.scale.set(40, 40, 40);
  cleanMemGroup.position.set(0, 0, -200);

  allObjects[2] = cleanMemGroup;
  scene.add(cleanMemGroup);

}

const setKeepInMemGroup = () => {

  keepInMemGroup  = new THREE.Group();
  keepInMemGroup.scale.set(40, 40, 40);
  keepInMemGroup.position.set(0, 0, -200);

  allObjects[3] = keepInMemGroup;
  scene.add(keepInMemGroup);

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
    [new THREE.IcosahedronGeometry( 100, 16 ), 10],
    [new THREE.IcosahedronGeometry( 100, 8 ), 30],
    [new THREE.IcosahedronGeometry( 100, 4 ), 50],
    [new THREE.IcosahedronGeometry( 100, 2 ), 60],
    [new THREE.IcosahedronGeometry( 100, 1 ), 80]
  ];

  const material  = new THREE.MeshLambertMaterial({
    color:      0xffffff, 
    wireframe:  true
  });
  const lod = new THREE.LOD();

  for(let i = 0; i < geometry.length; i ++) {
    const mesh = new THREE.Mesh(geometry[i][0], material);
    mesh.scale.set(0.1, 0.1, 0.1);
    lod.addLevel(mesh, geometry[i][1]);
  }

  lod.position.set(0, 0, -200);
  allObjects[0] = lod;
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
const useThreeLOD = async (details) => {

  const lodModel = new THREE.LOD();

  for(let i = 0; i < details.length; i++) {

    const model = await gltfLoader.loadAsync(details[i].asset);
    model.scene.scale.set(details[i].scale.x, details[i].scale.y, details[i].scale.z);
    model.scene.position.set(0, details[i].posYAdjustment, -200);
    lodModel.addLevel(model.scene, details[i].distance);
    
  }

  allObjects[1] = lodModel;
  scene.add(lodModel);

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
const terrainToPlane = async () => {

  let   plane;
  const lodTerrain  = new THREE.LOD();
  const model       = await gltfLoader.loadAsync('terrain/scene.gltf');

  model.scene.traverse(obj => {
    if(obj instanceof THREE.Mesh) {

      const gltfMin = obj.geometry.boundingBox.min;
      const gltfMax = obj.geometry.boundingBox.max;

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
      plane.rotation.x  = -(Math.PI / 2) * 0.7;

    }
  });

  model.scene.rotation.x = 0.6;

  lodTerrain.position.set(0, 0, -200);
  lodTerrain.scale.set(10, 10, 10);

  lodTerrain.addLevel(model.scene, 50);
  lodTerrain.addLevel(plane, 80);

  allObjects[4] = lodTerrain;
  scene.add(lodTerrain);

}

const loopThrough = () => {

  const tl = gsap.timeline();
  if(activeObj >= 0) {
    tl
    .to(allObjects[activeObj].position, {
      z:        -200,
      duration: 2
    })
    .to(allObjects[activeObj + 1 > activeObj.length - 1 ? 0 : activeObj + 1].position, {
      z:        0,
      duration: 2
    });
    return;
  }

  tl.to(allObjects[0].position, {
    z:        0,
    duration: 2
  });

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
    cleanMemoryLOD(rockLOD);
    keepInMemoryLOD(rockLOD);
  });

}

const render = () => {

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render.bind(this))

}

init();
