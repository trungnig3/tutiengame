import * as THREE from 'three';

// Detect software WebGL renderer (SwiftShader, llvmpipe, softpipe, WARP)
export const isSoftwareGl = (() => {
  if (typeof document === 'undefined') return false;
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return true;
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
  const gpu = String(gl.getParameter(param));
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
})();

/**
 * Procedural PBR Material & Texture Factory for Xianxia 2.5D Aesthetics
 * High-definition procedural textures (cobblestone, mossy soil, glazed roof tiles, ancient wood, water stream)
 */
export class XianxiaMaterials {
  private static textures: Map<string, THREE.Texture> = new Map();

  /**
   * Procedural Lush Mountain Grass & Soil Texture (Stylized Watercolor Wash)
   * Smooth, painterly gradients of jade moss and moist loam without noisy speckles.
   */
  public static getTerrainTexture(): THREE.CanvasTexture {
    const key = 'terrain_grass_soil';
    if (this.textures.has(key)) return this.textures.get(key) as THREE.CanvasTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Rich deep jade mossy soil base
    ctx.fillStyle = '#16432f';
    ctx.fillRect(0, 0, size, size);

    // Large painterly moss & mountain soil washes
    const washes = [
      { color: '#1e543b', count: 18, minR: 45, maxR: 90 },
      { color: '#276749', count: 14, minR: 35, maxR: 70 },
      { color: '#143826', count: 12, minR: 50, maxR: 110 },
      { color: '#2f855a', count: 10, minR: 25, maxR: 55 },
      { color: '#1a362b', count: 8, minR: 40, maxR: 80 },
    ];

    washes.forEach(w => {
      for (let i = 0; i < w.count; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = w.minR + Math.random() * (w.maxR - w.minR);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, w.color);
        grad.addColorStop(0.7, `${w.color}99`);
        grad.addColorStop(1, 'rgba(22, 67, 47, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Gentle soft luminous spirit patches (simulating ambient spiritual energy seeping from earth)
    for (let i = 0; i < 6; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 35 + Math.random() * 45;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(52, 211, 153, 0.14)');
      grad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.set(key, tex);
    return tex;
  }

  /**
   * Procedural Cobblestone Road Texture with weathered borders and mortar
   */
  public static getCobblestoneTexture(): THREE.CanvasTexture {
    const key = 'village_cobblestone';
    if (this.textures.has(key)) return this.textures.get(key) as THREE.CanvasTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Dark damp soil mortar base
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, size, size);

    // Stone flagstone bricks
    const rows = 12;
    const cols = 8;
    const h = size / rows;
    const w = size / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (w / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * w + offset + 4;
        const y = r * h + 4;
        const rw = w - 8;
        const rh = h - 8;

        // Slate variations
        const grad = ctx.createLinearGradient(x, y, x + rw, y + rh);
        const palette = (r * 3 + c * 7) % 4;
        if (palette === 0) {
          grad.addColorStop(0, '#64748b');
          grad.addColorStop(1, '#475569');
        } else if (palette === 1) {
          grad.addColorStop(0, '#52525b');
          grad.addColorStop(1, '#3f3f46');
        } else if (palette === 2) {
          grad.addColorStop(0, '#71717a');
          grad.addColorStop(1, '#52525b');
        } else {
          grad.addColorStop(0, '#5b6b7a');
          grad.addColorStop(1, '#404e5c');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, rw, rh, 5);
        ctx.fill();

        // Top stone highlight edge
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Subtle moss in cracks
        if ((r + c) % 5 === 0) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
          ctx.fillRect(x - 2, y + rh - 2, 8, 4);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.set(key, tex);
    return tex;
  }

  /**
   * Procedural Glazed Chinese Pagoda Ceramic Roof Tiles
   */
  public static getRoofTileTexture(emerald: boolean = true): THREE.CanvasTexture {
    const key = emerald ? 'roof_emerald' : 'roof_amber';
    if (this.textures.has(key)) return this.textures.get(key) as THREE.CanvasTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = emerald ? '#044e3b' : '#78350f';
    ctx.fillRect(0, 0, size, size);

    // Fluted cylindrical tiles
    const rows = 8;
    const cols = 8;
    const cw = size / cols;
    const rh = size / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * cw;
        const y = r * rh;
        const grad = ctx.createLinearGradient(x, y, x + cw, y);
        if (emerald) {
          grad.addColorStop(0, '#064e3b');
          grad.addColorStop(0.5, '#10b981');
          grad.addColorStop(1, '#022c22');
        } else {
          grad.addColorStop(0, '#92400e');
          grad.addColorStop(0.5, '#f59e0b');
          grad.addColorStop(1, '#451a03');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);

        // Tile rim cap
        ctx.fillStyle = emerald ? '#34d399' : '#fbbf24';
        ctx.beginPath();
        ctx.arc(x + cw / 2, y + rh - 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.set(key, tex);
    return tex;
  }

  /**
   * Procedural Lacquered Ancient Camphor Wood Texture
   */
  public static getLacqueredWoodTexture(): THREE.CanvasTexture {
    const key = 'lacquered_wood';
    if (this.textures.has(key)) return this.textures.get(key) as THREE.CanvasTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Rich mahogany vermilion wood base
    ctx.fillStyle = '#581c0c';
    ctx.fillRect(0, 0, size, size);

    // Wood grains
    for (let y = 0; y < size; y += 4) {
      ctx.strokeStyle = y % 12 === 0 ? '#380f06' : '#7c2d12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + Math.sin(y * 0.1) * 3, size * 0.7, y - Math.sin(y * 0.1) * 3, size, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textures.set(key, tex);
    return tex;
  }

  /**
   * Water Stream Caustics & Flow Surface Texture
   */
  public static getWaterStreamTexture(): THREE.CanvasTexture {
    const key = 'stream_water';
    if (this.textures.has(key)) return this.textures.get(key) as THREE.CanvasTexture;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep turquoise water base
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.5, '#06b6d4');
    grad.addColorStop(1, '#0369a1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Soft water caustics wave ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
      const y = (i * 12) % size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.25, y + 8, size * 0.75, y - 8, size, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textures.set(key, tex);
    return tex;
  }

  // Daoist Hanfu Robe Material (Layered Silk with gentle sheen)
  public static createHanfuRobeMaterial(color: string = '#f1f5f9'): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.65,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
  }

  // Inner Silk Undergarment
  public static createInnerRobeMaterial(color: string = '#0284c7'): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.6,
      metalness: 0.08,
    });
  }

  // Dark Raven Hair
  public static createHairMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#090d16'),
      roughness: 0.35,
      metalness: 0.25,
    });
  }

  // Character Skin Material (Stylized porcelain jade tone)
  public static createSkinMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffedd5'),
      roughness: 0.55,
      metalness: 0.0,
    });
  }

  // Forged Jian Steel Blade (High metalness, brushed silver with cyan edge radiance)
  public static createSteelBladeMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f0f9ff'),
      metalness: 0.94,
      roughness: 0.15,
      emissive: new THREE.Color('#0284c7'),
      emissiveIntensity: 0.3,
    });
  }

  // Ornate Ancient Gold (Sword guard, belt buckle, hair pin)
  public static createGoldMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'),
      metalness: 0.9,
      roughness: 0.2,
      emissive: new THREE.Color('#d97706'),
      emissiveIntensity: 0.2,
    });
  }

  // Pure Imperial Jade (Pendant, jade bagua ring)
  public static createJadeMaterial(emissive: boolean = true): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#34d399'),
      roughness: 0.2,
      metalness: 0.1,
      emissive: emissive ? new THREE.Color('#059669') : new THREE.Color('#000000'),
      emissiveIntensity: emissive ? 0.45 : 0.0,
      transparent: true,
      opacity: 0.92,
    });
  }

  // Demonic Beast Hide (Dark boar bristled armor plates)
  public static createBeastArmorMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1c1917'),
      roughness: 0.8,
      metalness: 0.25,
    });
  }

  // Demonic Wolf Fur (Charcoal wolf pelt with subtle slate-steel sheen)
  public static createWolfFurMaterial(colorHex: string = '#1e293b'): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.75,
      metalness: 0.12,
    });
  }

  // Glowing Demonic Eyes & Aura
  public static createDemonicGlowMaterial(color: string = '#ef4444'): THREE.MeshBasicMaterial {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
    });
  }

  // Ancient Chinese Pavilion Wood
  public static createPavilionWoodMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getLacqueredWoodTexture();
    tex.repeat.set(1, 2);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.6,
      metalness: 0.08,
    });
  }

  // Ancient Glazed Ceramic Roof Tiles
  public static createRoofTilesMaterial(emerald: boolean = true): THREE.MeshStandardMaterial {
    const tex = this.getRoofTileTexture(emerald);
    tex.repeat.set(2, 2);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.3,
      metalness: 0.35,
    });
  }

  // Natural River Rock / Boulder
  public static createStoneRockMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#64748b'),
      roughness: 0.88,
      metalness: 0.05,
      flatShading: true,
    });
  }

  // Stylized Xianxia Pine Foliage
  public static createFoliageMaterial(color: string = '#059669'): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.75,
      metalness: 0.05,
      flatShading: true,
    });
  }

  // Ground Grass / Soil
  public static createTerrainMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getTerrainTexture();
    tex.repeat.set(5, 5);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.9,
      metalness: 0.02,
    });
  }

  // Water Stream Material
  public static createWaterStreamMaterial(): THREE.MeshStandardMaterial {
    const tex = this.getWaterStreamTexture();
    tex.repeat.set(2, 8);
    return new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.85,
    });
  }
}
