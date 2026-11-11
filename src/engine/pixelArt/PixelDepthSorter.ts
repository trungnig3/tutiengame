/**
 * PIXEL DEPTH SORTER (PHÀM TRẦN TIÊN LỘ)
 * Multi-layer rendering engine with feetY depth sorting.
 * Adheres to the 7-layer visual architecture defined in ART_BIBLE.md.
 */

export interface RenderableCommand {
  layer: number; // 0..6
  sortY: number; // Feet Y coordinate for Layer 2 Y-sorting
  render: (ctx: CanvasRenderingContext2D) => void;
}

export class PixelDepthSorter {
  // Buckets for layers:
  // Layer 0: Ground / Water
  // Layer 1: Paths / Bridges / Decals
  // Layer 2: Y-Sorted Entities (Player, Enemies, NPCs, Tree trunks, Building walls)
  // Layer 3: Overhead Eaves & Tree Canopies
  // Layer 4: Spell & Combat VFX
  // Layer 5: Screen lighting & Weather
  // Layer 6: UI / Debug
  private layer0Commands: RenderableCommand[] = [];
  private layer1Commands: RenderableCommand[] = [];
  private layer2Commands: RenderableCommand[] = [];
  private layer3Commands: RenderableCommand[] = [];
  private layer4Commands: RenderableCommand[] = [];
  private layer5Commands: RenderableCommand[] = [];
  private layer6Commands: RenderableCommand[] = [];

  private visibleSpriteCount = 0;

  public clear(): void {
    this.layer0Commands.length = 0;
    this.layer1Commands.length = 0;
    this.layer2Commands.length = 0;
    this.layer3Commands.length = 0;
    this.layer4Commands.length = 0;
    this.layer5Commands.length = 0;
    this.layer6Commands.length = 0;
    this.visibleSpriteCount = 0;
  }

  public submit(command: RenderableCommand): void {
    this.visibleSpriteCount++;
    switch (command.layer) {
      case 0:
        this.layer0Commands.push(command);
        break;
      case 1:
        this.layer1Commands.push(command);
        break;
      case 2:
        this.layer2Commands.push(command);
        break;
      case 3:
        this.layer3Commands.push(command);
        break;
      case 4:
        this.layer4Commands.push(command);
        break;
      case 5:
        this.layer5Commands.push(command);
        break;
      case 6:
      default:
        this.layer6Commands.push(command);
        break;
    }
  }

  /**
   * Render all layers in strict order, with Layer 2 sorted by sortY (feetY)
   */
  public flush(ctx: CanvasRenderingContext2D): void {
    // 1. Layer 0: Ground tiles & water
    for (let i = 0; i < this.layer0Commands.length; i++) {
      this.layer0Commands[i].render(ctx);
    }

    // 2. Layer 1: Bridges & ground decals
    for (let i = 0; i < this.layer1Commands.length; i++) {
      this.layer1Commands[i].render(ctx);
    }

    // 3. Layer 2: Y-Sorted Entities (sorted ascending by sortY)
    this.layer2Commands.sort((a, b) => a.sortY - b.sortY);
    for (let i = 0; i < this.layer2Commands.length; i++) {
      this.layer2Commands[i].render(ctx);
    }

    // 4. Layer 3: Overhead canopies & roof eaves
    for (let i = 0; i < this.layer3Commands.length; i++) {
      this.layer3Commands[i].render(ctx);
    }

    // 5. Layer 4: Combat VFX & Spell particles
    for (let i = 0; i < this.layer4Commands.length; i++) {
      this.layer4Commands[i].render(ctx);
    }

    // 6. Layer 5: Lighting tint
    for (let i = 0; i < this.layer5Commands.length; i++) {
      this.layer5Commands[i].render(ctx);
    }

    // 7. Layer 6: UI & Overlays
    for (let i = 0; i < this.layer6Commands.length; i++) {
      this.layer6Commands[i].render(ctx);
    }
  }

  public getVisibleSpriteCount(): number {
    return this.visibleSpriteCount;
  }
}

export const pixelDepthSorter = new PixelDepthSorter();
