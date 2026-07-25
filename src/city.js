import * as THREE from 'three';
import { DISTRICTS, CITY_CONFIG } from './data.js';

/**
 * AI Future City - procedural generator with dual-mode (day/night) materials
 */

// All building materials for mode switching
let allBuildingMats = [];
let allNeonMats = [];

// ===== TEXTURE HELPERS =====

function genWindowTex(litRatio = 0.55) {
  const w = 64, h = 96;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  const cols = 5, rows = 10;
  const cw = w / cols, ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      if (Math.random() < litRatio) {
        const b = 0.3 + Math.random() * 0.7;
        const v = Math.floor(b * 180 + 75);
        ctx.fillStyle = `rgb(${v},${v},${Math.floor(v * 1.15 + 40)})`;
      } else {
        ctx.fillStyle = '#060612';
      }
      ctx.fillRect(col * cw + 1.5, r * ch + 1.5, cw - 3, ch - 3);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function genGroundTex() {
  const s = 1024;
  const c = document.createElement('canvas');
  c.width = s; c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#060618';
  ctx.fillRect(0, 0, s, s);
  // Grid
  ctx.strokeStyle = 'rgba(0,120,220,0.015)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= s; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
  }
  // Noise specks
  for (let i = 0; i < 5000; i++) {
    const a = Math.random() * 0.015;
    ctx.fillStyle = `rgba(0,${40 + Math.random() * 60},${80 + Math.random() * 80},${a})`;
    ctx.fillRect(Math.random() * s, Math.random() * s, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
}

// ===== BUILDING BUILDER =====

/**
 * Creates a building with materials tracked for mode switching
 */
function makeBuilding(x, z, w, h, d, nightColor, dayColor, nightEmit, dayEmit) {
  const group = new THREE.Group();

  // Body material
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(nightColor),
    metalness: 0.4, roughness: 0.5,
    envMapIntensity: 0.2,
  });
  allBuildingMats.push({ mat: bodyMat, night: nightColor, day: dayColor });

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Windows on front/back
  if (h > 4 && w > 2) {
    const wTex = genWindowTex(0.5 + Math.random() * 0.25);
    const wMat = new THREE.MeshPhysicalMaterial({
      map: wTex,
      emissive: new THREE.Color(nightEmit),
      emissiveIntensity: 0.4,
      emissiveMap: wTex,
      transparent: true, opacity: 0.6,
      metalness: 0.1, roughness: 0.3,
    });
    allBuildingMats.push({ mat: wMat, night: nightEmit, day: dayEmit, isEmissive: true, eIntNight: 0.4, eIntDay: 0.05 });

    const fg = new THREE.PlaneGeometry(w * 0.75, h * 0.75);
    for (const zSign of [-1, 1]) {
      const face = new THREE.Mesh(fg, wMat.clone());
      face.position.set(0, h / 2, zSign * (d / 2 + 0.02));
      if (zSign > 0) face.rotation.y = Math.PI;
      group.add(face);
    }

    // Side windows
    if (d > 2) {
      const sg = new THREE.PlaneGeometry(d * 0.75, h * 0.75);
      for (const xSign of [-1, 1]) {
        const sMat = wMat.clone();
        allBuildingMats.push({ mat: sMat, night: nightEmit, day: dayEmit, isEmissive: true, eIntNight: 0.4, eIntDay: 0.05 });
        const side = new THREE.Mesh(sg, sMat);
        side.position.set(xSign * (w / 2 + 0.02), h / 2, 0);
        side.rotation.y = xSign * Math.PI / 2;
        group.add(side);
      }
    }
  }

  // Neon top strip
  const nMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(nightEmit),
    emissive: new THREE.Color(nightEmit),
    emissiveIntensity: 0.6,
    metalness: 0.7, roughness: 0.2,
  });
  allBuildingMats.push({ mat: nMat, night: nightEmit, day: dayEmit, isEmissive: true, eIntNight: 0.6, eIntDay: 0.05 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.1, d * 0.85), nMat);
  strip.position.y = h + 0.05;
  group.add(strip);

  group.position.set(x, 0, z);
  group.userData = { h, w, d };
  return group;
}

/**
 * Creates a tower with tracked materials
 */
function makeTower(x, z, h, nightColor, dayColor, nightEmit, dayEmit) {
  const group = new THREE.Group();
  const w = 3.5 + Math.random() * 5;
  const d = 3.5 + Math.random() * 5;

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(nightColor),
    metalness: 0.6, roughness: 0.3,
    envMapIntensity: 0.3,
  });
  allBuildingMats.push({ mat: bodyMat, night: nightColor, day: dayColor });

  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
  body.position.y = h / 2;
  body.castShadow = true;
  group.add(body);

  // Vertical emissive stripes
  for (let i = 0; i < 3; i++) {
    const sMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(nightEmit),
      emissive: new THREE.Color(nightEmit),
      emissiveIntensity: 0.15,
      metalness: 0.3, roughness: 0.4,
    });
    allBuildingMats.push({ mat: sMat, night: nightEmit, day: dayEmit, isEmissive: true, eIntNight: 0.15, eIntDay: 0.02 });
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, h * 0.5, d * 0.5), sMat);
    s.position.set((i / 2 - 0.5) * w * 0.5, h / 2, 0);
    group.add(s);
  }

  // Corner glow strips
  const eMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(nightEmit),
    transparent: true, opacity: 0.12,
  });
  for (let c = 0; c < 4; c++) {
    const a = c / 4 * Math.PI * 2 + Math.PI / 4;
    const sMat2 = eMat.clone();
    allNeonMats.push({ mat: sMat2, nightColor: nightEmit, dayColor: dayEmit, nightOp: 0.12, dayOp: 0.02 });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.06), sMat2);
    strip.position.set(Math.cos(a) * w * 0.35, h / 2, Math.sin(a) * d * 0.35);
    group.add(strip);
  }

  // Spire for tall towers
  if (h > 30) {
    const spMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(nightEmit),
      emissive: new THREE.Color(nightEmit),
      emissiveIntensity: 0.3,
      metalness: 0.9, roughness: 0.1,
    });
    allBuildingMats.push({ mat: spMat, night: nightEmit, day: dayEmit, isEmissive: true, eIntNight: 0.3, eIntDay: 0.02 });
    const spH = 2 + Math.random() * 6;
    const spire = new THREE.Mesh(new THREE.ConeGeometry(w * 0.2, spH, 6), spMat);
    spire.position.y = h + spH / 2;
    group.add(spire);
  }

  group.position.set(x, 0, z);
  group.userData = { h, w, d };
  return group;
}

// ===== INFRASTRUCTURE =====

function makeRoad(x, z, w, d, color) {
  const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), metalness: 0.8, roughness: 0.4 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, 0.05, z);
  mesh.receiveShadow = true;
  return mesh;
}

function makeHighway(x, z, len, horiz) {
  const g = new THREE.Group();
  const hw = CITY_CONFIG.highwayWidth;
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#1a2a3a'), metalness: 0.9, roughness: 0.3 });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(horiz ? len : hw, horiz ? hw : len), mat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.08, z);
  road.receiveShadow = true;
  g.add(road);

  // Edge glow
  const eMat = new THREE.MeshBasicMaterial({ color: 0x0066cc, transparent: true, opacity: 0.04 });
  if (horiz) {
    for (const zs of [-hw / 2 - 0.1, hw / 2 + 0.1]) {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.15), eMat);
      e.rotation.x = -Math.PI / 2; e.position.set(x, 0.1, z + zs);
      g.add(e);
    }
  } else {
    for (const xs of [-hw / 2 - 0.1, hw / 2 + 0.1]) {
      const e = new THREE.Mesh(new THREE.PlaneGeometry(0.15, len), eMat);
      e.rotation.x = -Math.PI / 2; e.position.set(x + xs, 0.1, z);
      g.add(e);
    }
  }
  return g;
}

function makePark(x, z, size) {
  const g = new THREE.Group();
  const gm = new THREE.MeshPhysicalMaterial({ color: 0x0a2a1a, roughness: 0.9, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(size, size), gm);
  ground.rotation.x = -Math.PI / 2; ground.position.set(x, 0.01, z);
  g.add(ground);
  for (let i = 0; i < 6 + Math.floor(Math.random() * 6); i++) {
    const tx = x + (Math.random() - 0.5) * size * 0.6;
    const tz = z + (Math.random() - 0.5) * size * 0.6;
    const th = 2 + Math.random() * 3;
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, th, 6),
      new THREE.MeshPhysicalMaterial({ color: 0x332211, roughness: 0.9 }));
    tr.position.set(tx, th / 2, tz);
    g.add(tr);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(0.8 + Math.random() * 1.2, 6, 6),
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color().setHSL(0.3 + Math.random() * 0.1, 0.5, 0.1 + Math.random() * 0.08),
        roughness: 0.9,
      }));
    crown.position.set(tx, th + 0.8, tz);
    g.add(crown);
  }
  return g;
}

// ===== LANDMARKS =====

function makeHoloSphere(x, y, z, r, color) {
  const g = new THREE.Group();
  const out = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 24),
    new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), emissive: new THREE.Color(color), emissiveIntensity: 0.12, transparent: true, opacity: 0.08, metalness: 0, roughness: 0.1 }));
  g.add(out);
  const wire = new THREE.Mesh(new THREE.SphereGeometry(r * 1.01, 16, 16),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(color), wireframe: true, transparent: true, opacity: 0.08 }));
  g.add(wire);
  g.position.set(x, y, z);
  g.userData = { isLandmark: true, baseY: y };
  return g;
}

function makeDataTower(x, z, h, color) {
  const g = new THREE.Group();
  const segs = 6; const sH = h / segs;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const w = 4.5 * (1 - t * 0.35);
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, sH, w),
      new THREE.MeshPhysicalMaterial({ color: new THREE.Color(color), emissive: new THREE.Color(color), emissiveIntensity: 0.08 + t * 0.15, metalness: 0.7, roughness: 0.3 }));
    seg.position.set(0, i * sH + sH / 2, 0);
    g.add(seg);
  }
  g.position.set(x, 0, z);
  return g;
}

function makeLaunchPad(x, z) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(12, 14, 2, 24),
    new THREE.MeshPhysicalMaterial({ color: 0x556666, metalness: 0.7, roughness: 0.3 }));
  base.position.y = 1; base.castShadow = true;
  g.add(base);
  const glow = new THREE.Mesh(new THREE.RingGeometry(10, 12, 24),
    new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.06 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.2;
  g.add(glow);
  g.position.set(x, 0, z);
  return g;
}

// ===== MAIN GENERATOR =====

export function generateCity(scene) {
  const root = new THREE.Group();
  const { totalWidth: TW, totalDepth: TD } = CITY_CONFIG;

  // Ground
  const gTex = genGroundTex();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(TW * 2, TD * 2),
    new THREE.MeshPhysicalMaterial({ map: gTex, metalness: 0.5, roughness: 0.8, envMapIntensity: 0.05 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.1, 0);
  ground.receiveShadow = true;
  root.add(ground);

  // Highways
  [-TD * 0.35, TD * 0.35].forEach(z => root.add(makeHighway(0, z, TW, true)));
  [-TW * 0.4, TW * 0.4].forEach(x => root.add(makeHighway(x, 0, TD, false)));

  // Water
  [-TD * 0.25, TD * 0.25].forEach(z => {
    const wMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(TW * 0.5, 5),
      new THREE.MeshPhysicalMaterial({ color: 0x001a33, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.5 })
    );
    wMesh.rotation.x = -Math.PI / 2;
    wMesh.position.set(0, -0.05, z);
    root.add(wMesh);
  });

  // Parks
  [[-TW * 0.25, -TD * 0.3], [TW * 0.3, TD * 0.3], [-TW * 0.1, TD * 0.25]]
    .forEach(([x, z]) => root.add(makePark(x, z, 18 + Math.random() * 10)));

  // === DISTRICTS ===
  DISTRICTS.forEach((d) => {
    const { pos, size, buildingColorNight, buildingColorDay, buildingEmissiveNight, buildingEmissiveDay, heightRange, density, roadColor } = d;
    const dg = new THREE.Group();

    // District surface
    const dsMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(buildingColorNight).multiplyScalar(0.4),
      roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.12,
    });
    const ds = new THREE.Mesh(new THREE.PlaneGeometry(size.x, size.z), dsMat);
    ds.rotation.x = -Math.PI / 2;
    ds.position.set(pos.x, 0.02, pos.z);
    ds.receiveShadow = true;
    dg.add(ds);

    // Internal roads
    for (let i = 0; i < 3; i++) {
      const rz = (i / 4 - 0.5) * size.z * 0.7;
      dg.add(makeRoad(pos.x, pos.z + rz, size.x * 0.65, CITY_CONFIG.roadWidth, roadColor));
    }

    // === BUILDINGS ===
    const bCount = Math.floor(size.x * size.z * density * 0.01);
    const cols = Math.ceil(Math.sqrt(bCount * (size.x / size.z)));
    const rows = Math.ceil(bCount / cols);
    const sx = size.x * 0.7 / cols;
    const sz = size.z * 0.7 / rows;
    const ox = pos.x - size.x * 0.35;
    const oz = pos.z - size.z * 0.35;
    let built = 0;

    for (let ix = 0; ix < cols && built < bCount; ix++) {
      for (let iz = 0; iz < rows && built < bCount; iz++) {
        if (Math.random() < 0.08) continue;
        const bx = ox + ix * sx + (Math.random() - 0.5) * 1.0;
        const bz = oz + iz * sz + (Math.random() - 0.5) * 1.0;
        const hr = heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]);
        let mesh;
        if (hr > 30 || (Math.random() > 0.6 && hr > 15)) {
          mesh = makeTower(bx, bz, hr, buildingColorNight, buildingColorDay, buildingEmissiveNight, buildingEmissiveDay);
        } else {
          const bw = 2.5 + Math.random() * 3.5;
          const bd = 2.5 + Math.random() * 3.5;
          mesh = makeBuilding(bx, bz, bw, hr, bd, buildingColorNight, buildingColorDay, buildingEmissiveNight, buildingEmissiveDay);
        }
        dg.add(mesh);
        built++;
      }
    }

    // Fillers
    const fc = Math.floor(bCount * 0.25);
    for (let f = 0; f < fc; f++) {
      const fx = pos.x + (Math.random() - 0.5) * size.x * 0.6;
      const fz = pos.z + (Math.random() - 0.5) * size.z * 0.6;
      const fh = 2 + Math.random() * 5;
      const fw = 1.5 + Math.random() * 2;
      const fd = 1.5 + Math.random() * 2;
      dg.add(makeBuilding(fx, fz, fw, fh, fd, buildingColorNight, buildingColorDay, buildingEmissiveNight, buildingEmissiveDay));
    }

    // Perimeter
    for (let p = 0; p < 24; p++) {
      const t = p / 24;
      const a = t * Math.PI * 2;
      const px = pos.x + Math.cos(a) * size.x * 0.48;
      const pz = pos.z + Math.sin(a) * size.z * 0.48;
      const ph = 1.5 + Math.random() * 3;
      dg.add(makeBuilding(px, pz, 1.5, ph, 1.5, buildingColorNight, buildingColorDay, buildingEmissiveNight, buildingEmissiveDay));
    }

    // === LANDMARKS ===
    if (d.id === 'ai-assistant') dg.add(makeHoloSphere(pos.x + 20, 35, pos.z - 20, 12, d.colorNight));
    else if (d.id === 'image-gen') {
      const cMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(d.colorNight), emissive: new THREE.Color(d.colorNight),
        emissiveIntensity: 0.3, transparent: true, opacity: 0.1, metalness: 0, roughness: 0.1,
      });
      const cube = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 10), cMat);
      cube.position.set(pos.x, 28, pos.z - 15);
      cube.userData = { isLandmark: true, rotateSpeed: 0.004 };
      dg.add(cube);
    } else if (d.id === 'coding-hq') {
      dg.add(makeDataTower(pos.x + 25, pos.z - 20, 55, d.colorNight));
    } else if (d.id === 'data-analytics') {
      const gg = new THREE.Group();
      for (let i = 0; i < 14; i++) {
        const bh = 2 + Math.random() * 16;
        const bMat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(d.colorNight), emissive: new THREE.Color(d.colorNight),
          emissiveIntensity: 0.12 + (bh / 20) * 0.2, metalness: 0.3, roughness: 0.4,
        });
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.0, bh, 1.0), bMat);
        bar.position.set((i - 6.5) * 2.0, bh / 2, 0);
        gg.add(bar);
      }
      gg.position.set(pos.x, 0, pos.z - 20);
      dg.add(gg);
    } else if (d.id === 'space-terminal') {
      dg.add(makeLaunchPad(pos.x + 25, pos.z - 25));
    }

    root.add(dg);
  });

  // City boundary ring
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(TW * 0.45, TW * 0.47, 48),
    new THREE.MeshBasicMaterial({ color: 0x0044aa, transparent: true, opacity: 0.02, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, 0.01, 0);
  root.add(ring);

  scene.add(root);
  return { group: root, buildingMats: allBuildingMats };
}

export function setBuildingsMode(mode) {
  const isDay = mode === 'day';
  for (const entry of allBuildingMats) {
    if (entry.isEmissive) {
      entry.mat.emissiveIntensity = isDay ? entry.eIntDay : entry.eIntNight;
      entry.mat.emissive.setHex(parseInt((isDay ? entry.day : entry.night).replace('#',''), 16));
      entry.mat.color.setHex(parseInt((isDay ? entry.day : entry.night).replace('#',''), 16));
    } else {
      entry.mat.color.setHex(parseInt((isDay ? entry.day : entry.night).replace('#',''), 16));
    }
    entry.mat.needsUpdate = true;
  }
  for (const entry of allNeonMats) {
    entry.mat.opacity = isDay ? entry.dayOp : entry.nightOp;
    entry.mat.color.setHex(parseInt((isDay ? entry.dayColor : entry.nightColor).replace('#',''), 16));
    entry.mat.needsUpdate = true;
  }
}
