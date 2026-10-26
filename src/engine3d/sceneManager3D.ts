import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CultivatorCharacter3D } from './models/characterModel';
import { DemonicBeast3D } from './models/beastModel';
import { EnvironmentModels3D } from './models/environmentModels';
import { CombatVFX3DManager } from './combatVFX3D';
import { isSoftwareGl, XianxiaMaterials } from './materials';
import { PlayerStats, Enemy } from '../types/game';

export class SceneManager3D {
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public cultivator: CultivatorCharacter3D;
  public vfxManager: CombatVFX3DManager;

  // Active 3D Beast instances mapped by enemy ID
  private beastMap: Map<string, DemonicBeast3D> = new Map();

  // Lighting
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Camera smooth damp target
  private cameraTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);

  // Scaling factor from 2D pixel coordinates to 3D world units
  // 1 unit = ~28 pixels
  public static readonly SCALE_FACTOR = 0.035;

  constructor(container: HTMLElement, width: number, height: number) {
    // 1. Renderer Setup with PBR tone mapping & software WebGL protection
    this.renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 2. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0c1926'); // Deep mystical midnight-cyan
    this.scene.fog = new THREE.FogExp2('#0c1926', 0.022);

    // 3. Mandatory Studio Reflection (RoomEnvironment)
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Fixed 2.5D Isometric-Angle Perspective Camera
    // Angled down at ~51 degrees, FOV 40 for cinematic character presence and combat impact
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 120);
    this.camera.position.set(0, 11.8, 9.4); // elevated and tilted back
    this.camera.lookAt(0, 0.95, 0);

    // 5. Studio 3-Point Lighting Rig
    // Warm Key Light (Sunlight)
    this.dirLight = new THREE.DirectionalLight('#fffbeb', 2.8);
    this.dirLight.position.set(16, 25, 12);
    this.dirLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 60;
      const d = 22;
      this.dirLight.shadow.camera.left = -d;
      this.dirLight.shadow.camera.right = d;
      this.dirLight.shadow.camera.top = d;
      this.dirLight.shadow.camera.bottom = -d;
      this.dirLight.shadow.bias = -0.0004;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    // Cool Sky / Ground Fill
    this.hemiLight = new THREE.HemisphereLight('#38bdf8', '#14532d', 0.9);
    this.scene.add(this.hemiLight);

    // 6. Build Vertical Slice 3D Environment (Thanh Khê Thôn)
    this.buildThanhKheEnvironment();

    // 7. Cultivator Hero Model
    this.cultivator = new CultivatorCharacter3D();
    this.scene.add(this.cultivator.group);

    // 8. Combat VFX Manager
    this.vfxManager = new CombatVFX3DManager(this.scene);
  }

  // Convert 2D pixel coordinates (0..mapWidth, 0..mapHeight) to 3D (X, Z)
  public static toWorldCoords(pixelX: number, pixelY: number): { x: number; z: number } {
    return {
      x: (pixelX - 700) * SceneManager3D.SCALE_FACTOR,
      z: (pixelY - 550) * SceneManager3D.SCALE_FACTOR,
    };
  }

  // Convert 3D world coords back to 2D pixel coords
  public static toPixelCoords(worldX: number, worldZ: number): { x: number; y: number } {
    return {
      x: worldX / SceneManager3D.SCALE_FACTOR + 700,
      y: worldZ / SceneManager3D.SCALE_FACTOR + 550,
    };
  }

  // Stream water mesh for texture offset animation
  private streamMesh?: THREE.Mesh;

  // Camera Shake Feedback
  public cameraShakeIntensity: number = 0;

  public triggerCameraShake(intensity: number = 0.35) {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, intensity);
  }

  /**
   * Assemble rich 3D environmental landscape for Thanh Khê Thôn
   */
  private buildThanhKheEnvironment() {
    // 1. Rolling Village Ground
    const groundGeo = new THREE.PlaneGeometry(80, 80, 32, 32);
    // Add subtle height elevation variation
    const posAttr = groundGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vz = posAttr.getY(i);
      // Subtle terrain undulation (rolling mounds)
      const h = Math.sin(vx * 0.1) * Math.cos(vz * 0.1) * 0.25;
      posAttr.setZ(i, h);
    }
    groundGeo.computeVertexNormals();

    const groundMat = XianxiaMaterials.createTerrainMaterial();
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 2. Meandering Clear Stream (Thanh Khê Thủy Lưu) cutting across village
    const streamGeo = new THREE.PlaneGeometry(5.2, 70, 8, 32);
    const streamMat = XianxiaMaterials.createWaterStreamMaterial();
    this.streamMesh = new THREE.Mesh(streamGeo, streamMat);
    this.streamMesh.rotation.x = -Math.PI / 2;
    this.streamMesh.rotation.z = 0.42;
    this.streamMesh.position.set(-2.5, 0.03, 0);
    this.scene.add(this.streamMesh);

    // 3. Stone Paved Path cutting through village
    const pathGeo = new THREE.PlaneGeometry(3.2, 50, 16, 32);
    const pathTex = XianxiaMaterials.getCobblestoneTexture();
    pathTex.repeat.set(1.5, 12);
    const pathMat = new THREE.MeshStandardMaterial({
      map: pathTex,
      roughness: 0.8,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, 0.02, 0);
    path.receiveShadow = true;
    this.scene.add(path);

    // Cross-path connecting to Pharmacy Pavilion
    const crossPathGeo = new THREE.PlaneGeometry(16, 2.8);
    const crossPath = new THREE.Mesh(crossPathGeo, pathMat);
    crossPath.rotation.x = -Math.PI / 2;
    crossPath.position.set(4, 0.025, -2);
    crossPath.receiveShadow = true;
    this.scene.add(crossPath);

    // 4. Sculpted Curved Stone Arch Bridge (Thanh Khê Thạch Kiều) over stream
    const stoneBridge = EnvironmentModels3D.createStoneBridge(8.2, 3.4);
    stoneBridge.position.set(-2.5, 0, 0);
    stoneBridge.rotation.y = -0.42 + Math.PI / 2;
    this.scene.add(stoneBridge);

    // 5. Ancient Chinese Pavilion / Điển Dược Các (Village Pharmacy)
    const pavilion = EnvironmentModels3D.createAncientPavilion(5.2, 4.2, 4.2);
    pavilion.position.set(9.5, 0, -4.5);
    pavilion.rotation.y = -0.3;
    this.scene.add(pavilion);

    // Smaller Storage Pavilion / Tàng Trữ Các
    const storageHouse = EnvironmentModels3D.createAncientPavilion(3.8, 3.2, 3.4);
    storageHouse.position.set(-8.5, 0, -7.5);
    storageHouse.rotation.y = 0.45;
    this.scene.add(storageHouse);

    // 6. Sculpted Bamboo Groves (Trúc Lâm Tiên Cảnh)
    const bambooPositions = [
      { x: -8.5, z: 8.5, count: 14, r: 2.8 },
      { x: -9.0, z: -2.5, count: 10, r: 2.2 },
      { x: 15.0, z: -6.0, count: 16, r: 3.0 },
      { x: 1.5, z: -13.0, count: 11, r: 2.4 },
      { x: -14.5, z: 3.5, count: 15, r: 3.2 },
    ];
    bambooPositions.forEach(bp => {
      const grove = EnvironmentModels3D.createBambooGrove(bp.count, bp.r);
      grove.position.set(bp.x, 0, bp.z);
      this.scene.add(grove);
    });

    // 7. Twisted Ancient Pines (Thanh Khê Cổ Tùng)
    const pinePositions = [
      { x: 10.0, z: 10.5, h: 5.6 },
      { x: -11.0, z: 11.0, h: 6.2 },
      { x: -3.5, z: -9.5, h: 5.0 },
      { x: 14.5, z: 4.5, h: 5.8 },
      { x: -6.0, z: -12.5, h: 5.2 },
    ];
    pinePositions.forEach(pp => {
      const pine = EnvironmentModels3D.createAncientPine(pp.h);
      pine.position.set(pp.x, 0, pp.z);
      this.scene.add(pine);
    });

    // 8. Hexagonal Stone Pagoda Garden Lanterns (Thạch Đăng Lung)
    const lanternPositions = [
      { x: -5.8, z: -1.8, rot: 0 },
      { x: 0.8, z: 1.8, rot: Math.PI },
      { x: 7.0, z: -2.8, rot: 0.3 },
      { x: 12.0, z: -2.8, rot: -0.3 },
    ];
    lanternPositions.forEach(lp => {
      const lantern = EnvironmentModels3D.createStoneLantern();
      lantern.position.set(lp.x, 0, lp.z);
      lantern.rotation.y = lp.rot;
      this.scene.add(lantern);
    });

    // 9. Weathered Boulders & River Rocks (Kỳ Thạch)
    const rockPositions = [
      { x: -2.8, z: 3.2, s: 1.1 },
      { x: 3.2, z: -3.8, s: 0.9 },
      { x: -6.5, z: 8.5, s: 1.4 },
      { x: 10.5, z: -7.5, s: 1.2 },
      { x: -4.8, z: 2.2, s: 1.3 },
    ];
    rockPositions.forEach(rp => {
      const rock = EnvironmentModels3D.createRock(rp.s);
      rock.position.set(rp.x, 0, rp.z);
      this.scene.add(rock);
    });

    // 10. Spirit Herb Patches (Dược Điền)
    const herbPositions = [
      { x: 7.2, z: -1.5, c: '#34d399' },
      { x: 8.4, z: -1.2, c: '#a855f7' },
      { x: 6.5, z: -0.8, c: '#38bdf8' },
    ];
    herbPositions.forEach(hp => {
      const herb = EnvironmentModels3D.createSpiritHerb(hp.c);
      herb.position.set(hp.x, 0, hp.z);
      this.scene.add(herb);
    });

    // 11. Natural Perimeter Mountain Formations (Chân Núi Thanh Khê)
    const perimeterRocks = [
      { x: -25, z: 0, s: 5.2 },
      { x: 25, z: 0, s: 5.0 },
      { x: 0, z: -26, s: 5.5 },
      { x: 0, z: 26, s: 5.2 },
      { x: -20, z: -20, s: 4.8 },
      { x: 20, z: 20, s: 5.0 },
      { x: -20, z: 20, s: 4.6 },
      { x: 20, z: -20, s: 4.9 },
    ];
    perimeterRocks.forEach(pr => {
      const rock = EnvironmentModels3D.createRock(pr.s);
      rock.position.set(pr.x, 0, pr.z);
      this.scene.add(rock);
    });
  }

  /**
   * Synchronize 3D scene with 2D game state (Player, Enemies, VFX, Camera)
   */
  public update(
    dt: number,
    time: number,
    player: PlayerStats,
    enemies: Enemy[],
    isWalking: boolean,
    walkTimer: number,
    attackAnim: { active: boolean; step: 1 | 2 | 3; progress: number; angle: number; duration: number },
    castingAnim: { active: boolean; progress: number },
    activeSkillsAnim: { shieldActive: boolean; swordsActive: boolean }
  ) {
    // Animate stream water flow texture
    if (this.streamMesh) {
      const mat = this.streamMesh.material as THREE.MeshStandardMaterial;
      if (mat.map) {
        mat.map.offset.y -= dt * 0.08;
      }
    }

    // 1. Update Cultivator 3D Position & Facing
    const p3d = SceneManager3D.toWorldCoords(player.x, player.y);
    this.cultivator.group.position.set(p3d.x, 0, p3d.z);

    // Compute player state
    let charState: 'idle' | 'walk' | 'attack' | 'dodge' | 'cast' | 'hurt' | 'dead' = 'idle';
    if (player.hp <= 0) charState = 'dead';
    else if ((player.hurtFlashTimer || 0) > 0) charState = 'hurt';
    else if (player.isDodging) charState = 'dodge';
    else if (attackAnim.active) charState = 'attack';
    else if (castingAnim.active) charState = 'cast';
    else if (isWalking) charState = 'walk';

    // Facing angle in radians
    const facingAngle =
      player.facing === 'left' ? Math.PI : player.facing === 'up' ? -Math.PI / 2 : player.facing === 'down' ? Math.PI / 2 : 0;

    this.cultivator.updateAnimation(
      charState,
      time,
      isWalking,
      walkTimer,
      attackAnim.active ? attackAnim.angle : facingAngle,
      attackAnim.step,
      attackAnim.progress,
      castingAnim.progress,
      player.hurtFlashTimer || 0
    );

    // 2. Update Demonic Beast 3D Models
    // Track which beasts are active this frame
    const activeEnemyIds = new Set<string>();

    enemies.forEach(e => {
      activeEnemyIds.add(e.id);
      let beast = this.beastMap.get(e.id);
      if (!beast) {
        beast = new DemonicBeast3D(e.isBoss);
        this.scene.add(beast.group);
        this.beastMap.set(e.id, beast);
      }

      const e3d = SceneManager3D.toWorldCoords(e.x, e.y);
      beast.group.position.set(e3d.x, 0, e3d.z);

      const eFacing = Math.atan2(player.y - e.y, player.x - e.x);
      beast.updateAnimation(e.state, time, eFacing, e.speed, e.hurtTimer || 0);
    });

    // Remove deleted / dead enemies
    for (const [id, beast] of this.beastMap.entries()) {
      if (!activeEnemyIds.has(id)) {
        this.scene.remove(beast.group);
        this.beastMap.delete(id);
      }
    }

    // 3. Update Camera Tracking with Smooth Exponential Damping
    const targetCamX = p3d.x;
    const targetCamZ = p3d.z + 9.4;
    const targetCamY = 11.8;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, targetCamX, 6.0, dt);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, targetCamZ, 6.0, dt);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, targetCamY, 6.0, dt);

    this.cameraTarget.x = THREE.MathUtils.damp(this.cameraTarget.x, p3d.x, 6.0, dt);
    this.cameraTarget.z = THREE.MathUtils.damp(this.cameraTarget.z, p3d.z, 6.0, dt);
    this.cameraTarget.y = 0.95;

    // Apply Camera Shake offset if active
    if (this.cameraShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity * 0.7;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - dt * 2.8);
    }

    this.camera.lookAt(this.cameraTarget);

    // Update sunlight direction to follow player
    this.dirLight.position.set(p3d.x + 16, 25, p3d.z + 12);
    this.dirLight.target.position.set(p3d.x, 0, p3d.z);
    this.dirLight.target.updateMatrixWorld();

    // 4. Update Combat VFX
    this.vfxManager.update(
      dt,
      p3d.x,
      0,
      p3d.z,
      activeSkillsAnim.shieldActive,
      activeSkillsAnim.swordsActive
    );

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.vfxManager.dispose();
    this.beastMap.forEach(b => this.scene.remove(b.group));
    this.beastMap.clear();
    this.scene.remove(this.cultivator.group);
    this.renderer.dispose();
  }
}
