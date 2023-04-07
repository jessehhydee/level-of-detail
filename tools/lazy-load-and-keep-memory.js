import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let keepInMemGroup;
let assetLoading = false;

const init = () => {

  controls = new OrbitControls();

  keepInMemGroup = new THREE.Group();
  scene.add(keepInMemGroup);

  controls.addEventListener('change', () => {
    lazyLoadKeepMemory();
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
 * If asset not currently loaded within keepInMemGroup and the distance is in the range of the assets level,
 * and a asset is not currently loading (this process isn't already happening in the dom), load gltf asset.
 * After loading, add new GLTF to keepInMemGroup.
 * 
 * If the asset is already loaded within keepInMemGroup and the distance is in the range of the assets level,
 * and an asset is not currently loading, loop through keepInMemGroup's children (gltf's) and 
 * make current asset visible, and leave all others invisible.
 * 
 */
const lazyLoadKeepMemory = () => {

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
  const distance = camera.position.distanceTo(keepInMemGroup.position);
  
  for(let i = 0; i < models.length; i++) {
  
    let nextDistance = 100000;
    if(i !== models.length - 1) nextDistance = models[i + 1].distance;
  
    if(distance >= models[i].distance 
      && distance < nextDistance
      && !assetLoading
      && keepInMemGroup.children.filter(el => el.name === models[i].path).length === 0) {
            
        assetLoading = true;
  
        gltfLoader.load(models[i].path, (gltf) => {
          keepInMemGroup.add(gltf.scene);
          assetLoading = false; 
          return;
        });
  
    }
  
    if(distance >= models[i].distance 
      && distance < nextDistance
      && !assetLoading) {

        keepInMemGroup.children.forEach(el => {
          el.name === models[i].path ? el.visible = true : el.visible = false;
        });

      }
  
  }
  
}