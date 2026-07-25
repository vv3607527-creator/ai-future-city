import * as THREE from 'three';
import { DISTRICTS, CAMERA_CONFIG } from './data.js';

/**
 * Creates a cinematic camera path through the AI city.
 * Uses CatmullRomCurve3 for smooth interpolation.
 */
export function createCameraPath() {
  const points = [];
  const heightMin = CAMERA_CONFIG.pathHeightMin;
  const heightMax = CAMERA_CONFIG.pathHeightMax;

  // Build control points that weave through districts
  // Each district gets visited with specific camera angles

  // Approach from the northwest - wide establishing shot
  points.push(new THREE.Vector3(-700, heightMax * 0.9, 200));
  points.push(new THREE.Vector3(-650, heightMax * 0.7, 150));

  // District 0: Central Core
  points.push(new THREE.Vector3(-580, heightMax * 0.5, 50));
  points.push(new THREE.Vector3(-550, heightMax * 0.4, -20));
  points.push(new THREE.Vector3(-520, heightMax * 0.3, -50));

  // Transition to District 1: AI Assistant
  points.push(new THREE.Vector3(-480, heightMax * 0.35, -30));
  points.push(new THREE.Vector3(-450, heightMax * 0.3, 0));
  points.push(new THREE.Vector3(-440, heightMin * 1.8, 20)); // street level

  // Through AI Assistant district
  points.push(new THREE.Vector3(-420, heightMin * 1.5, 15));
  points.push(new THREE.Vector3(-400, heightMin * 2, 0));
  points.push(new THREE.Vector3(-380, heightMax * 0.25, -20));

  // Transition to District 2: Image Generation
  points.push(new THREE.Vector3(-350, heightMax * 0.3, -10));
  points.push(new THREE.Vector3(-330, heightMin * 2, 20));
  points.push(new THREE.Vector3(-310, heightMin * 1.5, 30));

  // District 2 fly-through
  points.push(new THREE.Vector3(-290, heightMin * 2, 10));
  points.push(new THREE.Vector3(-270, heightMax * 0.2, -15));

  // Transition to District 3: Video Creation
  points.push(new THREE.Vector3(-240, heightMax * 0.25, -30));
  points.push(new THREE.Vector3(-210, heightMin * 1.8, -10));
  points.push(new THREE.Vector3(-190, heightMin * 2, 15));

  // District 3 - video zone
  points.push(new THREE.Vector3(-170, heightMin * 1.5, 25));
  points.push(new THREE.Vector3(-150, heightMax * 0.15, 0));

  // Transition to District 4: Coding HQ (central)
  points.push(new THREE.Vector3(-100, heightMax * 0.3, -20));
  points.push(new THREE.Vector3(-50, heightMax * 0.4, -40));
  points.push(new THREE.Vector3(0, heightMax * 0.5, -30));

  // Around Coding HQ - orbit
  points.push(new THREE.Vector3(30, heightMax * 0.35, 0));
  points.push(new THREE.Vector3(50, heightMax * 0.25, 30));
  points.push(new THREE.Vector3(80, heightMin * 2, 40));
  points.push(new THREE.Vector3(110, heightMin * 1.8, 20));

  // Transition to District 5: Data Analytics
  points.push(new THREE.Vector3(140, heightMax * 0.2, 0));
  points.push(new THREE.Vector3(160, heightMin * 2.5, -20));
  points.push(new THREE.Vector3(180, heightMin * 2, -30));

  // Data Analytics district
  points.push(new THREE.Vector3(200, heightMax * 0.25, -15));
  points.push(new THREE.Vector3(220, heightMin * 2.5, 10));

  // Transition to District 6: Agent Marketplace
  points.push(new THREE.Vector3(260, heightMax * 0.3, 25));
  points.push(new THREE.Vector3(290, heightMin * 2.2, 30));
  points.push(new THREE.Vector3(320, heightMin * 1.8, 15));

  // Agent marketplace
  points.push(new THREE.Vector3(350, heightMin * 2, 0));
  points.push(new THREE.Vector3(370, heightMax * 0.2, -20));

  // Transition to District 7: Space Terminal
  points.push(new THREE.Vector3(410, heightMax * 0.35, -30));
  points.push(new THREE.Vector3(440, heightMax * 0.4, -20));
  points.push(new THREE.Vector3(470, heightMin * 2.5, 0));

  // Space Terminal - grand reveal
  points.push(new THREE.Vector3(500, heightMax * 0.3, 30));
  points.push(new THREE.Vector3(530, heightMin * 3, 50));
  points.push(new THREE.Vector3(560, heightMax * 0.5, 40));

  // Final pull-back
  points.push(new THREE.Vector3(620, heightMax * 0.6, 0));
  points.push(new THREE.Vector3(680, heightMax * 0.8, -50));
  points.push(new THREE.Vector3(750, heightMax * 0.95, -100));

  const curve = new THREE.CatmullRomCurve3(points);
  return curve;
}

/**
 * Preview the path with a line for debugging
 */
export function createPathPreview(curve, divisions = 200) {
  const points = curve.getPoints(divisions);
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.15 });
  return new THREE.Line(geo, mat);
}
