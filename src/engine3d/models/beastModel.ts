import * as THREE from 'three';
import { XianxiaMaterials } from '../materials';

/**
 * Thanh Khê Ma Hóa Dã Lang (Demonic Wild Wolf of Thanh Khê)
 * High-detail quadruped predatory beast with authentic digitigrade anatomy:
 * Arched spine, articulated snapping jaws, fangs, wolf ears, neck mane,
 * 4 digitigrade legs (scapula/thigh, hock, clawed paws), bushy segmented tail,
 * and cinematic animation kinematics (gallop, crouch-telegraph, bite-lunge, hurt recoil, death collapse).
 */
export class DemonicBeast3D {
  public group: THREE.Group;
  public rootGroup: THREE.Group;
  public bodyGroup: THREE.Group;
  public chestGroup: THREE.Group;
  public neckGroup: THREE.Group;
  public headGroup: THREE.Group;
  public jawGroup: THREE.Group;
  public earL: THREE.Group;
  public earR: THREE.Group;
  public tailGroup: THREE.Group;
  public tailMid: THREE.Group;
  public tailTip: THREE.Group;
  public legFL: THREE.Group;
  public legFR: THREE.Group;
  public legBL: THREE.Group;
  public legBR: THREE.Group;
  public contactShadow: THREE.Mesh;
  public eyesMesh: THREE.Mesh;
  public eyeLight?: THREE.PointLight;

  private beastMeshes: THREE.Mesh[] = [];
  private originalColors: Map<THREE.Mesh, THREE.Color> = new Map();
  public isBoss: boolean;

  constructor(isBoss: boolean = false) {
    this.isBoss = isBoss;
    this.group = new THREE.Group();
    this.group.name = isBoss ? 'Boss_MaHoaDaLangVuong' : 'Enemy_ThanhKheDaLang';

    const scale = isBoss ? 1.7 : 1.12;

    // 1. Root Group with pivot at bottom center
    this.rootGroup = new THREE.Group();
    this.rootGroup.scale.set(scale, scale, scale);
    this.group.add(this.rootGroup);

    // 2. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(2.4 * scale, 1.3 * scale);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.015;
    this.group.add(this.contactShadow);

    const furMat = XianxiaMaterials.createWolfFurMaterial(isBoss ? '#0f172a' : '#1e293b');
    const underbellyMat = XianxiaMaterials.createWolfFurMaterial(isBoss ? '#1e1b4b' : '#334155');
    const fangMat = XianxiaMaterials.createHanfuRobeMaterial('#f8fafc');
    const clawMat = XianxiaMaterials.createHanfuRobeMaterial('#090d16');
    const eyeMat = XianxiaMaterials.createDemonicGlowMaterial(isBoss ? '#ef4444' : '#f59e0b');

    // 3. Body / Torso (Thoracic Chest + Tapered Waist)
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 0.72, 0);
    this.rootGroup.add(this.bodyGroup);

    // Deep muscular chest
    this.chestGroup = new THREE.Group();
    this.chestGroup.position.set(0, 0, 0.22);
    this.bodyGroup.add(this.chestGroup);

    const chestGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.75, 8);
    const chestMesh = new THREE.Mesh(chestGeo, furMat);
    chestMesh.rotation.x = Math.PI / 2;
    chestMesh.scale.set(1.1, 1.25, 1.0);
    chestMesh.castShadow = true;
    this.chestGroup.add(chestMesh);
    this.beastMeshes.push(chestMesh);

    // Tapered lean flank / lumbar spine
    const flankGeo = new THREE.CylinderGeometry(0.32, 0.28, 0.65, 8);
    const flankMesh = new THREE.Mesh(flankGeo, underbellyMat);
    flankMesh.rotation.x = Math.PI / 2;
    flankMesh.position.set(0, 0.02, -0.42);
    flankMesh.scale.set(0.95, 1.1, 1.0);
    flankMesh.castShadow = true;
    this.bodyGroup.add(flankMesh);
    this.beastMeshes.push(flankMesh);

    // Dorsal Bristled Obsidian Spines (Hàng gai lông hắc ám dọc sống lưng)
    const spineSpikes = new THREE.Group();
    const spikeMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      emissive: isBoss ? 0xef4444 : 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.35,
      metalness: 0.65,
    });
    for (let i = 0; i < 7; i++) {
      const spGeo = new THREE.ConeGeometry(0.065, 0.28 + (i >= 2 && i <= 4 ? 0.12 : 0), 4);
      const spike = new THREE.Mesh(spGeo, spikeMat);
      spike.position.set(0, 0.38 + Math.sin((i / 6) * Math.PI) * 0.06, -0.65 + i * 0.19);
      spike.rotation.x = -0.4 + i * 0.08;
      spike.castShadow = true;
      spineSpikes.add(spike);
      this.beastMeshes.push(spike);
    }
    this.bodyGroup.add(spineSpikes);

    // 4. Neck & Wolf Mane Fur Ruff
    this.neckGroup = new THREE.Group();
    this.neckGroup.position.set(0, 0.24, 0.52);
    this.chestGroup.add(this.neckGroup);

    const neckGeo = new THREE.CylinderGeometry(0.24, 0.34, 0.42, 8);
    const neckMesh = new THREE.Mesh(neckGeo, furMat);
    neckMesh.rotation.x = 0.55;
    neckMesh.scale.set(1.15, 1.0, 1.25);
    neckMesh.castShadow = true;
    this.neckGroup.add(neckMesh);
    this.beastMeshes.push(neckMesh);

    // Flared Neck Ruff
    const ruffGeo = new THREE.ConeGeometry(0.42, 0.35, 6);
    const ruffMesh = new THREE.Mesh(ruffGeo, furMat);
    ruffMesh.rotation.x = -0.4;
    ruffMesh.position.set(0, -0.05, -0.08);
    this.neckGroup.add(ruffMesh);
    this.beastMeshes.push(ruffMesh);

    // 5. Predatory Wolf Head, Snout & Articulated Jaws
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.18, 0.24);
    this.neckGroup.add(this.headGroup);

    // Cranium
    const skullGeo = new THREE.BoxGeometry(0.38, 0.32, 0.44);
    const skullMesh = new THREE.Mesh(skullGeo, furMat);
    skullMesh.position.set(0, 0.05, 0);
    skullMesh.castShadow = true;
    this.headGroup.add(skullMesh);
    this.beastMeshes.push(skullMesh);

    // Slanted Upper Muzzle / Snout
    const snoutGeo = new THREE.BoxGeometry(0.22, 0.16, 0.38);
    const snoutMesh = new THREE.Mesh(snoutGeo, underbellyMat);
    snoutMesh.position.set(0, -0.04, 0.35);
    snoutMesh.castShadow = true;
    this.headGroup.add(snoutMesh);
    this.beastMeshes.push(snoutMesh);

    // Black Nose Pad
    const noseGeo = new THREE.BoxGeometry(0.12, 0.09, 0.08);
    const noseMesh = new THREE.Mesh(noseGeo, clawMat);
    noseMesh.position.set(0, 0.02, 0.54);
    this.headGroup.add(noseMesh);

    // Piercing Glowing Demonic Eyes
    const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.16, 0.11, 0.16);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.16, 0.11, 0.16);
    this.headGroup.add(rightEye);
    this.eyesMesh = leftEye;

    if (!isBoss) {
      this.eyeLight = new THREE.PointLight(0xf59e0b, 1.2, 3.5);
      this.eyeLight.position.set(0, 0.12, 0.22);
      this.headGroup.add(this.eyeLight);
    } else {
      this.eyeLight = new THREE.PointLight(0xef4444, 2.5, 5.0);
      this.eyeLight.position.set(0, 0.15, 0.25);
      this.headGroup.add(this.eyeLight);
    }

    // Upper Canine Fangs (Răng nanh trên)
    const upperFangGeo = new THREE.ConeGeometry(0.035, 0.18, 5);
    const uFangL = new THREE.Mesh(upperFangGeo, fangMat);
    uFangL.position.set(-0.09, -0.15, 0.44);
    uFangL.rotation.x = Math.PI;
    this.headGroup.add(uFangL);
    this.beastMeshes.push(uFangL);

    const uFangR = new THREE.Mesh(upperFangGeo, fangMat);
    uFangR.position.set(0.09, -0.15, 0.44);
    uFangR.rotation.x = Math.PI;
    this.headGroup.add(uFangR);
    this.beastMeshes.push(uFangR);

    // Articulated Lower Jaw (Hàm dưới chuyển động đóng mở)
    this.jawGroup = new THREE.Group();
    this.jawGroup.position.set(0, -0.12, 0.18);
    this.headGroup.add(this.jawGroup);

    const jawGeo = new THREE.BoxGeometry(0.19, 0.08, 0.35);
    const jawMesh = new THREE.Mesh(jawGeo, underbellyMat);
    jawMesh.position.set(0, -0.02, 0.16);
    this.jawGroup.add(jawMesh);
    this.beastMeshes.push(jawMesh);

    // Lower Canine Fangs (Răng nanh dưới vểnh lên)
    const lowerFangGeo = new THREE.ConeGeometry(0.03, 0.15, 5);
    const lFangL = new THREE.Mesh(lowerFangGeo, fangMat);
    lFangL.position.set(-0.08, 0.06, 0.28);
    this.jawGroup.add(lFangL);

    const lFangR = new THREE.Mesh(lowerFangGeo, fangMat);
    lFangR.position.set(0.08, 0.06, 0.28);
    this.jawGroup.add(lFangR);

    // Pointed Wolf Ears (Tai sói vểnh cảnh giác)
    const earGeo = new THREE.ConeGeometry(0.11, 0.32, 4);
    this.earL = new THREE.Group();
    this.earL.position.set(-0.16, 0.22, -0.06);
    const earMeshL = new THREE.Mesh(earGeo, furMat);
    earMeshL.rotation.set(-0.25, 0, -0.35);
    this.earL.add(earMeshL);
    this.headGroup.add(this.earL);
    this.beastMeshes.push(earMeshL);

    this.earR = new THREE.Group();
    this.earR.position.set(0.16, 0.22, -0.06);
    const earMeshR = new THREE.Mesh(earGeo, furMat);
    earMeshR.rotation.set(-0.25, 0, 0.35);
    this.earR.add(earMeshR);
    this.headGroup.add(this.earR);
    this.beastMeshes.push(earMeshR);

    // 6. 4 Digitigrade Legs with Articulated Joints
    // FRONT LEFT LEG
    this.legFL = new THREE.Group();
    this.legFL.position.set(-0.35, -0.15, 0.38);
    this.bodyGroup.add(this.legFL);

    const scapulaGeo = new THREE.CylinderGeometry(0.13, 0.11, 0.36, 6);
    const scapulaFL = new THREE.Mesh(scapulaGeo, furMat);
    scapulaFL.position.y = -0.16;
    this.legFL.add(scapulaFL);
    this.beastMeshes.push(scapulaFL);

    const forelegGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.38, 6);
    const forelegFL = new THREE.Mesh(forelegGeo, underbellyMat);
    forelegFL.position.set(0, -0.46, 0.05);
    this.legFL.add(forelegFL);
    this.beastMeshes.push(forelegFL);

    // Front Left Paw
    const pawGeo = new THREE.BoxGeometry(0.14, 0.08, 0.18);
    const pawFL = new THREE.Mesh(pawGeo, clawMat);
    pawFL.position.set(0, -0.66, 0.1);
    this.legFL.add(pawFL);

    // FRONT RIGHT LEG
    this.legFR = new THREE.Group();
    this.legFR.position.set(0.35, -0.15, 0.38);
    this.bodyGroup.add(this.legFR);

    const scapulaFR = new THREE.Mesh(scapulaGeo, furMat);
    scapulaFR.position.y = -0.16;
    this.legFR.add(scapulaFR);
    this.beastMeshes.push(scapulaFR);

    const forelegFR = new THREE.Mesh(forelegGeo, underbellyMat);
    forelegFR.position.set(0, -0.46, 0.05);
    this.legFR.add(forelegFR);
    this.beastMeshes.push(forelegFR);

    const pawFR = new THREE.Mesh(pawGeo, clawMat);
    pawFR.position.set(0, -0.66, 0.1);
    this.legFR.add(pawFR);

    // HIND LEFT LEG (Muscular thigh + Reverse hock)
    this.legBL = new THREE.Group();
    this.legBL.position.set(-0.32, -0.12, -0.42);
    this.bodyGroup.add(this.legBL);

    const thighGeo = new THREE.CylinderGeometry(0.16, 0.13, 0.42, 7);
    const thighBL = new THREE.Mesh(thighGeo, furMat);
    thighBL.position.set(0, -0.18, -0.06);
    thighBL.rotation.x = -0.35;
    this.legBL.add(thighBL);
    this.beastMeshes.push(thighBL);

    const hockGeo = new THREE.CylinderGeometry(0.09, 0.075, 0.36, 6);
    const hockBL = new THREE.Mesh(hockGeo, underbellyMat);
    hockBL.position.set(0, -0.48, 0.05);
    hockBL.rotation.x = 0.45;
    this.legBL.add(hockBL);
    this.beastMeshes.push(hockBL);

    const pawBL = new THREE.Mesh(pawGeo, clawMat);
    pawBL.position.set(0, -0.66, 0.06);
    this.legBL.add(pawBL);

    // HIND RIGHT LEG
    this.legBR = new THREE.Group();
    this.legBR.position.set(0.32, -0.12, -0.42);
    this.bodyGroup.add(this.legBR);

    const thighBR = new THREE.Mesh(thighGeo, furMat);
    thighBR.position.set(0, -0.18, -0.06);
    thighBR.rotation.x = -0.35;
    this.legBR.add(thighBR);
    this.beastMeshes.push(thighBR);

    const hockBR = new THREE.Mesh(hockGeo, underbellyMat);
    hockBR.position.set(0, -0.48, 0.05);
    hockBR.rotation.x = 0.45;
    this.legBR.add(hockBR);
    this.beastMeshes.push(hockBR);

    const pawBR = new THREE.Mesh(pawGeo, clawMat);
    pawBR.position.set(0, -0.66, 0.06);
    this.legBR.add(pawBR);

    // 7. Bushy Multi-Segment Wolf Tail (Đuôi sói rậm rạp)
    this.tailGroup = new THREE.Group();
    this.tailGroup.position.set(0, 0.16, -0.68);
    this.bodyGroup.add(this.tailGroup);

    const tailGeo1 = new THREE.CylinderGeometry(0.12, 0.16, 0.36, 6);
    const tailMesh1 = new THREE.Mesh(tailGeo1, furMat);
    tailMesh1.position.y = -0.16;
    tailMesh1.rotation.x = -0.65;
    this.tailGroup.add(tailMesh1);
    this.beastMeshes.push(tailMesh1);

    this.tailMid = new THREE.Group();
    this.tailMid.position.set(0, -0.28, -0.18);
    this.tailGroup.add(this.tailMid);

    const tailGeo2 = new THREE.CylinderGeometry(0.14, 0.1, 0.38, 6);
    const tailMesh2 = new THREE.Mesh(tailGeo2, underbellyMat);
    tailMesh2.position.y = -0.18;
    tailMesh2.rotation.x = -0.4;
    this.tailMid.add(tailMesh2);
    this.beastMeshes.push(tailMesh2);

    this.tailTip = new THREE.Group();
    this.tailTip.position.set(0, -0.32, -0.14);
    this.tailMid.add(this.tailTip);

    const tailGeo3 = new THREE.ConeGeometry(0.1, 0.34, 5);
    const tailMesh3 = new THREE.Mesh(tailGeo3, clawMat);
    tailMesh3.position.y = -0.16;
    tailMesh3.rotation.x = -0.2;
    this.tailTip.add(tailMesh3);

    // Cache original colors for flashing damage feedback
    this.beastMeshes.forEach(m => {
      if (m.material && (m.material as THREE.MeshStandardMaterial).color) {
        this.originalColors.set(m, (m.material as THREE.MeshStandardMaterial).color.clone());
      }
    });
  }

  /**
   * Kinematic Animation State Machine with Impact Recoil and Physical Death Collapse
   */
  public updateAnimation(
    state: string,
    time: number,
    facingAngle: number,
    speed: number,
    hurtTimer: number = 0,
    hitAngle: number = 0
  ) {
    // 1. Orient toward target facing angle
    this.rootGroup.rotation.y = -facingAngle + Math.PI / 2;

    // Reset base posture
    this.bodyGroup.position.set(0, 0.72, 0);
    this.bodyGroup.rotation.set(0, 0, 0);
    this.neckGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
    this.jawGroup.rotation.x = 0;
    this.tailGroup.rotation.set(0, 0, 0);

    // 2. Damage Hit Reaction (Flash red + violent recoil)
    if (hurtTimer > 0) {
      const flashRed = Math.sin(hurtTimer * 45) > 0;
      this.beastMeshes.forEach(m => {
        if (m.material && (m.material as THREE.MeshStandardMaterial).color) {
          (m.material as THREE.MeshStandardMaterial).color.setHex(flashRed ? 0xef4444 : 0xffffff);
        }
      });

      // Recoil jerk: pitch body back, throw head up, bend spine
      const recoilNorm = Math.min(1.0, hurtTimer * 3.0);
      this.bodyGroup.position.y = 0.72 + recoilNorm * 0.14;
      this.bodyGroup.position.z = -recoilNorm * 0.22;
      this.bodyGroup.rotation.x = -recoilNorm * 0.35;
      this.headGroup.rotation.x = recoilNorm * 0.45;
      this.headGroup.rotation.y = (Math.random() - 0.5) * 0.4;
      this.jawGroup.rotation.x = 0.4;
      return;
    } else {
      this.beastMeshes.forEach(m => {
        const orig = this.originalColors.get(m);
        if (orig && m.material && (m.material as THREE.MeshStandardMaterial).color) {
          (m.material as THREE.MeshStandardMaterial).color.copy(orig);
        }
      });
    }

    // 3. Realistic Death Collapse
    if (state === 'dead') {
      this.bodyGroup.position.y = 0.22;
      this.bodyGroup.rotation.z = Math.PI / 2;
      this.bodyGroup.rotation.x = 0.15;
      this.headGroup.rotation.x = 0.3;
      this.jawGroup.rotation.x = 0.35; // Jaws slack
      this.tailGroup.rotation.x = 0.9; // Tail limp
      this.contactShadow.scale.set(0.65, 0.65, 0.65);
      if (this.eyeLight) {
        this.eyeLight.intensity = Math.max(0, this.eyeLight.intensity - 0.05);
      }
      return;
    }

    // 4. Movement: Prowl / Trot / Sprint Gallop
    if (state === 'chase' || state === 'patrol') {
      const isSprint = state === 'chase';
      const freq = isSprint ? 14 : 7;
      const gait = Math.sin(time * freq);
      const spineFlex = Math.cos(time * freq) * (isSprint ? 0.16 : 0.06);

      // Digitigrade running motion (diagonal pairs)
      this.legFL.rotation.x = gait * (isSprint ? 0.75 : 0.45);
      this.legBR.rotation.x = gait * (isSprint ? 0.75 : 0.45);
      this.legFR.rotation.x = -gait * (isSprint ? 0.75 : 0.45);
      this.legBL.rotation.x = -gait * (isSprint ? 0.75 : 0.45);

      // Spine arching and vertical bound
      this.bodyGroup.position.y = 0.72 + Math.abs(gait) * (isSprint ? 0.12 : 0.05);
      this.bodyGroup.rotation.x = spineFlex;

      // Neck & head bobbing
      this.neckGroup.rotation.x = -spineFlex * 0.6;
      this.headGroup.rotation.x = isSprint ? -0.15 : Math.sin(time * 6) * 0.08;

      // Tail streaming behind with sway
      this.tailGroup.rotation.x = isSprint ? -0.65 : -0.25;
      this.tailGroup.rotation.y = Math.sin(time * (freq * 0.5)) * 0.3;
      this.tailMid.rotation.y = Math.sin(time * (freq * 0.5) - 0.5) * 0.3;
    } else if (state === 'attack_windup') {
      // Crouch low onto haunches (anticipation/telegraph)
      this.bodyGroup.position.y = 0.55;
      this.bodyGroup.rotation.x = 0.22;
      this.headGroup.position.y = -0.06;
      this.headGroup.rotation.x = 0.35;
      this.jawGroup.rotation.x = 0.5; // Bares fangs
      this.earL.rotation.z = -0.6; // Ears pinned back
      this.earR.rotation.z = 0.6;
      this.tailGroup.rotation.x = -0.55;
    } else if (state === 'attacking') {
      // Explosive lunge and jaw snap!
      const biteCycle = Math.sin(time * 18);
      this.bodyGroup.position.y = 0.82;
      this.bodyGroup.position.z = 0.25;
      this.bodyGroup.rotation.x = -0.28;
      this.neckGroup.position.z = 0.65;
      this.headGroup.rotation.x = -0.25;
      this.jawGroup.rotation.x = Math.max(0, biteCycle * 0.6); // Snapping bite
      this.legFL.rotation.x = -0.65;
      this.legFR.rotation.x = -0.65;
      this.legBL.rotation.x = 0.75;
      this.legBR.rotation.x = 0.75;
    } else {
      // Idle Breathing & Alert Stance
      const breath = Math.sin(time * 2.4);
      this.bodyGroup.position.y = 0.72 + breath * 0.025;
      this.chestGroup.scale.set(1.0 + breath * 0.04, 1.0, 1.0 + breath * 0.04);
      this.neckGroup.rotation.x = breath * 0.04;
      this.headGroup.rotation.y = Math.sin(time * 0.8) * 0.12;

      // Ear alert twitches
      this.earL.rotation.y = Math.sin(time * 1.5) * 0.1;
      this.earR.rotation.y = Math.cos(time * 1.2) * 0.1;

      // Gentle tail wag
      this.tailGroup.rotation.y = Math.sin(time * 2.0) * 0.25;
      this.tailMid.rotation.y = Math.sin(time * 2.0 - 0.4) * 0.28;
      this.tailTip.rotation.y = Math.sin(time * 2.0 - 0.8) * 0.32;
    }
  }
}
