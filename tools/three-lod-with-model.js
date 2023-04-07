import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * USES THREE LOD.
 * https://threejs.org/docs/#api/en/objects/LOD
 * 
 * Loads two different sphere models and stores them each to a unique variable for later reference.
 * 
 * Set up THREE.LOD and pass it each sphere model with different level thresholds.
 * 
 * Add LOD to scene.
 */
const threeLODWithModel = async () => {

  const lodModel    = new THREE.LOD();
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

  for(let i = 0; i < models.length; i++) {
    const model = await gltfLoader.loadAsync(models[i].asset);
    lodModel.addLevel(model.scene, models[i].distance);
  }

  scene.add(lodModel);

}