import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';


/**
 * This is an example of how one can change a 3D terrain asset into a plane when the user is not near the particular terrain section.
 * When the terrain tile/section is changed to a plane, we overlay the plane with the terrains texture.
 * By doing this, we reduce all vertices in the tile to 4 (a plane contains 4 vertices), keep it looking visually recognisable due to the texture still being the same, and overall improve rendering performance.
 */

const example = () => {

  const scene = new THREE.Scene();

  const onLoad = async (gltf) => {

    let size,
    plane;

    if(gltf.scene.children[0].children[0] instanceof THREE.Mesh) {
  
      const gltfMin = gltf.scene.children[0].children[0].geometry.boundingBox.min;
      const gltfMax = gltf.scene.children[0].children[0].geometry.boundingBox.max;
  
      size = {
        height: gltfMax.z - gltfMin.z,
        width:  gltfMax.x - gltfMin.x,
        depth:  gltfMax.y - gltfMin.y
      };
  
      const geometry    = new THREE.PlaneGeometry(size.width, size.depth);
      const texture     = new THREE.TextureLoader().load( 'MODEL-TEXTURE' );
      const material    = new THREE.MeshLambertMaterial({map: texture, side: THREE.DoubleSide});
      plane             = new THREE.Mesh(geometry, material);
      plane.position.y  = size.height * 100;
      plane.scale.set(100, 100, 100);
      plane.rotation.x  = -(Math.PI / 2);
  
    }

    const lodModel = new THREE.LOD();
  
    setTimeout(() => {
    
      lodModel.addLevel(gltf.scene, 500);
      lodModel.addLevel(plane, 30000);
  
      lodModel.updateMatrix();
      lodModel.matrixAutoUpdate = false;
  
      scene.add(lodModel);
      
    }, 1000);

  }

  const gltfLoader = new GLTFLoader();

  gltfLoader.load('ice_sphere/scene.gltf', onLoad);
  gltfLoader.load('groundstone_sphere/scene.gltf', onLoad);

}