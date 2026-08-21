import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export const SHOWCASE_BG = '#0B0F15'
export const SHOWCASE_EXPOSURE = 1.22

/** Neutral product-showcase renderer settings. Call from Canvas onCreated or let ShowcaseLighting apply them. */
export function applyShowcaseRenderer(gl: THREE.WebGLRenderer): void {
  gl.toneMapping = THREE.ACESFilmicToneMapping
  gl.toneMappingExposure = SHOWCASE_EXPOSURE
  gl.outputColorSpace = THREE.SRGBColorSpace
  gl.setClearColor(SHOWCASE_BG)
}

/**
 * Studio environment for PBR: dark floor, brighter ceiling so dark metals
 * still pick up readable highlights. Not a second HDR asset.
 */
function makeStudioEnv(gl: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(gl)
  pmrem.compileEquirectangularShader()
  const envScene = new THREE.Scene()
  const geo = new THREE.SphereGeometry(6, 24, 16)
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      void main() {
        vec3 n = normalize(vPos);
        vec3 floorCol = vec3(0.07, 0.09, 0.12);
        vec3 zenith = vec3(0.62, 0.70, 0.82);
        vec3 horizon = vec3(0.28, 0.36, 0.46);
        float h = n.y;
        vec3 col = mix(floorCol, horizon, smoothstep(-0.55, 0.08, h));
        col = mix(col, zenith, smoothstep(0.08, 0.95, h));
        col += vec3(0.04, 0.09, 0.12) * smoothstep(0.2, 1.0, n.z);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  })
  envScene.add(new THREE.Mesh(geo, mat))
  const env = pmrem.fromScene(envScene, 0.04).texture
  geo.dispose()
  mat.dispose()
  pmrem.dispose()
  return env
}

/**
 * Shared three-point product lighting for every collectible viewer.
 * Directional lights (not spots) so tiny masks and large vehicles both read.
 */
export function ShowcaseLighting() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useLayoutEffect(() => {
    applyShowcaseRenderer(gl)
    const env = makeStudioEnv(gl)
    scene.environment = env
    if ('environmentIntensity' in scene) {
      scene.environmentIntensity = 1.2
    }
    return () => {
      scene.environment = null
      env.dispose()
    }
  }, [gl, scene])

  return (
    <>
      <color attach="background" args={[SHOWCASE_BG]} />
      <hemisphereLight args={['#e8f4ff', '#2a3344', 0.92]} />
      <ambientLight intensity={0.42} color="#dce7f4" />
      {/* Key — strong, almost white, slightly warm */}
      <directionalLight position={[3.2, 5.4, 3.4]} intensity={2.45} color="#fff6ea" />
      {/* Fill — cooler, lifts the shadow side without flattening */}
      <directionalLight position={[-4.0, 2.6, 1.8]} intensity={1.15} color="#c5daf2" />
      {/* Rim / back — silhouette and edge catch */}
      <directionalLight position={[-1.4, 3.2, -3.8]} intensity={1.55} color="#cfe9ff" />
      {/* Front wrap — keeps facing planes from going dead on mobile */}
      <directionalLight position={[0.2, 1.6, 4.4]} intensity={0.55} color="#ffffff" />
    </>
  )
}
