import * as THREE from 'three';

/**
 * USES THREE LOD.
 * https://threejs.org/docs/#api/en/objects/LOD
 * 
 * Creates many geometric spheres with varying detail (vertices) and level distances.
 * Store them in @var geometry.
 * 
 * Loop through spheres, create mesh for each one & add each mesh as a level.
 * 
 * Add LOD to scene.
 */
const threeLODWithGeometry = () => {

  const geometry  = [
    [new THREE.IcosahedronGeometry( 100, 16 ), 10],
    [new THREE.IcosahedronGeometry( 100, 8 ), 30],
    [new THREE.IcosahedronGeometry( 100, 4 ), 50],
    [new THREE.IcosahedronGeometry( 100, 2 ), 60],
    [new THREE.IcosahedronGeometry( 100, 1 ), 80]
  ];

  const material = new THREE.MeshLambertMaterial({
    color:      0xffffff, 
    wireframe:  true
  });
  const lod = new THREE.LOD();

  for(let i = 0; i < geometry.length; i ++) {
    const mesh = new THREE.Mesh(geometry[i][0], material);
    lod.addLevel(mesh, geometry[i][1]);
  }

  scene.add(lod);

}