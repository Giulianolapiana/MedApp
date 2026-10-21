import * as THREE from 'three';

/**
 * Escena 3D del hero: una semana de turnos hecha de cápsulas.
 * 7 columnas (días) × 6 filas (horarios). Aqua = libre, petróleo = ocupado,
 * ámbar = "tu turno". Las cápsulas se elevan cerca del puntero y al tocar
 * una libre, el turno ámbar se muda ahí.
 *
 * Un único InstancedMesh (un draw call). La escena se pausa fuera de pantalla
 * y respeta prefers-reduced-motion (render estático, sin bucle).
 */

export const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'] as const;
export const HORAS = ['08:30', '09:30', '10:30', '11:30', '16:00', '17:00'] as const;

const COLS = DIAS.length;
const ROWS = HORAS.length;
const COUNT = COLS * ROWS;
const STEP_X = 1.18;
const STEP_Y = 0.78;

type Estado = 'libre' | 'ocupado' | 'tuyo';

const COLOR = {
  libre: new THREE.Color('#2FBEA8'),
  libreHover: new THREE.Color('#A0E6D9'),
  ocupado: new THREE.Color('#1D5A63'),
  tuyo: new THREE.Color('#F4B740'),
};

export interface SlotSeleccionado {
  dia: (typeof DIAS)[number];
  hora: (typeof HORAS)[number];
}

interface Options {
  reducedMotion: boolean;
  onSelect?: (slot: SlotSeleccionado) => void;
}

// Patrón determinístico (sin Math.random) para que la escena sea estable entre renders.
function estadoInicial(col: number, row: number): Estado {
  if (col >= 5) return (col + row) % 3 === 0 ? 'libre' : 'ocupado'; // fin de semana: poco disponible
  const h = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
  return h - Math.floor(h) > 0.42 ? 'libre' : 'ocupado';
}

export class SlotWeekScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  private group = new THREE.Group();
  private mesh: THREE.InstancedMesh;
  private hitPlane: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointerNdc = new THREE.Vector2(10, 10);
  private pointerLocal = new THREE.Vector3(999, 999, 0);
  private parallax = new THREE.Vector2(0, 0);
  private dummy = new THREE.Object3D();
  private tmpColor = new THREE.Color();
  private estados: Estado[] = [];
  private influencia = new Float32Array(COUNT);
  private basePos: THREE.Vector3[] = [];
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private running = false;
  private hoveredLibre = false;

  private container: HTMLElement;
  private opts: Options;

  constructor(container: HTMLElement, opts: Options) {
    this.container = container;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'pan-y';
    container.appendChild(this.renderer.domElement);

    this.camera.position.set(0, 0, 13);

    // Luces: cielo aqua y suelo petróleo, más una key light para el brillo de las cápsulas.
    this.scene.add(new THREE.HemisphereLight(0xcff3ec, 0x072a30, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(3, 5, 7);
    this.scene.add(key);

    // Cápsula acostada sobre el eje X (CapsuleGeometry crece sobre Y).
    const geometry = new THREE.CapsuleGeometry(0.24, 0.62, 6, 18, 1);
    geometry.rotateZ(Math.PI / 2);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.04 });
    this.mesh = new THREE.InstancedMesh(geometry, material, COUNT);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      this.basePos.push(
        new THREE.Vector3((col - (COLS - 1) / 2) * STEP_X, ((ROWS - 1) / 2 - row) * STEP_Y, 0),
      );
      this.estados.push(estadoInicial(col, row));
      this.mesh.setColorAt(i, COLOR[this.estados[i]]);
    }
    // "Tu turno" de arranque: jueves 10:30
    this.estados[2 * COLS + 3] = 'tuyo';

    this.group.add(this.mesh);

    // Plano invisible para proyectar el puntero en coordenadas locales de la grilla.
    this.hitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(COLS * STEP_X * 2, ROWS * STEP_Y * 2),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.group.add(this.hitPlane);

    this.group.rotation.set(-0.42, 0.38, 0.06);
    this.scene.add(this.group);

    this.updateInstances(0, true);

    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('pointerleave', this.onPointerLeave);
    this.renderer.domElement.addEventListener('click', this.onClick);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) this.start();
      else this.stop();
    });
    this.intersectionObserver.observe(container);
  }

  private start() {
    if (this.running) return;
    this.running = true;
    if (this.opts.reducedMotion) {
      this.render();
      return;
    }
    this.renderer.setAnimationLoop(this.tick);
  }

  private stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  private resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = `${w}px`;
    this.renderer.domElement.style.height = `${h}px`;
    this.camera.aspect = w / h;
    // En lienzos angostos alejamos la cámara para que entre la semana completa.
    this.camera.position.z = Math.max(12, 19.5 / (w / h));
    this.camera.updateProjectionMatrix();
    if (!this.running || this.opts.reducedMotion) this.render();
  }

  private tick = (time: number) => {
    const t = time / 1000;
    // Parallax: la grilla gira levemente hacia el puntero.
    const targetY = 0.38 + this.parallax.x * 0.18;
    const targetX = -0.42 - this.parallax.y * 0.12;
    this.group.rotation.y += (targetY - this.group.rotation.y) * 0.06;
    this.group.rotation.x += (targetX - this.group.rotation.x) * 0.06;
    this.updateInstances(t, false);
    this.render();
  };

  private updateInstances(t: number, immediate: boolean) {
    const animado = !this.opts.reducedMotion;
    for (let i = 0; i < COUNT; i++) {
      const base = this.basePos[i];
      const estado = this.estados[i];
      const d = Math.hypot(base.x - this.pointerLocal.x, base.y - this.pointerLocal.y);
      const target = estado === 'ocupado' ? 0.25 * smoothstep(1.4, 0, d) : smoothstep(1.7, 0, d);
      this.influencia[i] = immediate ? target : this.influencia[i] + (target - this.influencia[i]) * 0.14;
      const k = this.influencia[i];

      const ola = animado ? Math.sin(t * 1.1 + base.x * 0.55 + base.y * 0.8) * 0.07 : 0;
      const pulso = estado === 'tuyo' && animado ? 0.06 * (1 + Math.sin(t * 3.2)) : 0;

      this.dummy.position.set(base.x, base.y, ola + k * 0.55 + (estado === 'tuyo' ? 0.28 : 0));
      this.dummy.rotation.set(0, k * 0.5, 0);
      this.dummy.scale.setScalar((estado === 'ocupado' ? 0.86 : 1) + k * 0.12 + pulso);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      if (estado === 'libre') {
        this.tmpColor.copy(COLOR.libre).lerp(COLOR.libreHover, k);
      } else {
        this.tmpColor.copy(COLOR[estado]);
      }
      this.mesh.setColorAt(i, this.tmpColor);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  private setPointer(e: PointerEvent | MouseEvent) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNdc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.parallax.copy(this.pointerNdc);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
  }

  private onPointerMove = (e: PointerEvent) => {
    this.setPointer(e);
    const hit = this.raycaster.intersectObject(this.hitPlane, false)[0];
    if (hit) {
      this.pointerLocal.copy(this.group.worldToLocal(hit.point.clone()));
    }
    const id = this.instanceUnderPointer();
    const sobreLibre = id !== null && this.estados[id] === 'libre';
    if (sobreLibre !== this.hoveredLibre) {
      this.hoveredLibre = sobreLibre;
      this.renderer.domElement.style.cursor = sobreLibre ? 'pointer' : 'default';
    }
    if (this.opts.reducedMotion) {
      this.updateInstances(0, true);
      this.render();
    }
  };

  private onPointerLeave = () => {
    this.pointerLocal.set(999, 999, 0);
    this.parallax.set(0, 0);
    if (this.opts.reducedMotion) {
      this.updateInstances(0, true);
      this.render();
    }
  };

  private instanceUnderPointer(): number | null {
    this.mesh.computeBoundingSphere();
    const hit = this.raycaster.intersectObject(this.mesh, false)[0];
    return hit?.instanceId ?? null;
  }

  private onClick = (e: MouseEvent) => {
    this.setPointer(e);
    const id = this.instanceUnderPointer();
    if (id === null || this.estados[id] !== 'libre') return;
    const anterior = this.estados.indexOf('tuyo');
    if (anterior >= 0) this.estados[anterior] = 'libre';
    this.estados[id] = 'tuyo';
    this.opts.onSelect?.({ dia: DIAS[id % COLS], hora: HORAS[Math.floor(id / COLS)] });
    if (this.opts.reducedMotion) {
      this.updateInstances(0, true);
      this.render();
    }
  };

  dispose() {
    this.stop();
    this.resizeObserver.disconnect();
    this.intersectionObserver.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('pointerleave', this.onPointerLeave);
    canvas.removeEventListener('click', this.onClick);
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
    this.mesh.dispose();
    this.hitPlane.geometry.dispose();
    (this.hitPlane.material as THREE.Material).dispose();
    this.renderer.dispose();
    canvas.remove();
  }
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}
