import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let cleanMemGroup;
let loadedAsset;

const init = () => {

  controls = new OrbitControls();

  cleanMemGroup = new THREE.Group();
  scene.add(cleanMemGroup);

  controls.addEventListener('change', () => {
    lazyLoadCleanMemory();
  });

}

/**
 * This is called everytime controls update, ie. user moves around the scene.
 * 
 * Get distance between camera and objects center point.
 * 
 * Loop through @var models
 * For each level, capture the next levels distance threshold.
 * If there isn't a next level, the next distance will be 100000 (for no particular reason other then it's far away).
 * 
 * If asset not currently loaded and the distance is in the range of the assets level, load the new GLTF.
 * After loading, clear everything in cleanMemGroup.
 * This removes the previous asset from memory.
 * 
 * Add new GLTF to cleanMemGroup.
 * 
 */
const lazyLoadCleanMemory = () => {

  const gltfLoader  = new GLTFLoader();
  const models      = [
    {
      path: 'lowPoly.gltf',
      distance: 50
    },
    {
      path: 'highPoly.gltf',
      distance: 0
    }
  ];
  const distance = camera.position.distanceTo(cleanMemGroup.position);

  for(let i = 0; i < models.length; i++) {

    let nextDistance = 100000;
    if(i !== models.length - 1) nextDistance = models[i + 1].distance;

    if(distance >= models[i].distance 
      && distance < nextDistance
      && models[i].path !== loadedAsset) {
          
        gltfLoader.load(models[i].path, (gltf) => {

          cleanMemGroup.remove(...cleanMemGroup.children);
          cleanMemGroup.add(gltf.scene);
          loadedAsset = models[i].path;

        });

      }

  }

}