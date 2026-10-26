import * as THREE from 'three';
import { XianxiaMaterials } from '../materials';

export class EnvironmentModels3D {
  /**
   * Create Authentic Ancient Chinese Xianxia Pavilion (Điển Dược Các / Thảo Lư)
   * High-detail composite: Stepped terrace, carved balustrades, timber columns, Dou-gong brackets,
   * dual-tier sweeping upturned eaves with glazed tiles and dragon ridge beasts, paper lattice doors.
   */
  public static createAncientPavilion(width: number = 5.2, depth: number = 4.4, height: number = 4.6): THREE.Group {
    const pavilion = new THREE.Group();
    pavilion.name = 'XianxiaApothecaryPavilion';

    const stoneMat = XianxiaMaterials.createStoneRockMaterial();
    const woodMat = XianxiaMaterials.createPavilionWoodMaterial();
    const tileMat = XianxiaMaterials.createRoofTilesMaterial(true);
    const goldMat = XianxiaMaterials.createGoldMaterial();

    // 1. Raised Stepped Stone Foundation Platform (Bệ đá hoa cương)
    const baseGeo = new THREE.BoxGeometry(width + 1.2, 0.55, depth + 1.2);
    const baseMesh = new THREE.Mesh(baseGeo, stoneMat);
    baseMesh.position.y = 0.275;
    baseMesh.receiveShadow = true;
    pavilion.add(baseMesh);

    // Front Stone Steps with side blocks
    for (let s = 0; s < 3; s++) {
      const stepGeo = new THREE.BoxGeometry(1.8, 0.18, 0.45);
      const stepMesh = new THREE.Mesh(stepGeo, stoneMat);
      stepMesh.position.set(0, 0.09 + s * 0.18, depth / 2 + 0.6 + (2 - s) * 0.4);
      stepMesh.receiveShadow = true;
      pavilion.add(stepMesh);
    }

    // 2. Stone Balustrades with Carved Lotus Finials (Lan can đá hoa sen)
    const balustradeHeight = 0.65;
    const postGeo = new THREE.BoxGeometry(0.12, balustradeHeight, 0.12);
    const railGeo = new THREE.BoxGeometry(width + 0.8, 0.08, 0.08);

    // Left and Right Railings on Platform
    const railLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, depth + 0.8), stoneMat);
    railLeft.position.set(-width / 2 - 0.4, 0.55 + balustradeHeight * 0.7, 0);
    pavilion.add(railLeft);

    const railRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, depth + 0.8), stoneMat);
    railRight.position.set(width / 2 + 0.4, 0.55 + balustradeHeight * 0.7, 0);
    pavilion.add(railRight);

    // Balustrade Posts
    const postPositions = [
      [-width / 2 - 0.4, -depth / 2 - 0.4],
      [-width / 2 - 0.4, depth / 2 + 0.4],
      [width / 2 + 0.4, -depth / 2 - 0.4],
      [width / 2 + 0.4, depth / 2 + 0.4],
      [-1.0, depth / 2 + 0.4],
      [1.0, depth / 2 + 0.4],
    ];

    postPositions.forEach(([px, pz]) => {
      const post = new THREE.Mesh(postGeo, stoneMat);
      post.position.set(px, 0.55 + balustradeHeight / 2, pz);
      // Lotus Finial on post
      const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), stoneMat);
      lotus.position.y = balustradeHeight / 2 + 0.08;
      post.add(lotus);
      pavilion.add(post);
    });

    // 3. Heavy Timber Columns (Cột lim đỏ son)
    const columnGeo = new THREE.CylinderGeometry(0.16, 0.18, height * 0.6, 12);
    const colPositions = [
      [-width / 2 + 0.4, depth / 2 - 0.4],
      [width / 2 - 0.4, depth / 2 - 0.4],
      [-width / 2 + 0.4, -depth / 2 + 0.4],
      [width / 2 - 0.4, -depth / 2 + 0.4],
      [0, depth / 2 - 0.4], // Center entrance column
    ];

    colPositions.forEach(([cx, cz]) => {
      const col = new THREE.Mesh(columnGeo, woodMat);
      col.position.set(cx, 0.55 + (height * 0.6) / 2, cz);
      col.castShadow = true;
      col.receiveShadow = true;

      // Stone Column Plinth Base (Đôn chân cột bằng đá)
      const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.15, 8), stoneMat);
      plinth.position.y = -(height * 0.6) / 2 + 0.075;
      col.add(plinth);

      pavilion.add(col);
    });

    // 4. Lattice Wall Panels & Sliding Doors (Vách gỗ hoa văn cách tử)
    const wallHeight = height * 0.58;
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(width - 0.8, wallHeight, 0.1), woodMat);
    backWall.position.set(0, 0.55 + wallHeight / 2, -depth / 2 + 0.4);
    backWall.castShadow = true;
    pavilion.add(backWall);

    // Left and Right Screen Walls
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallHeight, depth - 0.8), woodMat);
    leftWall.position.set(-width / 2 + 0.4, 0.55 + wallHeight / 2, 0);
    leftWall.castShadow = true;
    pavilion.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallHeight, depth - 0.8), woodMat);
    rightWall.position.set(width / 2 - 0.4, 0.55 + wallHeight / 2, 0);
    rightWall.castShadow = true;
    pavilion.add(rightWall);

    // Front Carved Plaque Sign (Hoành phi: "ĐIỂN DƯỢC CÁC")
    const signGeo = new THREE.BoxGeometry(1.8, 0.42, 0.08);
    const signMesh = new THREE.Mesh(signGeo, goldMat);
    signMesh.position.set(0, 0.55 + wallHeight + 0.12, depth / 2 - 0.35);
    pavilion.add(signMesh);

    // 5. Dou-Gong Bracket Sets (Hệ Đấu Củng đỡ mái truyền thống)
    const bracketGeo = new THREE.BoxGeometry(0.45, 0.14, 0.35);
    colPositions.forEach(([cx, cz]) => {
      const bracket = new THREE.Mesh(bracketGeo, woodMat);
      bracket.position.set(cx, 0.55 + height * 0.6, cz);
      pavilion.add(bracket);
    });

    // 6. Sweeping Multi-Tier Upturned Flared Roofs (Mái ngói cong phi thiềm)
    const roofY = 0.55 + height * 0.6 + 0.2;

    // Lower Eave Tier with upturned corners
    const lowerRoofGroup = new THREE.Group();
    lowerRoofGroup.position.y = roofY;

    // Flared Hip-and-Gable Roof Pyramid
    const lowerRoofGeo = new THREE.ConeGeometry(width * 0.85, 1.1, 4, 1);
    const lowerRoof = new THREE.Mesh(lowerRoofGeo, tileMat);
    lowerRoof.rotation.y = Math.PI / 4;
    lowerRoof.scale.set(1.25, 0.55, 1.1);
    lowerRoof.castShadow = true;
    lowerRoofGroup.add(lowerRoof);

    // 4 Corner Upturned Flying Eave Tips (Góc đao mái vuốt cong)
    const cornerOffsets = [
      [width * 0.85 * 0.65, depth * 0.85 * 0.65],
      [-width * 0.85 * 0.65, depth * 0.85 * 0.65],
      [width * 0.85 * 0.65, -depth * 0.85 * 0.65],
      [-width * 0.85 * 0.65, -depth * 0.85 * 0.65],
    ];

    cornerOffsets.forEach(([ox, oz]) => {
      const tipGeo = new THREE.ConeGeometry(0.12, 0.65, 4);
      const tip = new THREE.Mesh(tipGeo, goldMat);
      tip.position.set(ox, 0.15, oz);
      tip.rotation.set(-oz * 0.25, 0, ox * 0.25);
      lowerRoofGroup.add(tip);
    });

    pavilion.add(lowerRoofGroup);

    // Upper Grand Peak Tier
    const upperRoofGroup = new THREE.Group();
    upperRoofGroup.position.y = roofY + 0.75;

    const upperRoofGeo = new THREE.ConeGeometry(width * 0.65, 0.95, 4, 1);
    const upperRoof = new THREE.Mesh(upperRoofGeo, tileMat);
    upperRoof.rotation.y = Math.PI / 4;
    upperRoof.scale.set(1.15, 0.6, 1.0);
    upperRoof.castShadow = true;
    upperRoofGroup.add(upperRoof);

    // Gilded Celestial Finial (Bảo đính hồ lô hoàng kim trên đỉnh nóc)
    const gourdLower = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), goldMat);
    gourdLower.position.y = 0.65;
    upperRoofGroup.add(gourdLower);

    const gourdUpper = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), goldMat);
    gourdUpper.position.y = 0.95;
    upperRoofGroup.add(gourdUpper);

    pavilion.add(upperRoofGroup);

    // 7. Hanging Ornate Hexagonal Lanterns (Lồng đèn lục giác)
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 1.2,
      roughness: 0.3,
    });

    const lanternL = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.35, 6), lanternMat);
    lanternL.position.set(-width / 2 + 0.4, roofY - 0.25, depth / 2 + 0.2);
    pavilion.add(lanternL);

    const lanternR = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.35, 6), lanternMat);
    lanternR.position.set(width / 2 - 0.4, roofY - 0.25, depth / 2 + 0.2);
    pavilion.add(lanternR);

    // Porch Medicine Drying Baskets (Khay sấy dược liệu)
    const tableGeo = new THREE.BoxGeometry(1.2, 0.45, 0.6);
    const table = new THREE.Mesh(tableGeo, woodMat);
    table.position.set(-width / 2 + 1.2, 0.55 + 0.225, depth / 2 - 0.3);
    pavilion.add(table);

    const basketGeo = new THREE.CylinderGeometry(0.24, 0.22, 0.08, 12);
    const basketMat = XianxiaMaterials.createFoliageMaterial('#059669');
    const basket = new THREE.Mesh(basketGeo, basketMat);
    basket.position.set(-width / 2 + 1.2, 0.55 + 0.5, depth / 2 - 0.3);
    pavilion.add(basket);

    return pavilion;
  }

  /**
   * Create Sculpted Stone Arch Bridge (Thanh Khê Thạch Kiều)
   */
  public static createStoneBridge(length: number = 7.5, width: number = 3.2): THREE.Group {
    const bridge = new THREE.Group();
    bridge.name = 'ThanhKheStoneBridge';
    const stoneMat = XianxiaMaterials.createStoneRockMaterial();

    // Curved Arch Deck
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-length / 2, 0.1, 0),
      new THREE.Vector3(0, 1.25, 0),
      new THREE.Vector3(length / 2, 0.1, 0)
    );

    const points = curve.getPoints(20);
    const shape = new THREE.Shape();
    shape.moveTo(-width / 2, -0.2);
    shape.lineTo(width / 2, -0.2);
    shape.lineTo(width / 2, 0.2);
    shape.lineTo(-width / 2, 0.2);
    shape.closePath();

    // Custom arched bridge geometry
    const bridgeGeo = new THREE.BoxGeometry(length, 0.4, width);
    const bridgeDeck = new THREE.Mesh(bridgeGeo, stoneMat);
    bridgeDeck.position.y = 0.75;
    bridgeDeck.receiveShadow = true;
    bridgeDeck.castShadow = true;
    bridge.add(bridgeDeck);

    // Arch underpass cutout / piers
    const pierL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, width + 0.2), stoneMat);
    pierL.position.set(-length * 0.35, 0.4, 0);
    bridge.add(pierL);

    const pierR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, width + 0.2), stoneMat);
    pierR.position.set(length * 0.35, 0.4, 0);
    bridge.add(pierR);

    // Carved Railings & Lion/Lotus Post Heads
    const railGeo = new THREE.BoxGeometry(length, 0.1, 0.12);
    const railFront = new THREE.Mesh(railGeo, stoneMat);
    railFront.position.set(0, 1.35, width / 2 - 0.1);
    bridge.add(railFront);

    const railBack = new THREE.Mesh(railGeo, stoneMat);
    railBack.position.set(0, 1.35, -width / 2 + 0.1);
    bridge.add(railBack);

    // Balusters along bridge
    for (let i = -3; i <= 3; i++) {
      const bx = i * 1.1;
      const bPostF = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), stoneMat);
      bPostF.position.set(bx, 1.15, width / 2 - 0.1);
      bridge.add(bPostF);

      const bPostB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.55, 0.14), stoneMat);
      bPostB.position.set(bx, 1.15, -width / 2 + 0.1);
      bridge.add(bPostB);
    }

    return bridge;
  }

  /**
   * Create Sculpted Bamboo Grove (Trúc Lâm Tiên Cảnh)
   * Natural segmented culms + delicate green foliage fans
   */
  public static createBambooGrove(count: number = 7, radius: number = 2.0): THREE.Group {
    const grove = new THREE.Group();
    grove.name = 'BambooGrove';

    const bambooStalkMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      roughness: 0.45,
      metalness: 0.08,
    });
    const bambooLeafMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < count; i++) {
      const stalk = new THREE.Group();
      const a = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.5;
      const r = Math.random() * radius;
      stalk.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);

      const height = 4.2 + Math.random() * 2.2;
      const segments = 6;
      const segH = height / segments;

      // Bamboo culm segments with rings
      for (let s = 0; s < segments; s++) {
        const segGeo = new THREE.CylinderGeometry(0.045, 0.055, segH * 0.96, 6);
        const segMesh = new THREE.Mesh(segGeo, bambooStalkMat);
        segMesh.position.y = s * segH + segH / 2;
        segMesh.castShadow = true;
        stalk.add(segMesh);

        // Bamboo node ring (Đốt trúc)
        const ringGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.04, 6);
        const ring = new THREE.Mesh(ringGeo, bambooStalkMat);
        ring.position.y = s * segH;
        stalk.add(ring);

        // Drooping leaf clusters at upper nodes
        if (s >= 3) {
          for (let l = 0; l < 3; l++) {
            const leafFanGeo = new THREE.PlaneGeometry(0.45, 0.12);
            const leafFan = new THREE.Mesh(leafFanGeo, bambooLeafMat);
            const leafAngle = l * ((Math.PI * 2) / 3) + s;
            leafFan.position.set(Math.cos(leafAngle) * 0.18, s * segH, Math.sin(leafAngle) * 0.18);
            leafFan.rotation.set(0.35, leafAngle, -0.4);
            stalk.add(leafFan);
          }
        }
      }

      // Slight natural wind bend
      stalk.rotation.set((Math.random() - 0.5) * 0.12, 0, (Math.random() - 0.5) * 0.12);
      grove.add(stalk);
    }

    return grove;
  }

  /**
   * Create Twisted Ancient Pine (Thanh Khê Cổ Tùng)
   * Organic winding trunk with layered cascading pine needles
   */
  public static createAncientPine(height: number = 5.2): THREE.Group {
    const tree = new THREE.Group();
    tree.name = 'ThanhKheAncientPine';

    const woodMat = XianxiaMaterials.createPavilionWoodMaterial();
    const foliageMat = XianxiaMaterials.createFoliageMaterial('#047857');

    // 1. Gnarled Twisted Trunk
    const trunkBase = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.55, height * 0.45, 8), woodMat);
    trunkBase.position.y = (height * 0.45) / 2;
    trunkBase.rotation.z = 0.12;
    trunkBase.castShadow = true;
    tree.add(trunkBase);

    // Organic S-curved Upper Trunk
    const trunkMid = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, height * 0.35, 7), woodMat);
    trunkMid.position.set(0.25, height * 0.45 + 0.3, 0);
    trunkMid.rotation.set(-0.2, 0, -0.35);
    trunkMid.castShadow = true;
    tree.add(trunkMid);

    // Large horizontal bough
    const bough = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, height * 0.4, 6), woodMat);
    bough.position.set(-0.55, height * 0.65, 0.2);
    bough.rotation.set(0.3, 0, 1.1);
    bough.castShadow = true;
    tree.add(bough);

    // 2. Layered Tiered Pine Needle Canopies (Phiến mây tùng diệp)
    const tiers = [
      { x: -1.2, y: height * 0.72, z: 0.3, r: 1.45 },
      { x: 0.8, y: height * 0.85, z: -0.4, r: 1.35 },
      { x: 0.1, y: height * 1.05, z: 0.1, r: 1.65 },
      { x: -0.4, y: height * 0.92, z: -0.6, r: 1.15 },
    ];

    tiers.forEach(t => {
      // Flattened disc-like cloud foliage
      const needleDisc = new THREE.Mesh(new THREE.CylinderGeometry(t.r * 0.85, t.r, 0.35, 8), foliageMat);
      needleDisc.position.set(t.x, t.y, t.z);
      needleDisc.castShadow = true;
      needleDisc.receiveShadow = true;
      tree.add(needleDisc);

      const needleDome = new THREE.Mesh(new THREE.ConeGeometry(t.r * 0.85, 0.45, 8), foliageMat);
      needleDome.position.set(t.x, t.y + 0.35, t.z);
      tree.add(needleDome);
    });

    return tree;
  }

  /**
   * Create Traditional Hexagonal Stone Garden Lantern (Thạch Đăng Lung)
   */
  public static createStoneLantern(): THREE.Group {
    const lantern = new THREE.Group();
    lantern.name = 'StoneLantern';
    const stoneMat = XianxiaMaterials.createStoneRockMaterial();

    // Base pedestal
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 0.2, 6), stoneMat);
    base.position.y = 0.1;
    lantern.add(base);

    // Pillar shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.65, 6), stoneMat);
    shaft.position.y = 0.525;
    lantern.add(shaft);

    // Fire chamber (Lồng đèn phát sáng)
    const chamberMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfbbf24,
      emissiveIntensity: 1.4,
    });
    const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.28, 6), chamberMat);
    chamber.position.y = 0.95;
    lantern.add(chamber);

    // Pagoda roof cap
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.25, 6), stoneMat);
    roof.position.y = 1.2;
    lantern.add(roof);

    // Jewel finial
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), XianxiaMaterials.createGoldMaterial());
    finial.position.y = 1.36;
    lantern.add(finial);

    return lantern;
  }

  /**
   * Create Weathered Boulder / River Rock (Kỳ Thạch Tiên Giới)
   * Multi-faceted polygonal rock with varied slope and moss accents
   */
  public static createRock(scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.name = 'XianxiaRock';
    const rockMat = XianxiaMaterials.createStoneRockMaterial();

    const geo = new THREE.DodecahedronGeometry(scale, 1);
    // Displace vertices slightly for organic weathering
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const noise = 1.0 + Math.sin(vx * 3 + vy * 2) * 0.12;
      pos.setXYZ(i, vx * noise, vy * 0.85 * noise, vz * noise);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, rockMat);
    mesh.position.y = scale * 0.65;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return group;
  }

  /**
   * Create Glowing Spirit Herb (Linh Dược Phát Quang)
   */
  public static createSpiritHerb(colorHex: string = '#34d399'): THREE.Group {
    const herb = new THREE.Group();
    herb.name = 'SpiritHerb';

    const stemMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.6 });
    const flowerMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      emissive: new THREE.Color(colorHex),
      emissiveIntensity: 0.8,
      roughness: 0.25,
    });

    // Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.45, 6), stemMat);
    stem.position.y = 0.225;
    herb.add(stem);

    // Glowing Blossoms
    for (let i = 0; i < 4; i++) {
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), flowerMat);
      const a = (i * Math.PI * 2) / 4;
      petal.position.set(Math.cos(a) * 0.08, 0.42, Math.sin(a) * 0.08);
      herb.add(petal);
    }

    const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), flowerMat);
    core.position.y = 0.45;
    herb.add(core);

    return herb;
  }
}

