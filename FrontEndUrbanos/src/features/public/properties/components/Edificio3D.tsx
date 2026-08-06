import { useEffect, useRef } from 'react'

/**
 * Edificio 3D renderizado con Three.js cargado via CDN (sin npm install).
 * Construye un edificio de apartamentos moderno con geometrías puras:
 * torre principal, balcones, ventanas, vegetación y suelo.
 * Animación 100% automática: rota sobre su eje vertical y flota ligeramente
 * en vertical, sin responder al cursor.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type THREE = any

declare global {
  interface Window { __THREE__: THREE }
}

function loadThree(): Promise<THREE> {
  return new Promise((resolve, reject) => {
    if (window.__THREE__) { resolve(window.__THREE__); return }
    const s = document.createElement('script')
    s.type = 'module'
    s.textContent = `
      import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
      window.__THREE__ = THREE;
      window.dispatchEvent(new Event('three-loaded'));
    `
    document.head.appendChild(s)
    window.addEventListener('three-loaded', () => resolve(window.__THREE__), { once: true })
    s.onerror = reject
  })
}

function buildScene(THREE: THREE, canvas: HTMLCanvasElement) {
  const W = canvas.clientWidth
  const H = canvas.clientHeight

  /* ── Renderer ─────────────────────────────────────────────────── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  /* ── Escena ───────────────────────────────────────────────────── */
  const scene = new THREE.Scene()
  scene.background = null // transparente — el fondo lo pone el CSS

  /* ── Cámara ───────────────────────────────────────────────────── */
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 200)
  camera.position.set(14, 10, 18)
  camera.lookAt(0, 4, 0)

  /* ── Luces ────────────────────────────────────────────────────── */
  const ambient = new THREE.AmbientLight(0xfdf6ed, 0.7)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight(0xfff5e0, 2.2)
  sun.position.set(12, 20, 10)
  sun.castShadow = true
  sun.shadow.mapSize.setScalar(1024)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 60
  sun.shadow.camera.left = -15
  sun.shadow.camera.right = 15
  sun.shadow.camera.top = 20
  sun.shadow.camera.bottom = -5
  scene.add(sun)

  const fill = new THREE.DirectionalLight(0xd4e8ff, 0.5)
  fill.position.set(-8, 6, -6)
  scene.add(fill)

  /* ── Materiales ───────────────────────────────────────────────── */
  const matFachada = new THREE.MeshStandardMaterial({ color: 0xf5ede0, roughness: 0.85, metalness: 0.02 })
  const matLosa    = new THREE.MeshStandardMaterial({ color: 0xe8ddd0, roughness: 0.9,  metalness: 0.0  })
  const matVentana = new THREE.MeshStandardMaterial({ color: 0x9ab8c8, roughness: 0.1,  metalness: 0.5, transparent: true, opacity: 0.75 })
  const matMarco   = new THREE.MeshStandardMaterial({ color: 0xd4c4a8, roughness: 0.6,  metalness: 0.1  })
  const matSuelo   = new THREE.MeshStandardMaterial({ color: 0xd8cfc4, roughness: 1.0,  metalness: 0.0  })
  const matArbol   = new THREE.MeshStandardMaterial({ color: 0x7a9e6e, roughness: 1.0,  metalness: 0.0  })
  const matTronco  = new THREE.MeshStandardMaterial({ color: 0x8b6f4e, roughness: 1.0,  metalness: 0.0  })
  const matAccento = new THREE.MeshStandardMaterial({ color: 0x8b6f4e, roughness: 0.7,  metalness: 0.2  })

  const grupo = new THREE.Group()
  scene.add(grupo)

  /* ── Helpers ──────────────────────────────────────────────────── */
  function box(w: number, h: number, d: number, mat: any, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    m.position.set(x, y, z)
    m.castShadow = true
    m.receiveShadow = true
    return m
  }

  /* ── Suelo / plataforma ───────────────────────────────────────── */
  const suelo = box(24, 0.3, 16, matSuelo, 0, -0.15, 0)
  suelo.receiveShadow = true
  grupo.add(suelo)

  // Acera perimetral
  const acera = box(22, 0.12, 14, matLosa, 0, 0.06, 0)
  acera.receiveShadow = true
  grupo.add(acera)

  /* ── TORRE PRINCIPAL (edificio de 8 pisos) ────────────────────── */
  const PISOS = 8
  const ANCHO = 5.5
  const FONDO = 3.2
  const ALTO_PISO = 1.1

  // Cuerpo base
  const torre = box(ANCHO, PISOS * ALTO_PISO, FONDO, matFachada, 0, (PISOS * ALTO_PISO) / 2, 0)
  grupo.add(torre)

  // Losas entre pisos
  for (let i = 1; i <= PISOS; i++) {
    const losa = box(ANCHO + 0.15, 0.1, FONDO + 0.15, matLosa, 0, i * ALTO_PISO, 0)
    grupo.add(losa)
  }

  // Ventanas por piso — 3 columnas x 8 pisos
  const colsVentana = [-1.5, 0, 1.5]
  for (let piso = 0; piso < PISOS; piso++) {
    const y = piso * ALTO_PISO + ALTO_PISO * 0.5 + 0.15
    for (const cx of colsVentana) {
      // Ventana frontal
      const v = box(0.65, 0.7, 0.06, matVentana, cx, y, FONDO / 2 + 0.04)
      const marco = box(0.78, 0.82, 0.04, matMarco, cx, y, FONDO / 2 + 0.02)
      grupo.add(marco, v)
    }
    // Ventanas laterales (2 por piso)
    for (const cz of [-0.8, 0.8]) {
      const vl = box(0.06, 0.7, 0.65, matVentana, ANCHO / 2 + 0.04, y, cz)
      grupo.add(vl)
    }
  }

  // Balcones — pisos pares (excepto planta baja)
  for (let piso = 1; piso < PISOS; piso += 2) {
    const y = piso * ALTO_PISO + 0.05
    // Losa balcón
    const balcon = box(ANCHO + 0.6, 0.08, 0.7, matLosa, 0, y, FONDO / 2 + 0.35)
    // Barandilla
    const baranda = box(ANCHO + 0.6, 0.5, 0.04, matMarco, 0, y + 0.29, FONDO / 2 + 0.68)
    grupo.add(balcon, baranda)
  }

  // Remate superior / terraza
  const remate = box(ANCHO + 0.3, 0.35, FONDO + 0.3, matAccento, 0, PISOS * ALTO_PISO + 0.18, 0)
  grupo.add(remate)

  /* ── EDIFICIO LATERAL BAJO (4 pisos) ─────────────────────────── */
  const PISOS2 = 4
  const OFX = ANCHO / 2 + 2.4
  const torre2 = box(3.4, PISOS2 * ALTO_PISO, FONDO, matFachada, OFX, (PISOS2 * ALTO_PISO) / 2, 0.4)
  grupo.add(torre2)
  for (let i = 1; i <= PISOS2; i++) {
    grupo.add(box(3.55, 0.1, FONDO + 0.15, matLosa, OFX, i * ALTO_PISO, 0.4))
  }
  // Ventanas edificio lateral
  for (let piso = 0; piso < PISOS2; piso++) {
    const y = piso * ALTO_PISO + ALTO_PISO * 0.5 + 0.15
    for (const cx of [-0.85, 0.85]) {
      grupo.add(box(0.6, 0.65, 0.06, matVentana, OFX + cx, y, FONDO / 2 + 0.44))
    }
  }
  grupo.add(box(3.55, 0.3, FONDO + 0.3, matAccento, OFX, PISOS2 * ALTO_PISO + 0.15, 0.4))

  /* ── Edificio fondo izquierdo (más alto, detrás) ──────────────── */
  const torreFondo = box(3.0, 11 * 0.9, 2.4, matFachada, -5.5, (11 * 0.9) / 2, -2.5)
  torreFondo.material = new THREE.MeshStandardMaterial({ color: 0xece4d8, roughness: 0.9 })
  grupo.add(torreFondo)

  /* ── Árboles ──────────────────────────────────────────────────── */
  function arbol(x: number, z: number, escala = 1) {
    const g = new THREE.Group()
    const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.9 * escala, 6), matTronco)
    tronco.position.y = 0.45 * escala
    tronco.castShadow = true
    const copa1 = new THREE.Mesh(new THREE.SphereGeometry(0.55 * escala, 8, 6), matArbol)
    copa1.position.y = 1.15 * escala
    copa1.castShadow = true
    const copa2 = new THREE.Mesh(new THREE.SphereGeometry(0.4 * escala, 8, 6), matArbol)
    copa2.position.set(0.3 * escala, 1.4 * escala, 0.1 * escala)
    copa2.castShadow = true
    g.add(tronco, copa1, copa2)
    g.position.set(x, 0.12, z)
    return g
  }
  grupo.add(arbol(-4.5, 3.5, 1.1))
  grupo.add(arbol(-3.5, -4.5, 0.9))
  grupo.add(arbol(7.5, 4.5, 1.0))
  grupo.add(arbol(8.5, -3.5, 0.85))
  grupo.add(arbol(-6, -2, 1.2))

  /* ── Animación 100% automática (sin control de mouse) ─────────── */
  let autoAngle = 0
  const baseY = grupo.position.y

  /* ── Resize ───────────────────────────────────────────────────── */
  const ro = new ResizeObserver(() => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  })
  ro.observe(canvas)

  /* ── Loop ─────────────────────────────────────────────────────── */
  let frameId: number
  function animate() {
    frameId = requestAnimationFrame(animate)
    const t = performance.now() * 0.001
    autoAngle += 0.002
    grupo.rotation.y = autoAngle
    grupo.position.y = baseY + Math.sin(t * 0.6) * 0.12
    renderer.render(scene, camera)
  }
  animate()

  /* ── Cleanup ──────────────────────────────────────────────────── */
  return () => {
    cancelAnimationFrame(frameId)
    ro.disconnect()
    renderer.dispose()
    scene.clear()
  }
}

export function Edificio3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cleanup: (() => void) | undefined

    loadThree()
      .then((THREE) => { cleanup = buildScene(THREE, canvas) })
      .catch(console.error)

    return () => { cleanup?.() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: 'block' }}
      aria-label="Visualización 3D de edificio residencial"
    />
  )
}
