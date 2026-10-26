import * as THREE from 'three';
import { XianxiaMaterials } from '../materials';

/**
 * Premium Stylized 3D Cultivator Model: Lâm Mặc (Phàm Trần Tiên Lộ)
 * Complete hierarchical skeletal/kinematic assembly:
 * - Contoured face & head with Daoist topknot crown, twin gold hairpins, flowing ponytail, forehead jade talisman
 * - Layered Daoist Hanfu robes: Cross-collar lapel (Giao Lãnh), billowing sleeves (Quảng Tụ), leather forearm vambraces (Hộ Oản)
 * - Waist sash with dragon jade medallion & dual silk tassels (lưu tô)
 * - Articulated legs with pleated front-split skirt & upturned-toe boots (Vân Đầu Ngoa)
 * - Double-edged Qingfeng Jian sword with fuller groove, wing guard, emerald gem, and dynamic crimson silk tassel (Kiếm Tuệ)
 * - Left hand with iconic Daoist sword-finger seal (Kiếm Chỉ) counter-balance
 * - Whole-body kinematic animations for Idle, Walk, Dodge, Cast, and 3-Step Sword Combo
 */
export class CultivatorCharacter3D {
  public group: THREE.Group;
  public rootGroup: THREE.Group;
  public hipsGroup: THREE.Group;
  public torsoGroup: THREE.Group;
  public neckGroup: THREE.Group;
  public headGroup: THREE.Group;
  public hairPonytail1: THREE.Group;
  public hairPonytail2: THREE.Group;
  public hairPonytail3: THREE.Group;
  public leftArmGroup: THREE.Group;
  public rightArmGroup: THREE.Group;
  public leftForearmGroup: THREE.Group;
  public rightForearmGroup: THREE.Group;
  public leftHandGroup: THREE.Group;
  public rightHandGroup: THREE.Group;
  public leftLegGroup: THREE.Group;
  public rightLegGroup: THREE.Group;
  public leftCalfGroup: THREE.Group;
  public rightCalfGroup: THREE.Group;
  public swordGroup: THREE.Group;
  public swordTassel!: THREE.Group;
  public baguaGroup: THREE.Group;
  public contactShadow: THREE.Mesh;
  public waistRibbons: THREE.Group;

  // Meshes for hit flash
  private characterMeshes: THREE.Mesh[] = [];
  private originalColors: Map<THREE.Mesh, THREE.Color> = new Map();

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Hero_LamMac';

    // 1. Root Group
    this.rootGroup = new THREE.Group();
    this.group.add(this.rootGroup);

    // 2. Ground Contact Shadow
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.1);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.015;
    this.group.add(this.contactShadow);

    // 3. Rotating Jade Bagua Array (Bát Quái Linh Trận dưới chân)
    this.baguaGroup = new THREE.Group();
    this.baguaGroup.position.y = 0.025;
    const ringGeo = new THREE.RingGeometry(0.85, 1.05, 32);
    const jadeRingMat = XianxiaMaterials.createJadeMaterial(true);
    const jadeRing = new THREE.Mesh(ringGeo, jadeRingMat);
    jadeRing.rotation.x = -Math.PI / 2;
    this.baguaGroup.add(jadeRing);

    // 8 Golden Trigram Runes
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI * 2) / 8;
      const trigram = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.05), XianxiaMaterials.createGoldMaterial());
      trigram.position.set(Math.cos(a) * 0.95, 0.025, Math.sin(a) * 0.95);
      trigram.rotation.y = -a;
      this.baguaGroup.add(trigram);
    }
    this.group.add(this.baguaGroup);

    // 4. Materials
    const skinMat = XianxiaMaterials.createSkinMaterial();
    const hairMat = XianxiaMaterials.createHairMaterial();
    const goldMat = XianxiaMaterials.createGoldMaterial();
    const jadeMat = XianxiaMaterials.createJadeMaterial(true);
    const innerSilkMat = XianxiaMaterials.createInnerRobeMaterial('#0284c7');
    const outerCoatMat = XianxiaMaterials.createHanfuRobeMaterial('#f8fafc');
    const pantsMat = XianxiaMaterials.createHanfuRobeMaterial('#1e293b');
    const leatherMat = XianxiaMaterials.createHanfuRobeMaterial('#334155');
    const sashMat = XianxiaMaterials.createInnerRobeMaterial('#0369a1');

    // 5. Hips & Pelvis
    this.hipsGroup = new THREE.Group();
    this.hipsGroup.position.y = 0.75;
    this.rootGroup.add(this.hipsGroup);

    const pelvisGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.18, 8);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvisMesh.position.y = 0.02;
    this.hipsGroup.add(pelvisMesh);
    this.characterMeshes.push(pelvisMesh);

    // Lower Pleated Hanfu Skirt with Front Split
    const skirtGeo = new THREE.ConeGeometry(0.42, 0.68, 12, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, outerCoatMat);
    skirtMesh.position.set(0, -0.15, 0);
    skirtMesh.castShadow = true;
    this.hipsGroup.add(skirtMesh);
    this.characterMeshes.push(skirtMesh);

    // 6. Articulated Legs & Boots (Vân Đầu Ngoa)
    // LEFT LEG
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, 0, 0);
    this.hipsGroup.add(this.leftLegGroup);

    const thighGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.36, 8);
    const thighL = new THREE.Mesh(thighGeo, pantsMat);
    thighL.position.y = -0.18;
    thighL.castShadow = true;
    this.leftLegGroup.add(thighL);
    this.characterMeshes.push(thighL);

    // Left Knee & Calf
    this.leftCalfGroup = new THREE.Group();
    this.leftCalfGroup.position.set(0, -0.34, 0);
    this.leftLegGroup.add(this.leftCalfGroup);

    const calfGeo = new THREE.CylinderGeometry(0.08, 0.075, 0.35, 8);
    const calfL = new THREE.Mesh(calfGeo, leatherMat);
    calfL.position.y = -0.17;
    calfL.castShadow = true;
    this.leftCalfGroup.add(calfL);
    this.characterMeshes.push(calfL);

    // Left Upturned Boot (Vân Đầu Ngoa)
    const bootToeGeo = new THREE.ConeGeometry(0.075, 0.2, 5);
    const bootToeL = new THREE.Mesh(bootToeGeo, leatherMat);
    bootToeL.rotation.x = -Math.PI / 2.3;
    bootToeL.position.set(0, -0.35, 0.08);
    this.leftCalfGroup.add(bootToeL);
    this.characterMeshes.push(bootToeL);

    // RIGHT LEG
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, 0, 0);
    this.hipsGroup.add(this.rightLegGroup);

    const thighR = new THREE.Mesh(thighGeo, pantsMat);
    thighR.position.y = -0.18;
    thighR.castShadow = true;
    this.rightLegGroup.add(thighR);
    this.characterMeshes.push(thighR);

    this.rightCalfGroup = new THREE.Group();
    this.rightCalfGroup.position.set(0, -0.34, 0);
    this.rightLegGroup.add(this.rightCalfGroup);

    const calfR = new THREE.Mesh(calfGeo, leatherMat);
    calfR.position.y = -0.17;
    calfR.castShadow = true;
    this.rightCalfGroup.add(calfR);
    this.characterMeshes.push(calfR);

    const bootToeR = new THREE.Mesh(bootToeGeo, leatherMat);
    bootToeR.rotation.x = -Math.PI / 2.3;
    bootToeR.position.set(0, -0.35, 0.08);
    this.rightCalfGroup.add(bootToeR);
    this.characterMeshes.push(bootToeR);

    // 7. Torso & Layered Hanfu Robes
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 0.08;
    this.hipsGroup.add(this.torsoGroup);

    // Inner Sky-Blue Silk Tunic (Giao Lãnh)
    const innerChestGeo = new THREE.CylinderGeometry(0.24, 0.21, 0.52, 10);
    const innerChestMesh = new THREE.Mesh(innerChestGeo, innerSilkMat);
    innerChestMesh.position.y = 0.26;
    innerChestMesh.castShadow = true;
    this.torsoGroup.add(innerChestMesh);
    this.characterMeshes.push(innerChestMesh);

    // Outer Silver-White Flowing Coat
    const outerCoatGeo = new THREE.CylinderGeometry(0.27, 0.29, 0.54, 10);
    const outerCoatMesh = new THREE.Mesh(outerCoatGeo, outerCoatMat);
    outerCoatMesh.position.y = 0.26;
    outerCoatMesh.scale.set(1.08, 1.0, 1.08);
    outerCoatMesh.castShadow = true;
    this.torsoGroup.add(outerCoatMesh);
    this.characterMeshes.push(outerCoatMesh);

    // Cloud-Pattern Shoulder Pauldrons (Hộ Kiên Vân Mây)
    const pauldronGeo = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI);
    const pauldronL = new THREE.Mesh(pauldronGeo, goldMat);
    pauldronL.position.set(-0.31, 0.48, 0);
    pauldronL.rotation.z = Math.PI / 2;
    this.torsoGroup.add(pauldronL);

    const pauldronR = new THREE.Mesh(pauldronGeo, goldMat);
    pauldronR.position.set(0.31, 0.48, 0);
    pauldronR.rotation.z = -Math.PI / 2;
    this.torsoGroup.add(pauldronR);

    // Broad Waist Sash & Dragon Jade Medallion
    const sashGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.11, 12);
    const sashMesh = new THREE.Mesh(sashGeo, sashMat);
    sashMesh.position.y = 0.06;
    this.torsoGroup.add(sashMesh);

    const jadeMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 12), jadeMat);
    jadeMedallion.rotation.x = Math.PI / 2;
    jadeMedallion.position.set(0, 0.06, 0.28);
    this.torsoGroup.add(jadeMedallion);

    // Fluttering Crimson Silk Streamers (Lưu Tô Thắt Lưng)
    this.waistRibbons = new THREE.Group();
    const ribbonGeo = new THREE.PlaneGeometry(0.065, 0.52);
    const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, side: THREE.DoubleSide, roughness: 0.5 });
    const ribbonL = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonL.position.set(-0.06, -0.2, 0.28);
    this.waistRibbons.add(ribbonL);

    const ribbonR = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbonR.position.set(0.06, -0.2, 0.28);
    this.waistRibbons.add(ribbonR);
    this.torsoGroup.add(this.waistRibbons);

    // 8. Neck & Sculpted Head
    this.neckGroup = new THREE.Group();
    this.neckGroup.position.set(0, 0.52, 0);
    this.torsoGroup.add(this.neckGroup);

    const neckGeo = new THREE.CylinderGeometry(0.085, 0.1, 0.14, 8);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.07;
    this.neckGroup.add(neckMesh);
    this.characterMeshes.push(neckMesh);

    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.14, 0);
    this.neckGroup.add(this.headGroup);

    // Contoured Facial Cranium & Chin
    const headGeo = new THREE.SphereGeometry(0.18, 12, 10);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.scale.set(0.88, 1.05, 0.95);
    headMesh.position.y = 0.12;
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);
    this.characterMeshes.push(headMesh);

    // Forehead Jade Drop Talisman (Ngọc Trụy Trán)
    const foreheadJadeGeo = new THREE.ConeGeometry(0.024, 0.08, 5);
    const foreheadJade = new THREE.Mesh(foreheadJadeGeo, jadeMat);
    foreheadJade.rotation.x = Math.PI;
    foreheadJade.position.set(0, 0.22, 0.17);
    this.headGroup.add(foreheadJade);

    // Raven Hair Cap with parted bangs
    const hairCapGeo = new THREE.SphereGeometry(0.19, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
    const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
    hairCap.position.set(0, 0.15, -0.02);
    this.headGroup.add(hairCap);

    // Daoist Topknot (Búi Tóc Tử Vi)
    const topknot = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.08, 0.15, 8), hairMat);
    topknot.position.set(0, 0.38, -0.05);
    this.headGroup.add(topknot);

    // Purple-Gold Crown (Tử Kim Quan)
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.09, 8, 1, true), goldMat);
    crown.position.set(0, 0.37, -0.05);
    this.headGroup.add(crown);

    // Twin Horizontal Golden Hairpins (Song Kim Trâm)
    const hairpin = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.36, 6), goldMat);
    hairpin.position.set(0, 0.38, -0.05);
    hairpin.rotation.z = Math.PI / 2;
    this.headGroup.add(hairpin);

    // 3-Segment Articulated Dynamic Ponytail (Tóc Đuôi Ngựa Chảy Dài)
    this.hairPonytail1 = new THREE.Group();
    this.hairPonytail1.position.set(0, 0.32, -0.15);
    this.headGroup.add(this.hairPonytail1);

    const ponyGeo1 = new THREE.ConeGeometry(0.08, 0.26, 6);
    const ponyMesh1 = new THREE.Mesh(ponyGeo1, hairMat);
    ponyMesh1.position.y = -0.13;
    ponyMesh1.rotation.x = -0.3;
    this.hairPonytail1.add(ponyMesh1);

    this.hairPonytail2 = new THREE.Group();
    this.hairPonytail2.position.set(0, -0.24, -0.06);
    this.hairPonytail1.add(this.hairPonytail2);

    const ponyGeo2 = new THREE.ConeGeometry(0.065, 0.24, 6);
    const ponyMesh2 = new THREE.Mesh(ponyGeo2, hairMat);
    ponyMesh2.position.y = -0.12;
    ponyMesh2.rotation.x = -0.2;
    this.hairPonytail2.add(ponyMesh2);

    this.hairPonytail3 = new THREE.Group();
    this.hairPonytail3.position.set(0, -0.22, -0.04);
    this.hairPonytail2.add(this.hairPonytail3);

    const ponyGeo3 = new THREE.ConeGeometry(0.045, 0.22, 5);
    const ponyMesh3 = new THREE.Mesh(ponyGeo3, hairMat);
    ponyMesh3.position.y = -0.11;
    this.hairPonytail3.add(ponyMesh3);

    // 9. Articulated Arms, Wide Flowing Sleeves & Leather Vambraces
    // LEFT ARM (Counter-Balance & Sword-Finger Seal)
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.34, 0.48, 0);
    this.torsoGroup.add(this.leftArmGroup);

    const upperArmMeshL = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.26, 8), skinMat);
    upperArmMeshL.position.y = -0.13;
    this.leftArmGroup.add(upperArmMeshL);

    // Billowing sleeve draping from upper arm
    const sleeveL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 8, 1, true), outerCoatMat);
    sleeveL.position.set(-0.04, -0.22, 0);
    this.leftArmGroup.add(sleeveL);

    this.leftForearmGroup = new THREE.Group();
    this.leftForearmGroup.position.set(0, -0.26, 0);
    this.leftArmGroup.add(this.leftForearmGroup);

    // Forearm with leather vambrace (Hộ Oản)
    const vambraceGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.24, 8);
    const vambraceL = new THREE.Mesh(vambraceGeo, leatherMat);
    vambraceL.position.y = -0.12;
    this.leftForearmGroup.add(vambraceL);
    this.characterMeshes.push(vambraceL);

    // Left Hand (Sword-Finger Seal / Kiếm Chỉ Mudra)
    this.leftHandGroup = new THREE.Group();
    this.leftHandGroup.position.set(0, -0.24, 0);
    this.leftForearmGroup.add(this.leftHandGroup);

    const palmL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.03), skinMat);
    palmL.position.y = -0.03;
    this.leftHandGroup.add(palmL);

    // Extended Index & Middle fingers (Kiếm Chỉ)
    const swordFinger = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 4), skinMat);
    swordFinger.position.set(0, -0.09, 0);
    this.leftHandGroup.add(swordFinger);

    // RIGHT ARM & WEAPON SOCKET
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.34, 0.48, 0);
    this.torsoGroup.add(this.rightArmGroup);

    const upperArmMeshR = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.26, 8), skinMat);
    upperArmMeshR.position.y = -0.13;
    this.rightArmGroup.add(upperArmMeshR);

    const sleeveR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 8, 1, true), outerCoatMat);
    sleeveR.position.set(0.04, -0.22, 0);
    this.rightArmGroup.add(sleeveR);

    this.rightForearmGroup = new THREE.Group();
    this.rightForearmGroup.position.set(0, -0.26, 0);
    this.rightArmGroup.add(this.rightForearmGroup);

    const vambraceR = new THREE.Mesh(vambraceGeo, leatherMat);
    vambraceR.position.y = -0.12;
    this.rightForearmGroup.add(vambraceR);
    this.characterMeshes.push(vambraceR);

    // Clenched Right Hand Gripping Sword Hilt
    this.rightHandGroup = new THREE.Group();
    this.rightHandGroup.position.set(0, -0.24, 0);
    this.rightForearmGroup.add(this.rightHandGroup);

    const fistR = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), skinMat);
    this.rightHandGroup.add(fistR);

    // 10. Qingfeng Double-Edged Jian (Thanh Phong Bảo Kiếm)
    this.swordGroup = new THREE.Group();
    this.buildSculptedQingfengSword();
    this.rightHandGroup.add(this.swordGroup);
    this.swordGroup.rotation.x = Math.PI / 2;

    // Cache original colors for flashing
    this.characterMeshes.forEach(m => {
      if (m.material && (m.material as THREE.MeshStandardMaterial).color) {
        this.originalColors.set(m, (m.material as THREE.MeshStandardMaterial).color.clone());
      }
    });
  }

  // Sculpted Chinese Double-Edged Jian
  private buildSculptedQingfengSword() {
    const bladeMat = XianxiaMaterials.createSteelBladeMaterial();
    const goldMat = XianxiaMaterials.createGoldMaterial();
    const jadeMat = XianxiaMaterials.createJadeMaterial(true);

    // 1. Blade with Central Fuller Ridge
    const bladeGeo = new THREE.BoxGeometry(0.065, 1.05, 0.018);
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.y = 0.52;
    blade.castShadow = true;
    this.swordGroup.add(blade);

    // Diamond Point Tip
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 4), bladeMat);
    tip.position.y = 1.08;
    tip.rotation.y = Math.PI / 4;
    this.swordGroup.add(tip);

    // 2. Ornate Golden Winged Crossguard (Kiếm Cách)
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.06), goldMat);
    guard.position.y = 0.02;
    this.swordGroup.add(guard);

    // Inset Jade Core Gem
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 8), jadeMat);
    gem.position.set(0, 0.02, 0.035);
    this.swordGroup.add(gem);

    // 3. Braided Cord Hilt Grip
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.24, 8), XianxiaMaterials.createHanfuRobeMaterial('#334155'));
    grip.position.y = -0.12;
    this.swordGroup.add(grip);

    // 4. Pommel
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.042, 8, 8), goldMat);
    pommel.position.y = -0.24;
    this.swordGroup.add(pommel);

    // 5. Dynamic Swinging Crimson Silk Tassel (Kiếm Tuệ)
    this.swordTassel = new THREE.Group();
    this.swordTassel.position.set(0, -0.26, 0);
    this.swordGroup.add(this.swordTassel);

    const tasselGeo = new THREE.CylinderGeometry(0.012, 0.038, 0.32, 6);
    const tasselMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.55 });
    const tasselMesh = new THREE.Mesh(tasselGeo, tasselMat);
    tasselMesh.position.y = -0.16;
    this.swordTassel.add(tasselMesh);
  }

  /**
   * Kinematic Animation State Machine with Full-Body Weight Transfer
   */
  public updateAnimation(
    state: 'idle' | 'walk' | 'attack' | 'dodge' | 'cast' | 'hurt' | 'dead',
    time: number,
    isWalking: boolean,
    walkTimer: number,
    facingAngle: number,
    attackStep: 1 | 2 | 3 = 1,
    attackProgress: number = 0,
    castProgress: number = 0,
    hurtTimer: number = 0
  ) {
    // 1. Orient toward facing angle
    this.rootGroup.rotation.y = -facingAngle + Math.PI / 2;

    // Slowly spin Bagua Array on ground
    this.baguaGroup.rotation.y = time * 0.5;

    // 2. Reset base transformations
    this.hipsGroup.position.set(0, 0.75, 0);
    this.hipsGroup.rotation.set(0, 0, 0);
    this.torsoGroup.position.set(0, 0.08, 0);
    this.torsoGroup.rotation.set(0, 0, 0);
    this.neckGroup.rotation.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.leftForearmGroup.rotation.set(0, 0, 0);
    this.rightForearmGroup.rotation.set(0, 0, 0);
    this.leftLegGroup.rotation.set(0, 0, 0);
    this.rightLegGroup.rotation.set(0, 0, 0);
    this.leftCalfGroup.rotation.set(0, 0, 0);
    this.rightCalfGroup.rotation.set(0, 0, 0);
    this.swordTassel.rotation.set(0, 0, 0);

    // Flutter ribbons with momentum
    this.waistRibbons.rotation.x = Math.sin(time * 3) * 0.15 + (isWalking ? 0.35 : 0.05);

    // Ponytail hair physics
    this.hairPonytail1.rotation.x = Math.sin(time * 2.5) * 0.1 - (isWalking ? 0.35 : 0.1);
    this.hairPonytail2.rotation.x = Math.sin(time * 2.5 - 0.4) * 0.15;
    this.hairPonytail3.rotation.x = Math.sin(time * 2.5 - 0.8) * 0.2;

    // 3. Hit Damage Flash
    if (hurtTimer > 0) {
      const flashRed = Math.sin(hurtTimer * 30) > 0;
      this.characterMeshes.forEach(m => {
        if (m.material && (m.material as THREE.MeshStandardMaterial).color) {
          (m.material as THREE.MeshStandardMaterial).color.setHex(flashRed ? 0xef4444 : 0xffffff);
        }
      });
      this.torsoGroup.position.z = -0.16;
      this.torsoGroup.rotation.x = -0.25;
      this.headGroup.rotation.x = 0.35;
      return;
    } else {
      this.characterMeshes.forEach(m => {
        const orig = this.originalColors.get(m);
        if (orig && m.material && (m.material as THREE.MeshStandardMaterial).color) {
          (m.material as THREE.MeshStandardMaterial).color.copy(orig);
        }
      });
    }

    if (state === 'dead') {
      this.rootGroup.position.y = 0.1;
      this.rootGroup.rotation.x = Math.PI / 2;
      this.contactShadow.scale.set(0.5, 0.5, 0.5);
      return;
    }

    // 4. Natural Walk Kinematics (Joint articulation: Hips, Thigh, Knee, Calf)
    if (isWalking && state !== 'attack' && state !== 'cast') {
      const stride = Math.sin(walkTimer * 7.5);
      const kneeFlexL = Math.max(0, -stride * 0.7);
      const kneeFlexR = Math.max(0, stride * 0.7);

      this.leftLegGroup.rotation.x = stride * 0.6;
      this.leftCalfGroup.rotation.x = kneeFlexL;

      this.rightLegGroup.rotation.x = -stride * 0.6;
      this.rightCalfGroup.rotation.x = kneeFlexR;

      this.leftArmGroup.rotation.x = -stride * 0.42;
      this.rightArmGroup.rotation.x = stride * 0.42;

      this.hipsGroup.position.y = 0.75 + Math.abs(stride) * 0.05;
      this.torsoGroup.rotation.y = stride * 0.12;
      this.headGroup.rotation.y = -stride * 0.06;

      // Sword tassel physics during walk
      this.swordTassel.rotation.z = Math.sin(walkTimer * 7.5) * 0.35;
    } else if (state === 'idle') {
      // Gentle meditative breathing & sleeve drift
      const breath = Math.sin(time * 2.2);
      this.hipsGroup.position.y = 0.75 + breath * 0.02;
      this.leftArmGroup.rotation.z = -0.15 - breath * 0.03;
      this.rightArmGroup.rotation.z = 0.15 + breath * 0.03;
      this.headGroup.rotation.y = Math.sin(time * 0.8) * 0.08;
    }

    // 5. Dodge Dash
    if (state === 'dodge') {
      this.hipsGroup.position.y = 0.52;
      this.torsoGroup.rotation.x = 0.55;
      this.leftArmGroup.rotation.x = -0.85;
      this.rightArmGroup.rotation.x = -0.85;
      this.leftLegGroup.rotation.x = 0.65;
      this.rightLegGroup.rotation.x = -0.65;
      this.hairPonytail1.rotation.x = -0.7;
      return;
    }

    // 6. Spellcasting Hand Seals (Kiết Ấn)
    if (state === 'cast') {
      const seal = Math.sin(castProgress * Math.PI);
      this.leftArmGroup.rotation.set(-1.1 * seal, 0.45 * seal, -0.4 * seal);
      this.rightArmGroup.rotation.set(-1.1 * seal, -0.45 * seal, 0.4 * seal);
      this.hipsGroup.position.y = 0.75 + seal * 0.08;

      this.swordGroup.position.set(0, 0.65, -0.4);
      this.swordGroup.rotation.set(0, 0, time * 6);
      return;
    } else {
      this.swordGroup.position.set(0, 0, 0);
      this.swordGroup.rotation.set(Math.PI / 2, 0, 0);
    }

    // 7. Dynamic 3-Step Sword Combo Animations with Full Body Kinematics
    if (state === 'attack') {
      const p = Math.max(0, Math.min(1, attackProgress));

      if (attackStep === 1) {
        // STEP 1: Hoành Tảo Kiếm Khí (Horizontal Right-to-Left Slash)
        // Anticipation (0.00 - 0.22): Lowers center of gravity, coils torso to right (-35°), left hand forms sword-finger
        // Active (0.22 - 0.62): Waist explodes forward, right arm slashes horizontal arc, right foot plants
        // Follow-through & Recovery (0.62 - 1.00): Decelerates at left flank, smooth return to combat stance
        if (p < 0.22) {
          const w = p / 0.22;
          this.hipsGroup.position.y = 0.75 - 0.08 * w; // Center of gravity lowers
          this.torsoGroup.rotation.y = 0.65 * w;       // Coils right
          this.rightArmGroup.rotation.set(0.35 * w, 0.85 * w, 0.4 * w);
          this.rightForearmGroup.rotation.y = -0.3 * w;
          this.leftArmGroup.rotation.set(-0.3 * w, -0.45 * w, -0.2 * w); // Sword finger ready
          this.leftLegGroup.rotation.x = -0.2 * w;
          this.rightLegGroup.rotation.x = 0.25 * w;
          this.swordTassel.rotation.z = -0.5 * w;
        } else if (p < 0.62) {
          const s = (p - 0.22) / 0.40;
          const waistAngle = 0.65 - s * 2.1; // Explodes across from +0.65 to -1.45 rad
          this.hipsGroup.position.y = 0.67 + Math.sin(s * Math.PI) * 0.05;
          this.torsoGroup.rotation.y = waistAngle;
          this.rightArmGroup.rotation.set(-0.55, waistAngle * 0.9, -0.95);
          this.rightForearmGroup.rotation.y = -0.55;
          this.leftArmGroup.rotation.set(0.4, 0.35, 0.55); // Counter balance
          this.swordTassel.rotation.z = 1.2 * (1 - s);
          this.hairPonytail1.rotation.y = -waistAngle * 0.4;
        } else {
          const r = (p - 0.62) / 0.38;
          this.hipsGroup.position.y = 0.67 + 0.08 * r;
          this.torsoGroup.rotation.y = -1.45 * (1 - r);
          this.rightArmGroup.rotation.set(-0.55 * (1 - r), -0.75 * (1 - r), 0);
          this.leftArmGroup.rotation.set(0.4 * (1 - r), 0.35 * (1 - r), 0);
        }
      } else if (attackStep === 2) {
        // STEP 2: Nghịch Phong Kiếm (Reverse Upward Diagonal Slash)
        // Anticipation (0.00 - 0.20): Weight shifts to rear foot, crouches into low left stance
        // Active (0.20 - 0.60): Lunges forward, drives hips upward, twists torso powerfully right and upward
        // Follow-through & Recovery (0.60 - 1.00): Flourish follow-through, tip pointing skyward
        if (p < 0.20) {
          const w = p / 0.20;
          this.hipsGroup.position.y = 0.75 - 0.14 * w;
          this.torsoGroup.rotation.set(0.15 * w, -0.75 * w, 0.1 * w); // Sinks low left
          this.rightArmGroup.rotation.set(0.85 * w, -0.7 * w, 0.3 * w);
          this.leftArmGroup.rotation.set(-0.4 * w, 0.3 * w, 0.3 * w);
          this.swordTassel.rotation.x = -0.6 * w;
        } else if (p < 0.60) {
          const s = (p - 0.20) / 0.40;
          this.hipsGroup.position.y = 0.61 + s * 0.22; // Surges upward
          this.torsoGroup.rotation.set(0.15 - s * 0.35, -0.75 + s * 1.9, -0.2 * s);
          this.rightArmGroup.rotation.set(0.85 - s * 2.3, 0.6, 1.1 * s);
          this.leftArmGroup.rotation.set(-0.4 - s * 0.3, -0.5, -0.3);
          this.swordTassel.rotation.z = -1.1;
          this.hairPonytail1.rotation.y = 0.5 * (1 - s);
        } else {
          const r = (p - 0.60) / 0.40;
          this.hipsGroup.position.y = 0.83 - 0.08 * r;
          this.torsoGroup.rotation.set(-0.2 * (1 - r), 1.15 * (1 - r), 0);
          this.rightArmGroup.rotation.set(-1.45 * (1 - r), 0.3 * (1 - r), 0);
        }
      } else {
        // STEP 3: Phách Không Tuyệt Trảm (Overhead Leap & Ground-Slam Cleave)
        // Anticipation (0.00 - 0.26): High leap into air, two-handed grip overhead, torso arches back
        // Active (0.26 - 0.66): Full-body violent downward plunge, ground slam, impact frame
        // Recovery (0.66 - 1.00): Deep grounded landing crouch, pulls sword up
        if (p < 0.26) {
          const w = p / 0.26;
          this.hipsGroup.position.y = 0.75 + 0.42 * w; // Leaps high into air
          this.torsoGroup.rotation.x = -0.45 * w;      // Arches back
          this.rightArmGroup.rotation.set(-2.55 * w, 0.2, -0.2); // Sword held high overhead
          this.leftArmGroup.rotation.set(-2.35 * w, -0.2, 0.2);
          this.leftLegGroup.rotation.x = 0.45 * w;
          this.rightLegGroup.rotation.x = -0.45 * w;
          this.swordTassel.rotation.x = 1.2 * w;
          this.hairPonytail1.rotation.x = 0.6 * w;
        } else if (p < 0.66) {
          const s = (p - 0.26) / 0.40;
          // Plunge violently down to 0.52 (deep slam crouch)
          this.hipsGroup.position.y = 1.17 - s * 0.65;
          this.torsoGroup.rotation.x = -0.45 + s * 1.25; // Forward plunge
          this.rightArmGroup.rotation.set(-2.55 + s * 3.3, 0, 0);
          this.leftArmGroup.rotation.set(-2.35 + s * 3.0, 0, 0);
          this.leftLegGroup.rotation.x = 0.45 - s * 0.9;
          this.rightLegGroup.rotation.x = -0.45 + s * 0.9;
          this.swordTassel.rotation.x = -1.3 * (1 - s);
        } else {
          const r = (p - 0.66) / 0.34;
          this.hipsGroup.position.y = 0.52 + r * 0.23; // Rising from landing crouch
          this.torsoGroup.rotation.x = 0.8 * (1 - r);
          this.rightArmGroup.rotation.set(0.75 * (1 - r), 0, 0);
          this.leftArmGroup.rotation.set(0.65 * (1 - r), 0, 0);
        }
      }
    }
  }
}
