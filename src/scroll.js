/**
 * Scroll-driven camera controller using GSAP ScrollTrigger
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import { CAMERA_CONFIG, DISTRICTS } from './data.js';

gsap.registerPlugin(ScrollTrigger);

let progress = 0;
let smoothProgress = 0;
let currentDistrictIndex = -1;
let onDistrictChange = null;
let initialized = false;

// Camera state
const lookTarget = new THREE.Vector3();
const currentPos = new THREE.Vector3();
const targetPos = new THREE.Vector3();

export function initScrollController(camera, curve) {
  const trigger = document.getElementById('scroll-trigger');
  if (!trigger) return;

  // Set scroll height
  const totalLength = curve.getLength();
  const scrollHeight = Math.max(10000, totalLength * 4);
  document.body.style.height = `${scrollHeight}px`;

  // Set the trigger element to span the full scroll height
  trigger.style.height = `${scrollHeight}px`;

  ScrollTrigger.create({
    trigger: trigger,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.02,
    onUpdate: (self) => {
      progress = self.progress;
      if (!initialized) initialized = true;
    },
  });

  // Initialize camera at path start
  const startPos = curve.getPoint(0);
  camera.position.copy(startPos);
  currentPos.copy(startPos);

  const startLookAhead = curve.getPoint(0.01);
  camera.lookAt(startLookAhead);

  ScrollTrigger.refresh();
}

/**
 * Update camera position based on scroll progress
 */
export function updateCameraFromScroll(camera, curve) {
  // Smooth progress with easing
  const factor = CAMERA_CONFIG.smoothFactor;
  smoothProgress += (progress - smoothProgress) * Math.min(1, factor * 2);

  // Clamp with small headroom
  const p = Math.max(0.001, Math.min(0.999, smoothProgress));

  // Get target position from curve
  curve.getPoint(p, targetPos);
  curve.getPoint(Math.min(1, p + CAMERA_CONFIG.lookAhead), lookTarget);

  // Direct camera movement (no lerp lag)
  camera.position.copy(targetPos);

  // Look ahead on the path
  camera.lookAt(lookTarget);

  // Smooth camera up vector
  const tangent = curve.getTangent(p);
  const defaultUp = new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(tangent, defaultUp).normalize();
  if (right.length() > 0.001) {
    const up = new THREE.Vector3().crossVectors(right, tangent).normalize();
    camera.up.lerp(up, 0.03);
  }

  // Determine nearest district
  const closest = findClosestDistrict(targetPos);
  const newIndex = closest !== null ? DISTRICTS.indexOf(closest) : -1;
  if (newIndex !== currentDistrictIndex && newIndex >= 0) {
    currentDistrictIndex = newIndex;
    if (onDistrictChange) onDistrictChange(currentDistrictIndex);
  }

  return {
    progress: p,
    position: targetPos.clone(),
    districtIndex: currentDistrictIndex,
  };
}

function findClosestDistrict(cameraPos) {
  let minDist = 120; // max distance to consider
  let closest = null;
  DISTRICTS.forEach(d => {
    const dx = cameraPos.x - d.pos.x;
    const dz = cameraPos.z - d.pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < minDist) {
      minDist = dist;
      closest = d;
    }
  });
  return closest;
}

export function getCurrentIndex() {
  return currentDistrictIndex;
}

export function onDistrictChangeCallback(cb) {
  onDistrictChange = cb;
}

export function getProgress() {
  return progress;
}

export function getSmoothProgress() {
  return smoothProgress;
}

export function isInitialized() {
  return initialized;
}
