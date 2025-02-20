# level-of-detail

A comparison on performance and rendering speed between three.js LOD tool and two self written LOD tools.
<br>
Level of detail is used to improve rendering performance. If an assets is not near the camera, there is no need to show it in great detail.
A great example of LOD in practice is Google Earth.

For info: <a href="https://threejs.org/docs/#api/en/objects/LOD" target="_blank">https://threejs.org/docs/#api/en/objects/LOD</a>

### Viewer Contents:

The viewer application displays 5 LOD examples:

<ol>
  <li>
    A wireframe of a sphere using THREE.LOD.
    The closer the camera gets to the sphere, the more detailed the sphere becomes (more vertices).
    The further away the camera gets from the sphere, the less detailed the sphere becomes.
  </li>
  <li>
    A 3D model using THREE.LOD.
    As the camera gets closer to the model, the model is replaced with a new model containing more detail.
    If the camera gets farther away, the model changes again to the less detailed model.
  </li>
  <li>
    A 3D model using a self-written LOD method which only loads gltf assets when needed and clears non-needed assets from memory.
  </li>
  <li>
    A 3D model using a self-written LOD method that only loads gltf assets when needed but keeps/holds non-needed assets in memory for a more responsive toggle between assets when the users reach different LOD levels.
  </li>
  <li>
    A 3D model that is only '3D' when the user is near it.
    Otherwise, it is simply a plane wrapped in the 3D model's texture.
    This example uses THREE.LOD.
  </li>
</ol>

![alt text](https://github.com/jessehhydee/level-of-detail/blob/main/viewer/screenshots/landing-page.png?raw=true)

![alt text](https://github.com/jessehhydee/level-of-detail/blob/main/viewer/screenshots/terrain-to-plane.png?raw=true)

To view, checkout: <a href="https://hydeit.co/level-of-detail/" target="_blank">https://hydeit.co/level-of-detail/</a>

### Tools

Each file under tools contains an example of how to use its feature.
No files contain actual scenes that can be served - files are simply for reference.

### Con's Of THREE.LOD:

Con's I have come across regarding the available three.js LOD tool:
<ul>
  <li>
    Does not lazy load. ie.. if using 3 LOD levels and the user lands on the lowest quality level on page load, this level does not display until all levels have been loaded - even though they are not initially visible. So using LOD actually means resource loading takes 3 times longer then if we were only displaying the one resource.
  </li>
  <li>
    Using LOD does not dispose of non-visible levels from the scene. They are still held in memory. Take this a either a good or a bad thing.
  </li>
</ul>


