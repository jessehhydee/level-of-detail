# level-of-detail - Three.js Working example

An example to test out Three.js LOD tool.
<br>
Level of detail is used to improve rendering performance. If an assets is not near the camera, there is no need to show it in great detail.
A great example of LOD in practice is Google Earth.

For info: https://threejs.org/docs/#api/en/objects/LOD

The application displays two spheres:

<ol>
  <li>
    One is a wireframe of a sphere. 
    The closer the camera gets to the sphere, the more detailed the sphere becomes (more verticies).
    The further away the camera get from the sphere, the less deatiled the sphere becomes.
  </li>
  <li>
    One is a 3D model (.gltf).
    As the camera gets closer to the model, the model is replaced with a new model containing more detail.
    If the camera gets further away, the model chagnes again to the less detailed model.
  </li>
</ol>


Con's I have come across:
<ul>
  <li>
    Does not lazy load. ie.. if using 3 LOD levels and the user lands on the lowest quality level on page load, this level does not display until all levels have been loaded - even though they are not initially visible. So using LOD actually means resource loading takes 3 times longer then if we were only displaying the one resource.
  </li>
  <li>
    Using LOD does not dispose non-visible levels from the scene. They are still held in memory. Take this a either a good or ma bad thing.
  </li>
</ul>


