import * as THREE from 'three';
import { generateCity, setBuildingsMode } from './city.js';
import { createCameraPath } from './cameraPath.js';
import { initScrollController, updateCameraFromScroll, getCurrentIndex, getProgress, getSmoothProgress } from './scroll.js';
import {
  createSky, createParticles, updateParticles, setupFog, setupLighting, createStars, createHorizonGlow,
  toggleMode as toggleAtmoMode, getMode
} from './atmosphere.js';
import { createVehicles, createLightTrails, createBillboards, createSatellite, createTrain, createTurbines, updateAnimations } from './animations.js';
import { setupPostProcessing, updatePostProcessingSize, getComposer, setBloomIntensity } from './postfx.js';
import { initUI, updateProgress, checkAndUpdateDistrict, updateLoaderProgress, hideLoader, onModeToggle } from './ui.js';

// === SCENE SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000510);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(-700, 95, 200);
camera.lookAt(-680, 80, 180);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('world').appendChild(renderer.domElement);

// === ATMOSPHERE ===
createSky(scene);
setupFog(scene);
setupLighting(scene);
createStars(scene);
createHorizonGlow(scene);
const particles = createParticles(scene, 1200);

// === CITY GEN ===
let cameraCurve = null;
let loadingProgress = 0;

function updateLoading() {
  loadingProgress += 0.03 + Math.random() * 0.04;
  updateLoaderProgress(Math.min(1, loadingProgress));
  if (loadingProgress < 1) requestAnimationFrame(updateLoading);
}
updateLoading();

setTimeout(() => {
  const cityData = generateCity(scene);
  cameraCurve = createCameraPath();

  createVehicles(scene, 20);
  createLightTrails(scene, 12);
  createBillboards(scene, 40);
  createSatellite(scene);
  createTrain(scene);
  createTurbines(scene, 8);

  setupPostProcessing(renderer, scene, camera);
  initScrollController(camera, cameraCurve);
  initUI();

  setTimeout(() => {
    updateLoaderProgress(1);
    setTimeout(hideLoader, 400);
  }, 500);
}, 100);

// === DAY/NIGHT TOGGLE ===
window.__toggleMode = () => {
  const mode = toggleAtmoMode();
  setBuildingsMode(mode);
  const isNight = mode === 'night';
  bloomBase = isNight ? 0.35 : 0.08;
  setBloomIntensity(bloomBase);
  renderer.toneMappingExposure = isNight ? 0.7 : 1.6;

  // Update stars visibility
  const stars = scene.children.find(c => c.isPoints && c.material.size < 1);
  if (stars) stars.material.opacity = isNight ? 0.5 : 0.05;

  const toggle = document.getElementById('mode-toggle');
  if (toggle) {
    toggle.classList.toggle('day-mode', !isNight);
    const label = toggle.querySelector('.toggle-label');
    if (label) label.textContent = isNight ? 'Day' : 'Night';
  }
};
onModeToggle(window.__toggleMode);

// === RESIZE ===
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  updatePostProcessingSize(w, h);
});

// === RENDER LOOP ===
const clock = new THREE.Clock();
let bloomBase = 0.35; // set by toggle handler, used by animation loop

function animate() {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime() * 1000;

  // Gentle bloom wobble from scroll
  const sp = getSmoothProgress();
  setBloomIntensity(bloomBase + sp * 0.04);

  updateParticles(time);
  updateAnimations(time, camera);

  if (cameraCurve) {
    const camState = updateCameraFromScroll(camera, cameraCurve);
    updateProgress(getProgress());
    checkAndUpdateDistrict(getCurrentIndex());

    // Fog adapts to camera height
    const h = camera.position.y;
    const mode = getMode();
    scene.fog.density = mode === 'night'
      ? Math.min(0.0006, 0.00025 + Math.max(0, (h - 30) * 0.000002))
      : Math.min(0.0004, 0.00015 + Math.max(0, (h - 30) * 0.0000015));
  }

  const composer = getComposer();
  if (composer) composer.render();
  else renderer.render(scene, camera);
}

animate();
