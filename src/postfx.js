import * as THREE from 'three';

/**
 * Post-processing effects: Bloom, Tone Mapping
 */

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let composer = null;
let bloomPass = null;

export function setupPostProcessing(renderer, scene, camera) {
  composer = new EffectComposer(renderer);
  composer.setSize(window.innerWidth, window.innerHeight);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.3,   // strength
    0.2,   // radius
    0.1    // threshold
  );
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}

export function updatePostProcessingSize(width, height) {
  if (composer) {
    composer.setSize(width, height);
  }
}

export function setBloomIntensity(intensity) {
  if (bloomPass) {
    bloomPass.strength = intensity;
  }
}

export function getComposer() {
  return composer;
}
