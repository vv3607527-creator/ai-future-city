import * as THREE from 'three';
import { DISTRICTS } from './data.js';

/**
 * World animations: vehicles, drones, moving lights, rotating landmarks
 */

const animatedObjects = [];

// Flying vehicles (drones / hover cars)
export function createVehicles(scene, count = 15) {
  const vehicles = [];
  for (let i = 0; i < count; i++) {
    const type = Math.random() > 0.5 ? 'drone' : 'hovercar';
    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.5);
    const emissiveColor = color.clone().multiplyScalar(0.5);

    let group = new THREE.Group();

    if (type === 'drone') {
      // Simple drone: cross frame + center body
      const bodyMat = new THREE.MeshPhysicalMaterial({
        color: 0x222233,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x004488,
        emissiveIntensity: 0.2,
      });
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), bodyMat);
      group.add(body);

      // Arms
      const armMat = new THREE.MeshPhysicalMaterial({ color: 0x444466, metalness: 0.9, roughness: 0.2 });
      for (let a = 0; a < 4; a++) {
        const angle = (a / 4) * Math.PI * 2;
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), armMat);
        arm.position.set(Math.cos(angle) * 0.8, 0, Math.sin(angle) * 0.8);
        arm.rotation.y = -angle;
        group.add(arm);

        // Rotor
        const rotorMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.4,
        });
        const rotor = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.7, 12), rotorMat);
        rotor.position.set(Math.cos(angle) * 1.3, 0.2, Math.sin(angle) * 1.3);
        rotor.rotation.x = Math.PI / 2;
        group.add(rotor);
      }
    } else {
      // Hover car: simple rounded shape
      const carMat = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.7,
        roughness: 0.3,
        emissive: emissiveColor,
        emissiveIntensity: 0.1,
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 1.2), carMat);
      body.position.y = 0.3;
      group.add(body);

      // Glow underneath
      const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
      });
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1), glowMat);
      glow.rotation.x = Math.PI / 2;
      glow.position.y = -0.1;
      group.add(glow);
    }

    // Random position along the city
    const side = Math.random() > 0.5 ? -1 : 1;
    const x = (Math.random() - 0.5) * 1000;
    const z = (Math.random() - 0.5) * 400 + side * 100;
    const y = 8 + Math.random() * 50;

    group.position.set(x, y, z);
    group.userData = {
      speed: 0.3 + Math.random() * 0.8,
      radius: 20 + Math.random() * 60,
      centerX: x,
      centerZ: z,
      centerY: y,
      phase: Math.random() * Math.PI * 2,
      type,
      wobble: 0.5 + Math.random() * 0.5,
    };

    scene.add(group);
    vehicles.push(group);
    animatedObjects.push(group);
  }
  return vehicles;
}

// Moving light trails on highways
export function createLightTrails(scene, count = 8) {
  const trails = [];
  for (let i = 0; i < count; i++) {
    const points = [];
    const trailLength = 50;
    const x = (Math.random() - 0.5) * 800;
    const z = (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 50);
    const color = new THREE.Color().setHSL(0.55 + Math.random() * 0.2, 0.8, 0.5);

    for (let j = 0; j < trailLength; j++) {
      points.push(new THREE.Vector3(
        x + j * 0.5,
        1,
        z + Math.sin(j * 0.1) * 2
      ));
    }

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3,
    });
    const trail = new THREE.Line(geo, mat);
    trail.userData = {
      speed: 0.5 + Math.random(),
      offset: Math.random() * 100,
      direction: Math.random() > 0.5 ? 1 : -1,
    };
    scene.add(trail);
    trails.push(trail);
  }
  return trails;
}

// Pulsing billboard / sign lights
export function createBillboards(scene, count = 30) {
  const billboards = [];
  for (let i = 0; i < count; i++) {
    const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6);
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.1 + Math.random() * 0.2,
    });
    const w = 4 + Math.random() * 10;
    const h = 2 + Math.random() * 4;
    const billboard = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    billboard.position.set(
      (Math.random() - 0.5) * 900,
      15 + Math.random() * 30,
      (Math.random() - 0.5) * 400
    );
    billboard.rotation.y = Math.random() * Math.PI * 2;

    // Add a border glow
    const borderMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
    });
    const border = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.5, h + 0.5), borderMat);
    border.position.z = -0.1;
    billboard.add(border);

    billboard.userData = {
      baseOpacity: mat.opacity,
      color: color,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
      pulseAmount: 0.1 + Math.random() * 0.2,
    };
    scene.add(billboard);
    billboards.push(billboard);
    animatedObjects.push(billboard);
  }
  return billboards;
}

// Satellite in orbit
export function createSatellite(scene) {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.2,
    emissive: 0x00aaff,
    emissiveIntensity: 0.1,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.8), bodyMat);
  group.add(body);

  // Solar panels
  const panelMat = new THREE.MeshPhysicalMaterial({
    color: 0x222244,
    metalness: 0.5,
    roughness: 0.3,
    emissive: 0x0044aa,
    emissiveIntensity: 0.05,
  });
  const panel1 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1), panelMat);
  panel1.position.x = -1.5;
  group.add(panel1);
  const panel2 = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.05, 1), panelMat);
  panel2.position.x = 1.5;
  group.add(panel2);

  group.position.set(200, 200, 0);
  group.userData = {
    isSatellite: true,
    orbitRadius: 350,
    orbitSpeed: 0.0008,
    phase: 0,
    tilt: 0.3,
  };
  scene.add(group);
  animatedObjects.push(group);
  return group;
}

// Maglev train
export function createTrain(scene) {
  const group = new THREE.Group();
  const carMat = new THREE.MeshPhysicalMaterial({
    color: 0x4488cc,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x0066ff,
    emissiveIntensity: 0.1,
  });
  const windowMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    emissive: 0x4488ff,
    emissiveIntensity: 0.2,
    transparent: true,
    opacity: 0.7,
  });

  for (let i = -2; i <= 2; i++) {
    const car = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1.5), carMat);
    car.position.set(i * 3.5, 0.6, 0);
    group.add(car);
    const window = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.2), windowMat);
    window.position.set(i * 3.5, 0.8, 0.8);
    group.add(window);
  }

  // Glow strip
  const stripMat = new THREE.MeshBasicMaterial({
    color: 0x00ddff,
    transparent: true,
    opacity: 0.3,
  });
  for (let i = -2; i <= 2; i++) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.15), stripMat);
    strip.position.set(i * 3.5, 0, 0.8);
    strip.rotation.x = -Math.PI / 2;
    group.add(strip);
  }

  group.position.set(-400, 2, 120);
  group.userData = {
    isTrain: true,
    speed: 1.5,
    range: 800,
    startX: -400,
  };
  scene.add(group);
  animatedObjects.push(group);
  return group;
}

// Rotating wind turbines
export function createTurbines(scene, count = 6) {
  const turbines = [];
  for (let i = 0; i < count; i++) {
    const group = new THREE.Group();
    const towerMat = new THREE.MeshPhysicalMaterial({
      color: 0x444466,
      metalness: 0.7,
      roughness: 0.3,
    });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 15, 6), towerMat);
    tower.position.y = 7.5;
    group.add(tower);

    const bladeMat = new THREE.MeshPhysicalMaterial({
      color: 0x666688,
      metalness: 0.5,
      roughness: 0.4,
    });
    const blades = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const angle = (b / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 0.5), bladeMat);
      blade.position.set(Math.sin(angle) * 2, 0, Math.cos(angle) * 2);
      blade.rotation.y = -angle;
      blades.add(blade);
    }
    blades.position.y = 15;
    group.add(blades);

    group.position.set(
      (Math.random() - 0.5) * 600,
      0,
      -180 + Math.random() * -30
    );
    group.userData = { blades, rotateSpeed: 0.02 + Math.random() * 0.02 };
    scene.add(group);
    turbines.push(group);
    animatedObjects.push(group);
  }
  return turbines;
}

// Main animation update
export function updateAnimations(time, camera) {
  const t = time * 0.001;

  // Update vehicles
  animatedObjects.forEach(obj => {
    if (obj.userData.isSatellite) {
      const { orbitRadius, orbitSpeed, phase, tilt } = obj.userData;
      const angle = t * orbitSpeed + phase;
      obj.position.x = Math.cos(angle) * orbitRadius;
      obj.position.z = Math.sin(angle) * orbitRadius * 0.6;
      obj.position.y = 150 + Math.sin(angle * 0.7) * 50;
      obj.rotation.y = -angle;
      obj.rotation.x = tilt;
    } else if (obj.userData.isTrain) {
      const { speed, range, startX } = obj.userData;
      obj.position.x = ((t * speed + startX) % (range * 2)) - range;
      obj.position.z = 120 + Math.sin(obj.position.x * 0.01) * 5;
    } else if (obj.userData.blades) {
      obj.userData.blades.rotation.z += obj.userData.rotateSpeed;
    } else if (obj.userData.radius) {
      // Drones/hovercars
      const { speed, radius, centerX, centerZ, centerY, phase, wobble } = obj.userData;
      const angle = t * speed * 0.1 + phase;
      obj.position.x = centerX + Math.cos(angle) * radius * 0.3;
      obj.position.z = centerZ + Math.sin(angle * 0.7) * radius * 0.2;
      obj.position.y = centerY + Math.sin(t * speed + phase) * wobble;
      obj.rotation.y = angle;
      obj.rotation.x = Math.sin(t * speed + phase) * 0.05;
    } else if (obj.userData.pulseAmount) {
      // Billboards
      const { baseOpacity, phase, speed, pulseAmount } = obj.userData;
      const pulse = Math.sin(t * speed + phase) * pulseAmount;
      obj.material.opacity = Math.max(0.01, baseOpacity + pulse);
    }
  });
}
