import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getFlowVelocity, addWakeTurbulence, speed as flowSpeed } from '../simulation/flowField'
import { NUM_STREAMLINES, TRAIL_LENGTH, SPAWN } from '../constants'

const SEGS_PER_LINE = TRAIL_LENGTH - 1
const VERT_COUNT = NUM_STREAMLINES * SEGS_PER_LINE * 2

function sampleSeed(seed, i) {
  const o = i * 3
  return [seed[o], seed[o + 1], seed[o + 2]]
}

export default function WindParticles({ windSpeed = 1.5, visible = true, bodies = [] }) {
  const groupRef = useRef()
  const linesRef = useRef()
  const bodiesRef = useRef(bodies)
  bodiesRef.current = bodies

  const state = useMemo(() => {
    const seed = new Float32Array(NUM_STREAMLINES * 3)
    const posArr = new Float32Array(VERT_COUNT * 3)
    const colArr = new Float32Array(VERT_COUNT * 3)
    const phase = new Float32Array(NUM_STREAMLINES)
    for (let i = 0; i < NUM_STREAMLINES; i++) {
      const o = i * 3
      seed[o] = SPAWN.xRange[0] + Math.random() * (SPAWN.xRange[1] - SPAWN.xRange[0])
      seed[o + 1] = SPAWN.yRange[0] + Math.random() * (SPAWN.yRange[1] - SPAWN.yRange[0])
      seed[o + 2] = Math.random() * Math.PI * 2
      phase[i] = Math.random() * Math.PI * 2
    }
    return { seed, phase, posArr, colArr }
  }, [])

  useEffect(() => {
    const { posArr, colArr } = state
    const geom = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(posArr, 3)
    posAttr.setUsage(THREE.DynamicDrawUsage)
    const colAttr = new THREE.BufferAttribute(colArr, 3)
    colAttr.setUsage(THREE.DynamicDrawUsage)
    geom.setAttribute('position', posAttr)
    geom.setAttribute('color', colAttr)

    const mat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.82,
      toneMapped: false,
      blending: THREE.NormalBlending,
    })
    const lines = new THREE.LineSegments(geom, mat)
    linesRef.current = lines
    groupRef.current.add(lines)

    return () => {
      groupRef.current?.remove(lines)
      geom.dispose()
      mat.dispose()
    }
  }, [state])

  useFrame(({ clock }) => {
    const lines = linesRef.current
    if (!lines) return
    lines.visible = visible
    if (!visible) return

    const t = clock.elapsedTime
    const curBodies = bodiesRef.current
    const { seed, phase, posArr, colArr } = state

    let minBodyZ = 0
    for (let b = 0; b < curBodies.length; b++) {
      if (curBodies[b].center[2] < minBodyZ) minBodyZ = curBodies[b].center[2]
    }
    const zBack = Math.min(SPAWN.zBack, minBodyZ - 2.5)
    const zLen = SPAWN.zFront - zBack

    for (let i = 0; i < NUM_STREAMLINES; i++) {
      const [sx, sy, sway] = sampleSeed(seed, i)
      const ph = phase[i]

      // Slow lateral drift creates moving fluid feel without visible respawn cuts.
      let x = sx + Math.sin(t * 0.35 + ph) * 0.18
      let y = sy + Math.cos(t * 0.31 + ph * 1.7) * 0.15
      let z = SPAWN.zFront - ((t * windSpeed * 0.7 + ph * 0.9) % zLen)

      let prevX = x
      let prevY = y
      let prevZ = z

      for (let j = 0; j < SEGS_PER_LINE; j++) {
        let [vx, vy, vz] = getFlowVelocity(x, y, z, windSpeed, curBodies)
        ;[vx, vy, vz] = addWakeTurbulence(vx, vy, vz, x, y, z, windSpeed, curBodies)

        // Integrate along local velocity for long continuous stream tubes.
        const mag = Math.max(0.0001, Math.sqrt(vx * vx + vy * vy + vz * vz))
        const ds = 0.11
        x += (vx / mag) * ds
        y += (vy / mag) * ds
        z += (vz / mag) * ds

        // Keep streamline outside bike bodies.
        for (let b = 0; b < curBodies.length; b++) {
          const { center, radii } = curBodies[b]
          const ex = (x - center[0]) / radii[0]
          const ey = (y - center[1]) / radii[1]
          const ez = (z - center[2]) / radii[2]
          const ed = Math.sqrt(ex * ex + ey * ey + ez * ez)
          if (ed < 1.0 && ed > 0.001) {
            const s = 1.02 / ed
            x = center[0] + ex * s * radii[0]
            y = center[1] + ey * s * radii[1]
            z = center[2] + ez * s * radii[2]
            break
          }
        }

        const so = (i * SEGS_PER_LINE + j) * 6
        posArr[so] = prevX
        posArr[so + 1] = prevY
        posArr[so + 2] = prevZ
        posArr[so + 3] = x
        posArr[so + 4] = y
        posArr[so + 5] = z

        const spd = flowSpeed(vx, vy, vz)
        const minSpd = windSpeed * 0.2
        const maxSpd = windSpeed * 1.4
        const r = THREE.MathUtils.clamp((spd - minSpd) / (maxSpd - minSpd), 0, 1)

        // Low speed (draft) => green, high speed => red.
        let cr
        let cg
        let cb
        if (r < 0.55) {
          const k = r / 0.55
          cr = THREE.MathUtils.lerp(0.10, 0.96, k)
          cg = THREE.MathUtils.lerp(0.82, 0.88, k)
          cb = THREE.MathUtils.lerp(0.26, 0.18, k)
        } else {
          const k = (r - 0.55) / 0.45
          cr = THREE.MathUtils.lerp(0.96, 0.94, k)
          cg = THREE.MathUtils.lerp(0.88, 0.22, k)
          cb = THREE.MathUtils.lerp(0.18, 0.14, k)
        }

        colArr[so] = cr
        colArr[so + 1] = cg
        colArr[so + 2] = cb
        colArr[so + 3] = cr
        colArr[so + 4] = cg
        colArr[so + 5] = cb

        prevX = x
        prevY = y
        prevZ = z
      }
    }

    lines.geometry.attributes.position.needsUpdate = true
    lines.geometry.attributes.color.needsUpdate = true
  })

  return <group ref={groupRef} />
}
