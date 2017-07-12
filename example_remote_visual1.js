/**
XBCAVZ_START
@require https://cdnjs.cloudflare.com/ajax/libs/three.js/r70/three.min.js
XBCAVZ_END
 */

/*
 * WebGL Tunnel - Luigi Mannoni
 * luigimannoni.com / codepen.io/luigimannoni
 * CC BY-NC 4.0 http://creativecommons.org/licenses/by-nc/4.0/ 
 */
$("#visualizer").remove();

function deg2rad(_degrees) {
  return (_degrees * Math.PI / 180);
}

var mouseX = 0, mouseY = 0;
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
var innerColor = 0x2222ff; 
var cubecam = new THREE.CubeCamera(0.1, 120, 256);
cubecam.renderTarget.minFilter = THREE.LinearMipMapLinearFilter; // mipmap filter

scene.add(cubecam);

var renderer = new THREE.WebGLRenderer({ antialias: true});
renderer.setClearColor( 0x000000, 0 ); // background

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = -110;
camera.lookAt(scene.position);
//scene.fog = new THREE.Fog(0x000000, 100, 700);

// Mesh
var group = new THREE.Group();
scene.add(group);

// Lights
var light = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( light );

var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set( 0, 128, 128 );
scene.add( directionalLight );

// Load texture first
THREE.ImageUtils.crossOrigin = '';
var tunnelTexture = THREE.ImageUtils.loadTexture('https://luigimannoni.github.io/assets/001_electric.jpg');
tunnelTexture.wrapT = tunnelTexture.wrapS = THREE.RepeatWrapping;
tunnelTexture.repeat.set( 1, 2 );

// Tunnel Mesh
var tunnelMesh = new THREE.Mesh(
  new THREE.CylinderGeometry( 50, 50, 1024, 16, 32, true ),
  new THREE.MeshBasicMaterial({ 
    color: innerColor,
    ambient: innerColor,
    transparent: true,
    alphaMap: tunnelTexture,
    shininess: 0,
    side: THREE.BackSide,
  })
);
tunnelMesh.rotation.x = deg2rad(90);
tunnelMesh.position.z = 128;
scene.add(tunnelMesh);

// Cube Mesh
var cubeMesh = new THREE.Mesh(
  new THREE.BoxGeometry( 32, 32, 32 ),
  new THREE.MeshPhongMaterial({ 
    color: 0xffffff,
    ambient: 0xffffff,
    transparent: false,
    envMap: cubecam.renderTarget,
    shininess: 100
  })
);
cubecam.position.z = cubeMesh.position.z = 5;
scene.add(cubeMesh);

// Starfield
var geometry = new THREE.Geometry();
for (i = 0; i < 5000; i++) {
  var vertex = new THREE.Vector3();
  vertex.x = Math.random()*3000-1500;
  vertex.y = Math.random()*3000-1500;
  vertex.z = Math.random()*200-100;
  geometry.vertices.push(vertex);
}
var starField = new THREE.PointCloud(geometry, new THREE.PointCloudMaterial({
  size: 0.5,
  color: 0xffff99
  })
);
scene.add(starField);
starField.position.z = 400;

var time = new THREE.Clock();

var render = function () {  
  cubeMesh.position.z = 300;
  camera.position.x = mouseX * 0.05;
  camera.position.y = -mouseY * 0.05;
  camera.lookAt(scene.position);
  
  cubeMesh.rotation.x += 0.005;
  cubeMesh.rotation.y += 0.005;
  cubeMesh.rotation.z += 0.005;
  
  starField.rotation.z += 0.005;

  var innerShift = Math.abs(Math.cos(( (time.getElapsedTime()+2.5) / 20)));
  var outerShift = Math.abs(Math.cos(( (time.getElapsedTime()+5) / 10)));

  starField.material.color.setHSL(Math.abs(Math.cos((time.getElapsedTime() / 10))), 1, 0.8);
  tunnelMesh.material.color.setHSL(Math.abs(Math.cos((time.getElapsedTime() / 10))), 1, 0.5);
  //cubeMesh.material.ambient.setHSL(Math.abs(Math.cos((time.getElapsedTime() / 10))), 1, 0.5);
  
  tunnelTexture.offset.y = time.getElapsedTime() / 2;
  tunnelTexture.offset.x = time.getElapsedTime() / 6;
  cubeMesh.visible = false;
  cubecam.updateCubeMap( renderer, scene );
  cubeMesh.visible = true;
  
  renderer.render(scene, camera);
  requestAnimationFrame(render);  
};

render();


// Mouse and resize events
document.addEventListener( 'mousemove', onDocumentMouseMove, false );
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onDocumentMouseMove( event ) {
  mouseX = event.clientX - window.innerWidth/2;
  mouseY = event.clientY - window.innerHeight/2;
}