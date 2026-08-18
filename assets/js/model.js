import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { STLLoader } from "./vendor/STLLoader.js";

function modelViewer() {
  var root = document.querySelector("[data-model]");
  if (!root) return;

  var stage = root.querySelector("[data-model-stage]");
  var status = root.querySelector("[data-model-status]");
  var resetBtn = root.querySelector("[data-model-reset]");
  var src = root.getAttribute("data-src");
  if (!stage || !src) return;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x12151c);

  var camera = new THREE.PerspectiveCamera(42, 1, 0.01, 2000);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  stage.appendChild(renderer.domElement);

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.zoomSpeed = 0.8;
  controls.rotateSpeed = 0.7;

  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1a1e28, 1.15));
  var key = new THREE.DirectionalLight(0xffffff, 1.35);
  key.position.set(2.2, 3.4, 2.6);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x5eead4, 0.55);
  rim.position.set(-2.4, 0.6, -1.8);
  scene.add(rim);

  var home = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
  var mesh = null;
  var frame = 0;

  function sizeRenderer() {
    var w = stage.clientWidth || 640;
    var h = stage.clientHeight || 360;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function fit(object) {
    var box = new THREE.Box3().setFromObject(object);
    var center = box.getCenter(new THREE.Vector3());
    var span = box.getSize(new THREE.Vector3());
    var maxDim = Math.max(span.x, span.y, span.z) || 1;
    object.position.sub(center);
    var dist = maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(dist * 0.95, dist * 0.55, dist * 1.15);
    camera.near = maxDim / 200;
    camera.far = maxDim * 40;
    camera.updateProjectionMatrix();
    controls.target.set(0, 0, 0);
    controls.minDistance = maxDim * 0.4;
    controls.maxDistance = maxDim * 8;
    controls.update();
    home.pos.copy(camera.position);
    home.target.copy(controls.target);
  }

  function reset() {
    camera.position.copy(home.pos);
    controls.target.copy(home.target);
    controls.update();
  }

  function tick() {
    frame = requestAnimationFrame(tick);
    controls.update();
    renderer.render(scene, camera);
  }

  sizeRenderer();
  if ("ResizeObserver" in window) {
    new ResizeObserver(sizeRenderer).observe(stage);
  } else {
    window.addEventListener("resize", sizeRenderer);
  }

  if (resetBtn) resetBtn.addEventListener("click", reset);

  new STLLoader().load(
    src,
    function (geometry) {
      geometry.computeVertexNormals();
      mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0xb7c0cc,
          metalness: 0.28,
          roughness: 0.42
        })
      );
      scene.add(mesh);
      fit(mesh);
      if (status) status.textContent = "Drag to orbit · scroll to zoom";
      tick();
    },
    undefined,
    function () {
      if (status) status.textContent = "Could not load the model";
    }
  );

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      cancelAnimationFrame(frame);
    } else if (mesh) {
      tick();
    }
  });
}

modelViewer();
