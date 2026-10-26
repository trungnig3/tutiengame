import * as THREE from 'three';
import { XianxiaMaterials } from './materials';

export interface SlashEffect3D {
  mesh: THREE.Mesh;
  light?: THREE.PointLight;
  step: 1 | 2 | 3;
  progress: number;
  duration: number;
  alive: boolean;
}

export interface FlyingSword3D {
  group: THREE.Group;
  trailPoints: THREE.Vector3[];
  trailLine: THREE.Line;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  speed: number;
  progress: number;
  alive: boolean;
}

export interface LightningStrike3D {
  group: THREE.Group;
  light: THREE.PointLight;
  scorchMesh?: THREE.Mesh;
  timer: number;
  maxTimer: number;
  alive: boolean;
}

export interface SwordWave3D {
  mesh: THREE.Mesh;
  vx: number;
  vz: number;
  life: number;
  maxLife: number;
  alive: boolean;
}

export interface DamageNumber3D {
  sprite: THREE.Sprite;
  texture: THREE.CanvasTexture;
  vy: number;
  life: number;
  maxLife: number;
  alive: boolean;
}

export class CombatVFX3DManager {
  private scene: THREE.Scene;
  private activeSlashes: SlashEffect3D[] = [];
  private activeFlyingSwords: FlyingSword3D[] = [];
  private activeLightning: LightningStrike3D[] = [];
  private activeWaves: SwordWave3D[] = [];
  private activeDamageTexts: DamageNumber3D[] = [];
  private goldenShieldMesh: THREE.Mesh | null = null;
  private orbitingSwordsGroup: THREE.Group | null = null;
  private hitSparkParticles: THREE.Points | null = null;
  private hitSparkPositions: Float32Array = new Float32Array(350 * 3);
  private hitSparkVelocities: Float32Array = new Float32Array(350 * 3);
  private hitSparkLifes: Float32Array = new Float32Array(350);

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initParticleSystem();
    this.initGoldenShield();
    this.initOrbitingSwords();
  }

  // Golden Bell Shield (Hộ Thể Kim Chung Tráo)
  private initGoldenShield() {
    const geo = new THREE.SphereGeometry(1.35, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.72);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      roughness: 0.2,
      metalness: 0.6,
    });
    this.goldenShieldMesh = new THREE.Mesh(geo, mat);
    this.goldenShieldMesh.position.y = 0.75;
    this.goldenShieldMesh.visible = false;
    this.scene.add(this.goldenShieldMesh);
  }

  // 6 Orbiting Swords (Vạn Kiếm Quy Tông)
  private initOrbitingSwords() {
    this.orbitingSwordsGroup = new THREE.Group();
    const count = 6;
    for (let i = 0; i < count; i++) {
      const sword = new THREE.Group();
      // Mini double-edged blade
      const bladeGeo = new THREE.BoxGeometry(0.045, 0.75, 0.012);
      const bladeMat = XianxiaMaterials.createSteelBladeMaterial();
      const b = new THREE.Mesh(bladeGeo, bladeMat);
      b.position.y = 0.35;
      sword.add(b);

      const guardGeo = new THREE.BoxGeometry(0.16, 0.035, 0.035);
      const g = new THREE.Mesh(guardGeo, XianxiaMaterials.createGoldMaterial());
      sword.add(g);

      sword.rotation.x = Math.PI / 2;
      this.orbitingSwordsGroup.add(sword);
    }
    this.orbitingSwordsGroup.visible = false;
    this.scene.add(this.orbitingSwordsGroup);
  }

  // Hit Spark particle pool
  private initParticleSystem() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.hitSparkPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.14,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    this.hitSparkParticles = new THREE.Points(geo, mat);
    this.scene.add(this.hitSparkParticles);
  }

  /**
   * Spawn 3D dynamic crescent blade trail along slash trajectory
   */
  public triggerSwordArc(
    x: number,
    y: number,
    z: number,
    angle: number,
    step: 1 | 2 | 3
  ) {
    // Generate curved tapered ribbon geometry matching the sword arc
    const segments = 24;
    const innerRadius = step === 3 ? 1.5 : step === 2 ? 1.3 : 1.1;
    const outerRadius = step === 3 ? 2.5 : step === 2 ? 2.2 : 1.9;
    const arcAngle = step === 3 ? Math.PI * 0.95 : step === 2 ? Math.PI * 0.85 : Math.PI * 0.78;

    const ringGeo = new THREE.RingGeometry(innerRadius, outerRadius, segments, 1, -arcAngle / 2, arcAngle);

    // Color based on step
    const colorHex = step === 3 ? 0xf59e0b : step === 2 ? 0x10b981 : 0x38bdf8;
    const arcMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(ringGeo, arcMat);
    mesh.position.set(x, y + 0.85, z);

    // Rotate arc to match slash plane
    if (step === 1) {
      // Horizontal clean slash
      mesh.rotation.set(-Math.PI / 2, 0, -angle + Math.PI / 2);
    } else if (step === 2) {
      // Reverse upward diagonal slash (tilted 38 deg)
      mesh.rotation.set(-Math.PI / 2.5, 0.45, -angle + Math.PI / 2);
    } else {
      // Overhead heavy vertical cleave
      mesh.rotation.set(-Math.PI / 2, 0, -angle + Math.PI / 2);
      mesh.scale.set(1.3, 1.3, 1.3);
    }

    const light = new THREE.PointLight(colorHex, step === 3 ? 4.5 : 3.0, 6);
    light.position.set(x, y + 1.1, z);
    this.scene.add(light);
    this.scene.add(mesh);

    this.activeSlashes.push({
      mesh,
      light,
      step,
      progress: 0,
      duration: step === 3 ? 0.35 : 0.26,
      alive: true,
    });

    // Step 3 ground shockwave sparks
    if (step === 3) {
      this.spawnHitSparks(x + Math.cos(angle) * 1.5, 0.1, z + Math.sin(angle) * 1.5, 35, 0xf59e0b);
    }
  }

  /**
   * SKILL 1: Kiếm Khí Trảm (Travelling Crescent Sword Qi Wave in 3D)
   */
  public triggerSwordQiWave(x: number, y: number, z: number, angle: number) {
    const waveGeo = new THREE.RingGeometry(0.8, 1.35, 16, 1, -Math.PI * 0.45, Math.PI * 0.9);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(waveGeo, waveMat);
    mesh.position.set(x, y + 0.65, z);
    mesh.rotation.set(-Math.PI / 2, 0, -angle + Math.PI / 2);
    this.scene.add(mesh);

    const speed = 12;
    this.activeWaves.push({
      mesh,
      vx: Math.cos(angle) * speed,
      vz: Math.sin(angle) * speed,
      life: 0.65,
      maxLife: 0.65,
      alive: true,
    });
  }

  /**
   * SKILL 2: Phi Kiếm Quyết (3D Flying Swords with kinetic flight and impact)
   */
  public triggerFlyingSwords(
    startX: number,
    startY: number,
    startZ: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    count: number = 3
  ) {
    for (let i = 0; i < count; i++) {
      const sword = new THREE.Group();
      const bladeGeo = new THREE.BoxGeometry(0.065, 0.95, 0.016);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 0.95,
        roughness: 0.2,
        metalness: 0.85,
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 0.45;
      sword.add(blade);

      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.045, 0.045), XianxiaMaterials.createGoldMaterial());
      sword.add(guard);

      // Trailing light ribbon
      const trailMat = new THREE.LineBasicMaterial({ color: 0x6ee7b7, transparent: true, opacity: 0.85 });
      const trailGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -0.75, 0),
      ]);
      const trailLine = new THREE.Line(trailGeo, trailMat);
      sword.add(trailLine);

      // Offset spawn positions around shoulders
      const offX = (i - 1) * 0.48;
      const offZ = (i === 1 ? -0.25 : 0.12);
      sword.position.set(startX + offX, startY + 1.25, startZ + offZ);

      // Orient sword pointing towards target
      const dir = new THREE.Vector3(targetX - startX, 0, targetZ - startZ).normalize();
      const angle = Math.atan2(dir.x, dir.z);
      sword.rotation.set(Math.PI / 2, 0, angle);

      this.scene.add(sword);

      this.activeFlyingSwords.push({
        group: sword,
        trailPoints: [],
        trailLine,
        startX: startX + offX,
        startY: startY + 1.25,
        startZ: startZ + offZ,
        targetX,
        targetY,
        targetZ,
        speed: 22 + i * 2,
        progress: 0,
        alive: true,
      });
    }
  }

  /**
   * SKILL 3: Lôi Động Cửu Thiên (Telegraph Runic Array -> Descending Jagged Thunder Strike)
   */
  public triggerThunderStrike(x: number, y: number, z: number) {
    const group = new THREE.Group();

    // 1. Telegraph Ground Runic Array (Trận đồ sấm sét dưới chân)
    const runeGeo = new THREE.RingGeometry(1.6, 2.2, 24);
    const runeMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const runeMesh = new THREE.Mesh(runeGeo, runeMat);
    runeMesh.rotation.x = -Math.PI / 2;
    runeMesh.position.set(x, y + 0.025, z);
    group.add(runeMesh);

    // Inner Runic Hexagram
    const hexGeo = new THREE.RingGeometry(0.3, 1.2, 6);
    const hexMesh = new THREE.Mesh(hexGeo, runeMat);
    hexMesh.rotation.x = -Math.PI / 2;
    hexMesh.position.set(x, y + 0.03, z);
    group.add(hexMesh);

    // 2. Vertical Jagged Lightning Bolt (Sét giáng từ trên cao)
    const lightningPoints: THREE.Vector3[] = [];
    const height = 14;
    const segs = 12;
    for (let i = 0; i <= segs; i++) {
      const frac = i / segs;
      const jx = (Math.random() - 0.5) * (frac < 0.9 ? 0.9 : 0.1);
      const jz = (Math.random() - 0.5) * (frac < 0.9 ? 0.9 : 0.1);
      lightningPoints.push(new THREE.Vector3(x + jx, y + (1 - frac) * height, z + jz));
    }

    const boltGeo = new THREE.BufferGeometry().setFromPoints(lightningPoints);
    const boltMat = new THREE.LineBasicMaterial({
      color: 0xf3e8ff,
      linewidth: 3,
    });
    const boltLine = new THREE.Line(boltGeo, boltMat);
    group.add(boltLine);

    // Emissive Core Cylinder
    const coreGeo = new THREE.CylinderGeometry(0.1, 0.22, height, 8);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0.8,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.set(x, y + height / 2, z);
    group.add(coreMesh);

    // Dynamic Flash Light
    const light = new THREE.PointLight(0xc084fc, 9.5, 18);
    light.position.set(x, y + 1.8, z);
    group.add(light);

    // Scorch mark on ground
    const scorchGeo = new THREE.CircleGeometry(1.4, 16);
    const scorchMat = new THREE.MeshBasicMaterial({
      color: 0x1e1b4b,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const scorchMesh = new THREE.Mesh(scorchGeo, scorchMat);
    scorchMesh.rotation.x = -Math.PI / 2;
    scorchMesh.position.set(x, y + 0.02, z);
    this.scene.add(scorchMesh);

    this.scene.add(group);

    this.activeLightning.push({
      group,
      light,
      scorchMesh,
      timer: 0.48,
      maxTimer: 0.48,
      alive: true,
    });

    this.spawnHitSparks(x, y + 0.15, z, 45, 0xc084fc);
  }

  /**
   * Spawn 3D impact spark burst with gravity
   */
  public spawnHitSparks(x: number, y: number, z: number, count: number = 20, colorHex: number = 0xfbbf24) {
    if (!this.hitSparkParticles) return;
    const pos = this.hitSparkPositions;
    const vel = this.hitSparkVelocities;
    const lifes = this.hitSparkLifes;

    let spawned = 0;
    for (let i = 0; i < 350 && spawned < count; i++) {
      if (lifes[i] <= 0) {
        lifes[i] = 0.38 + Math.random() * 0.22;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y + 0.45;
        pos[i * 3 + 2] = z;

        const a = Math.random() * Math.PI * 2;
        const spd = 4.0 + Math.random() * 5.0;
        vel[i * 3] = Math.cos(a) * spd;
        vel[i * 3 + 1] = 2.5 + Math.random() * 4.0;
        vel[i * 3 + 2] = Math.sin(a) * spd;
        spawned++;
      }
    }
    this.hitSparkParticles.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Spawn 3D Floating Combat Damage Number
   */
  public spawnDamageText(x: number, y: number, z: number, text: string, isCrit: boolean = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = isCrit ? '900 48px Cinzel, "Noto Serif", sans-serif' : 'bold 42px Cinzel, "Noto Serif", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Bold stroke outline
    ctx.strokeStyle = '#050505';
    ctx.lineWidth = 7;
    ctx.strokeText(text, 128, 64);

    // Glowing vibrant fill
    ctx.fillStyle = isCrit ? '#f59e0b' : '#f8fafc';
    ctx.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(isCrit ? 1.85 : 1.45, isCrit ? 0.92 : 0.72, 1);
    sprite.position.set(x + (Math.random() - 0.5) * 0.3, y + 1.2, z + (Math.random() - 0.5) * 0.2);
    this.scene.add(sprite);

    this.activeDamageTexts.push({
      sprite,
      texture,
      vy: isCrit ? 2.2 : 1.7,
      life: 0.75,
      maxLife: 0.75,
      alive: true,
    });
  }

  /**
   * Update active VFX in the render loop
   */
  public update(
    dt: number,
    playerX: number,
    playerY: number,
    playerZ: number,
    shieldActive: boolean,
    swordsActive: boolean
  ) {
    // 1. Golden Bell Shield
    if (this.goldenShieldMesh) {
      this.goldenShieldMesh.visible = shieldActive;
      if (shieldActive) {
        this.goldenShieldMesh.position.set(playerX, playerY + 0.75, playerZ);
        this.goldenShieldMesh.rotation.y += dt * 1.6;
      }
    }

    // 2. Orbiting Swords
    if (this.orbitingSwordsGroup) {
      this.orbitingSwordsGroup.visible = swordsActive;
      if (swordsActive) {
        this.orbitingSwordsGroup.position.set(playerX, playerY + 0.88, playerZ);
        this.orbitingSwordsGroup.rotation.y += dt * 4.8;

        const count = 6;
        const r = 1.7;
        this.orbitingSwordsGroup.children.forEach((sword, idx) => {
          const a = (idx * Math.PI * 2) / count;
          sword.position.set(Math.cos(a) * r, Math.sin(Date.now() / 200 + idx) * 0.16, Math.sin(a) * r);
        });
      }
    }

    // 3. Update Slashes
    for (let i = this.activeSlashes.length - 1; i >= 0; i--) {
      const s = this.activeSlashes[i];
      s.progress += dt / s.duration;
      const opacity = 1.0 - s.progress;
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, opacity);
      if (s.light) {
        s.light.intensity = Math.max(0, opacity * 4.5);
      }

      if (s.progress >= 1.0) {
        this.scene.remove(s.mesh);
        if (s.light) this.scene.remove(s.light);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.Material).dispose();
        this.activeSlashes.splice(i, 1);
      }
    }

    // 4. Update Travelling Sword Qi Waves
    for (let i = this.activeWaves.length - 1; i >= 0; i--) {
      const w = this.activeWaves[i];
      w.life -= dt;
      w.mesh.position.x += w.vx * dt;
      w.mesh.position.z += w.vz * dt;
      (w.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, w.life / w.maxLife);

      if (w.life <= 0) {
        this.scene.remove(w.mesh);
        w.mesh.geometry.dispose();
        (w.mesh.material as THREE.Material).dispose();
        this.activeWaves.splice(i, 1);
      }
    }

    // 5. Update Flying Swords
    for (let i = this.activeFlyingSwords.length - 1; i >= 0; i--) {
      const sw = this.activeFlyingSwords[i];
      const dist = Math.hypot(sw.targetX - sw.startX, sw.targetZ - sw.startZ);
      sw.progress += (sw.speed * dt) / Math.max(0.1, dist);

      const curX = THREE.MathUtils.lerp(sw.startX, sw.targetX, Math.min(1, sw.progress));
      const curZ = THREE.MathUtils.lerp(sw.startZ, sw.targetZ, Math.min(1, sw.progress));
      sw.group.position.set(curX, sw.startY, curZ);

      if (sw.progress >= 1.0) {
        this.scene.remove(sw.group);
        this.activeFlyingSwords.splice(i, 1);
        this.spawnHitSparks(sw.targetX, 0.5, sw.targetZ, 15, 0x34d399);
      }
    }

    // 6. Update Lightning Strikes
    for (let i = this.activeLightning.length - 1; i >= 0; i--) {
      const l = this.activeLightning[i];
      l.timer -= dt;
      const alpha = Math.max(0, l.timer / l.maxTimer);
      l.light.intensity = alpha * 9.5;

      if (l.timer <= 0) {
        this.scene.remove(l.group);
        if (l.scorchMesh) {
          // Fade scorch mark
          setTimeout(() => {
            if (l.scorchMesh) this.scene.remove(l.scorchMesh);
          }, 3000);
        }
        this.activeLightning.splice(i, 1);
      }
    }

    // 7. Update Hit Sparks
    if (this.hitSparkParticles) {
      const pos = this.hitSparkPositions;
      const vel = this.hitSparkVelocities;
      const lifes = this.hitSparkLifes;

      for (let i = 0; i < 350; i++) {
        if (lifes[i] > 0) {
          lifes[i] -= dt;
          pos[i * 3] += vel[i * 3] * dt;
          pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
          pos[i * 3 + 2] += vel[i * 3 + 2] * dt;
          vel[i * 3 + 1] -= 9.8 * dt; // Gravity
        } else {
          pos[i * 3 + 1] = -100;
        }
      }
      this.hitSparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 8. Update Floating Damage Texts
    for (let i = this.activeDamageTexts.length - 1; i >= 0; i--) {
      const dtObj = this.activeDamageTexts[i];
      dtObj.life -= dt;
      dtObj.sprite.position.y += dtObj.vy * dt;
      dtObj.vy = Math.max(0.3, dtObj.vy - dt * 1.8);
      const frac = dtObj.life / dtObj.maxLife;
      dtObj.sprite.material.opacity = Math.min(1.0, frac * 1.8);

      if (dtObj.life <= 0) {
        this.scene.remove(dtObj.sprite);
        dtObj.texture.dispose();
        dtObj.sprite.material.dispose();
        this.activeDamageTexts.splice(i, 1);
      }
    }
  }

  public dispose() {
    this.activeSlashes.forEach(s => {
      this.scene.remove(s.mesh);
      if (s.light) this.scene.remove(s.light);
    });
    this.activeWaves.forEach(w => this.scene.remove(w.mesh));
    this.activeFlyingSwords.forEach(sw => this.scene.remove(sw.group));
    this.activeLightning.forEach(l => {
      this.scene.remove(l.group);
      if (l.scorchMesh) this.scene.remove(l.scorchMesh);
    });
    this.activeDamageTexts.forEach(d => {
      this.scene.remove(d.sprite);
      d.texture.dispose();
      d.sprite.material.dispose();
    });
    this.activeDamageTexts = [];
    if (this.goldenShieldMesh) this.scene.remove(this.goldenShieldMesh);
    if (this.orbitingSwordsGroup) this.scene.remove(this.orbitingSwordsGroup);
    if (this.hitSparkParticles) this.scene.remove(this.hitSparkParticles);
  }
}
