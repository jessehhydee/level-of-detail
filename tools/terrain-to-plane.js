import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * This is an example of how one can change a 3D terrain asset into a 
 * plane when the user is not near the particular terrain section.
 * 
 * When the terrain tile/section is changed to a plane,
 * we overlay the plane with the terrains texture.
 * 
 * By doing this, we reduce all vertices in the tile to 4 (a plane contains 4 vertices),
 * keep it looking visually recognisable due to the texture still being the same, 
 * and overall improve rendering performance.
 */
const terrainToPlane = async () => {

  let   plane;
  const gltfLoader  = new GLTFLoader();
  const lodTerrain  = new THREE.LOD();
  const model       = await gltfLoader.loadAsync('scene.gltf');

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
      const texture     = new THREE.TextureLoader().load('your-models-texture.png');
      texture.flipY     = false;
      const material    = new THREE.MeshLambertMaterial({map: texture});
      plane             = new THREE.Mesh(geometry, material);

    }
  });

  lodTerrain.addLevel(model.scene, 0);
  lodTerrain.addLevel(plane, 50);

  scene.add(lodTerrain);

}