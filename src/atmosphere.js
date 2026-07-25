import * as THREE from 'three';

/**
 * Atmosphere: gradient sky, stars, particles, lighting + mode switching
 * Day mode: bright, warm, clear visibility
 * Night mode: dark, cool, atmospheric neon
 */

let particleSystem = null;
let origPositions = null;
let ambientLight, hemiLight, mainLight, fillLight;
let accentLights = [];
let fogRef = null;
let sceneRef = null;
let bgDayTexture, bgNightTexture;
let currentMode = 'night';

// === GRADIENT SKY ===

function makeGradientTexture(stops) {
  const c = document.createElement('canvas');
  c.width = 1; c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  for (const [pos, color] of stops) {
    g.addColorStop(pos, color);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1, 256);
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.LinearFilter;
  return t;
}

export function createSky(scene) {
  sceneRef = scene;

  bgNightTexture = makeGradientTexture([
    [0, '#000005'],
    [0.4, '#000510'],
    [0.7, '#000a18'],
    [1, '#001022'],
  ]);

  bgDayTexture = makeGradientTexture([
    [0, '#003366'],
    [0.3, '#115599'],
    [0.6, '#3388bb'],
    [0.85, '#66aadd'],
    [1, '#88bbdd'],
  ]);

  scene.background = bgNightTexture;
  return { night: bgNightTexture, day: bgDayTexture };
}

// === PARTICLES ===

export function createParticles(scene, count = 1200) {
  const pos = new Float32Array(count * 3);
  const orig = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const spread = 900, hSpread = 100;
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread;
    const y = Math.random() * hSpread;
    const z = (Math.random() - 0.5) * spread * 0.5;
    pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z;
    orig[i*3]=x; orig[i*3+1]=y; orig[i*3+2]=z;
    const hue = 0.55 + Math.random() * 0.15;
    const c = new THREE.Color().setHSL(hue, 0.5, 0.2 + Math.random() * 0.2);
    colors[i*3]=c.r; colors[i*3+1]=c.g; colors[i*3+2]=c.b;
    sizes[i] = 0.3 + Math.random() * 1.0;
  }
  origPositions = orig;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({
    size: 1.5, vertexColors: true, transparent: true, opacity: 0.12,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  particleSystem = new THREE.Points(geo, mat);
  scene.add(particleSystem);
  return particleSystem;
}

export function updateParticles(time) {
  if (!particleSystem || !origPositions) return;
  const p = particleSystem.geometry.attributes.position.array;
  const t = time * 0.001;
  for (let i = 0; i < p.length / 3; i++) {
    const i3 = i * 3;
    p[i3] = origPositions[i3] + Math.sin(t * 0.3 + i) * 1.5;
    p[i3 + 1] = origPositions[i3 + 1] + Math.sin(t * 0.5 + i * 0.7) * 1.0;
    p[i3 + 2] = origPositions[i3 + 2] + Math.cos(t * 0.4 + i * 0.3) * 1.5;
  }
  particleSystem.geometry.attributes.position.needsUpdate = true;
}

// === FOG ===

export function setupFog(scene) {
  scene.fog = new THREE.FogExp2(0x00000a, 0.0003);
  fogRef = scene.fog;
  return scene.fog;
}

// === LIGHTING ===

export function setupLighting(scene) {
  // Ambient light — fills shadows
  ambientLight = new THREE.AmbientLight(0x2244aa, 0.4);
  scene.add(ambientLight);

  // Hemisphere — sky/ground color gradient
  hemiLight = new THREE.HemisphereLight(0x4488ff, 0x000822, 0.5);
  scene.add(hemiLight);

  // Main directional — simulates sun/moon
  mainLight = new THREE.DirectionalLight(0x6688ff, 0.8);
  mainLight.position.set(200, 300, -100);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(1024, 1024);
  mainLight.shadow.camera.left = -500;
  mainLight.shadow.camera.right = 500;
  mainLight.shadow.camera.top = 500;
  mainLight.shadow.camera.bottom = -500;
  mainLight.shadow.camera.near = 1;
  mainLight.shadow.camera.far = 1000;
  scene.add(mainLight);

  // Fill — bounces city glow upward
  fillLight = new THREE.DirectionalLight(0x0044ff, 0.2);
  fillLight.position.set(0, -50, 0);
  scene.add(fillLight);

  // District accent lights
  const data = [
    { x: -500, z: 0, c: 0x00d4ff },
    { x: -350, z: 0, c: 0xff6b9d },
    { x: -180, z: 0, c: 0xffd700 },
    { x: 0, z: 0, c: 0x00ff88 },
    { x: 170, z: 0, c: 0xa855f7 },
    { x: 340, z: 0, c: 0xf59e0b },
    { x: 500, z: 0, c: 0xff4444 },
  ];
  data.forEach(p => {
    const l = new THREE.PointLight(p.c, 0.35, 120);
    l.position.set(p.x, 25, p.z);
    scene.add(l);
    accentLights.push(l);
  });

  return { setMode, ambientLight, hemiLight, mainLight, fillLight };
}

// === HORIZON GLOW ===

export function createHorizonGlow(scene) {
  const g = new THREE.Group();
  const ring = (inner, outer, color, opacity) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 48),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = -1;
    return m;
  };
  g.add(ring(400, 650, 0x0044aa, 0.05));
  g.add(ring(300, 450, 0x2288cc, 0.03));
  scene.add(g);
  return g;
}

// === STARS ===

export function createStars(scene) {
  const count = 2000;
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.6 + 0.2);
    const r = 800 + Math.random() * 800;
    pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.cos(phi) + 30;
    pos[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    const b = 0.3 + Math.random() * 0.7;
    const tint = Math.random();
    if (tint < 0.1) {
      colors[i*3]=b; colors[i*3+1]=b*0.7; colors[i*3+2]=b*0.4;
    } else if (tint < 0.2) {
      colors[i*3]=b*0.5; colors[i*3+1]=b*0.6; colors[i*3+2]=b;
    } else {
      colors[i*3]=b; colors[i*3+1]=b; colors[i*3+2]=b;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    vertexColors: true, size: 0.6, transparent: true, opacity: 0.5,
    sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);
  return stars;
}

// === MODE SWITCHING ===

function setMode(mode) {
  currentMode = mode;
  if (!sceneRef) return mode;

  const isDay = mode === 'day';

  // Background — instant swap
  sceneRef.background = isDay ? bgDayTexture : bgNightTexture;

  // Fog — day=blue haze, night=dark void
  if (fogRef) {
    fogRef.color.setHex(isDay ? 0x1a3a5a : 0x000008);
    fogRef.density = isDay ? 0.00015 : 0.00035;
  }

  // Ambient — day=warm bright, night=cool dim
  ambientLight.intensity = isDay ? 1.6 : 0.35;
  ambientLight.color.setHex(isDay ? 0x88ccff : 0x1a3366);

  // Hemisphere
  hemiLight.intensity = isDay ? 0.9 : 0.4;
  hemiLight.color.setHex(isDay ? 0xaaccff : 0x3366aa);
  hemiLight.groundColor.setHex(isDay ? 0x445544 : 0x000822);

  // Main directional (sun)
  mainLight.intensity = isDay ? 3.0 : 0.6;
  mainLight.color.setHex(isDay ? 0xffeedd : 0x4466aa);

  // Fill (bounce light)
  fillLight.intensity = isDay ? 0.6 : 0.12;
  fillLight.color.setHex(isDay ? 0x8888ff : 0x0033aa);

  // Accent point lights — keep visible but dimmer in day
  accentLights.forEach(l => {
    l.intensity = isDay ? 0.08 : 0.35;
  });

  // Tone mapping exposure
  if (sceneRef.__renderer) {
    // renderer exposure handled externally
  }

  return mode;
}

export function getMode() {
  return currentMode;
}

export function toggleMode() {
  return setMode(currentMode === 'night' ? 'day' : 'night');
}
