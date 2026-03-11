import {
  Application,
  Graphics,
  Container,
  Text,
  TextStyle,
  FederatedPointerEvent,
} from "pixi.js";

const TIER_COLORS = [
  0x44aaff, 0x44ff88, 0xffcc44, 0xff44aa, 0xaa44ff, 0x44ffff,
];
const BG_COLOR = 0x0b0b14;

function hexToPixi(hex) {
  if (typeof hex === "number") return hex;
  return parseInt(hex.replace("#", ""), 16);
}

function getLayerColor(depth) {
  return TIER_COLORS[(depth - 1) % TIER_COLORS.length];
}

export class PixiRenderer {
  constructor() {
    this.app = null;
    this.worldContainer = null;
    this.shapesContainer = null;
    this.slotsContainer = null;
    this.zonesContainer = null;
    this.puzzlesContainer = null;
    this.flowContainer = null;
    this.uiContainer = null;
    this.coreContainer = null;

    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;
    this.isPanning = false;
    this.lastMouse = { x: 0, y: 0 };

    this.onCoreClick = null;
    this.onSlotClick = null;
    this.onShapeHover = null;
    this.onShapeLeave = null;

    this.particlePool = [];
    this.floatingTexts = [];
  }

  async init(canvas) {
    this.app = new Application();
    await this.app.init({
      canvas,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
      backgroundColor: BG_COLOR,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    this.worldContainer = new Container();
    this.app.stage.addChild(this.worldContainer);

    this.zonesContainer = new Container();
    this.puzzlesContainer = new Container();
    this.flowContainer = new Container();
    this.slotsContainer = new Container();
    this.shapesContainer = new Container();
    this.coreContainer = new Container();
    this.uiContainer = new Container();

    this.worldContainer.addChild(this.zonesContainer);
    this.worldContainer.addChild(this.puzzlesContainer);
    this.worldContainer.addChild(this.flowContainer);
    this.worldContainer.addChild(this.slotsContainer);
    this.worldContainer.addChild(this.shapesContainer);
    this.worldContainer.addChild(this.coreContainer);
    this.worldContainer.addChild(this.uiContainer);

    this.centerWorld();
    this.setupInteraction(canvas);

    return this;
  }

  centerWorld() {
    if (!this.app) return;
    const w = this.app.screen.width;
    const h = this.app.screen.height;
    this.worldContainer.x = w / 2 + this.panX * this.zoom;
    this.worldContainer.y = h / 2 + this.panY * this.zoom;
    this.worldContainer.scale.set(this.zoom);
  }

  setupInteraction(canvas) {
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(0.3, Math.min(5, this.zoom * factor));
        this.centerWorld();
      },
      { passive: false },
    );

    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        this.isPanning = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    });

    canvas.addEventListener("mousemove", (e) => {
      if (this.isPanning) {
        this.panX += (e.clientX - this.lastMouse.x) / this.zoom;
        this.panY += (e.clientY - this.lastMouse.y) / this.zoom;
        this.lastMouse = { x: e.clientX, y: e.clientY };
        this.centerWorld();
      }
    });

    canvas.addEventListener("mouseup", () => {
      this.isPanning = false;
    });
    canvas.addEventListener("mouseleave", () => {
      this.isPanning = false;
    });
  }

  resize(width, height) {
    if (this.app) {
      this.app.renderer.resize(width, height);
      this.centerWorld();
    }
  }

  renderFrame(state) {
    if (!this.app) return;
    this.renderZones(state.buffZones);
    this.renderPuzzles(state.puzzleSlots, state.solvedPuzzles, state.fogCells);
    this.renderConnections(state.connectionLines);
    this.renderSlots(state.openSlots, state.canAfford);
    this.renderShapes(state.geometry, state.buffZones);
    this.renderCore(state.coreVertices, state.coreEdgeMids);
    this.updateParticles();
  }

  renderZones(zones) {
    this.zonesContainer.removeChildren();
    for (const zone of zones) {
      const g = new Graphics();
      g.circle(zone.x, zone.y, zone.radius);
      g.fill({ color: hexToPixi(zone.color), alpha: 0.04 });
      g.stroke({ color: hexToPixi(zone.color), width: 0.5, alpha: 0.3 });
      this.zonesContainer.addChild(g);
    }
  }

  renderPuzzles(puzzleSlots, solvedPuzzles, fogCells) {
    this.puzzlesContainer.removeChildren();
    for (const ps of puzzleSlots) {
      const solved = solvedPuzzles.includes(ps.id);
      const color = solved ? 0x55ff99 : ps.isRare ? 0xff44aa : 0xffdd55;
      const g = new Graphics();
      g.circle(ps.x, ps.y, 12);
      g.fill({ color, alpha: 0.04 });
      g.stroke({ color, width: 1, alpha: solved ? 0.3 : 0.5 });
      this.puzzlesContainer.addChild(g);
    }
  }

  renderConnections(lines) {
    const g = this.flowContainer;
    g.removeChildren();
    const gfx = new Graphics();
    for (const cl of lines) {
      gfx.moveTo(cl.x1, cl.y1);
      gfx.lineTo(cl.x2, cl.y2);
      gfx.stroke({ color: hexToPixi(cl.color), width: 0.8, alpha: 0.2 });
    }
    g.addChild(gfx);
  }

  renderSlots(openSlots, canAfford) {
    this.slotsContainer.removeChildren();
    for (const slot of openSlots) {
      const g = new Graphics();
      const color = canAfford ? 0xffdd55 : 0x333344;
      const alpha = canAfford ? 0.25 : 0.15;

      const poly = slot.vertices.flatMap((v) => [v.x, v.y]);
      g.poly(poly, true);
      g.stroke({ color, width: 1, alpha });

      g.eventMode = "static";
      g.cursor = canAfford ? "pointer" : "not-allowed";
      g.on("pointerup", () => {
        if (this.onSlotClick && canAfford) {
          this.onSlotClick(slot);
        }
      });

      this.slotsContainer.addChild(g);
    }
  }

  renderShapes(geometry, buffZones) {
    this.shapesContainer.removeChildren();
    for (const geo of geometry) {
      if (geo.isCore) continue;
      const depth = geo.depth || 1;
      const color = getLayerColor(depth);

      const g = new Graphics();
      const poly = geo.vertices.flatMap((v) => [v.x, v.y]);
      g.poly(poly, true);
      g.fill({ color: BG_COLOR, alpha: 0.8 });
      g.stroke({ color, width: 1.8 });

      g.eventMode = "static";
      g.on("pointerenter", () => {
        if (this.onShapeHover) this.onShapeHover(geo);
      });
      g.on("pointerleave", () => {
        if (this.onShapeLeave) this.onShapeLeave();
      });

      this.shapesContainer.addChild(g);
    }
  }

  renderCore(vertices, edgeMids) {
    this.coreContainer.removeChildren();
    const g = new Graphics();

    const poly = vertices.flatMap((v) => [v.x, v.y]);
    g.poly(poly, true);
    g.fill({ color: BG_COLOR, alpha: 0.9 });
    g.stroke({ color: 0x55bbff, width: 2.5 });

    g.eventMode = "static";
    g.cursor = "pointer";
    g.on("pointerup", () => {
      if (this.onCoreClick) this.onCoreClick();
    });

    this.coreContainer.addChild(g);

    for (const em of edgeMids) {
      const line = new Graphics();
      line.moveTo(em.edgeX1, em.edgeY1);
      line.lineTo(em.edgeX2, em.edgeY2);
      line.stroke({ color: hexToPixi(em.color), width: 2, alpha: 0.3 });
      this.coreContainer.addChild(line);
    }
  }

  spawnClickParticles(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 1 + Math.random() * 2;
      this.particlePool.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 2,
        color: hexToPixi(color),
      });
    }
  }

  spawnFloatingText(x, y, text, color) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color: hexToPixi(color),
      life: 1.0,
      vy: -0.5,
    });
  }

  updateParticles() {
    for (const p of this.particlePool) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
    }
    this.particlePool = this.particlePool.filter((p) => p.life > 0);

    for (const ft of this.floatingTexts) {
      ft.y += ft.vy;
      ft.life -= 0.015;
    }
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }
  }
}
