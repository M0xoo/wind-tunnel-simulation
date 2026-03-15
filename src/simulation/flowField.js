/**
 * Potential flow around multiple ellipsoidal bodies.
 *
 * Superposition of doublet perturbations from each body on top
 * of a uniform freestream in the -Z direction.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} speed     – freestream wind speed
 * @param {Array}  bodies    – [{center:[cx,cy,cz], radii:[rx,ry,rz]}, …]
 */
export function getFlowVelocity(x, y, z, speed, bodies) {
  // If particle is inside any body, push it outward from that body
  for (let b = 0; b < bodies.length; b++) {
    const { center, radii } = bodies[b]
    const px = (x - center[0]) / radii[0]
    const py = (y - center[1]) / radii[1]
    const pz = (z - center[2]) / radii[2]
    const r2 = px * px + py * py + pz * pz
    if (r2 < 1.02) {
      const r = Math.sqrt(r2) || 0.001
      const push = speed * 1.5
      return [(px / r) * push, (py / r) * push, (pz / r) * push]
    }
  }

  // Freestream
  let vx = 0
  let vy = 0
  let vz = -speed

  // Sum doublet perturbation from each body
  for (let b = 0; b < bodies.length; b++) {
    const { center, radii } = bodies[b]
    const px = (x - center[0]) / radii[0]
    const py = (y - center[1]) / radii[1]
    const pz = (z - center[2]) / radii[2]
    const r2 = px * px + py * py + pz * pz
    const r = Math.sqrt(r2)
    const r3 = r * r2
    const r5 = r3 * r2

    vx += (3 * speed * px * pz) / (2 * r5)
    vy += (3 * speed * py * pz) / (2 * r5)
    vz += speed * (-1 / (2 * r3) + (3 * pz * pz) / (2 * r5))
  }

  return [vx, vy, vz]
}

/**
 * Wake turbulence behind each body.
 */
export function addWakeTurbulence(vx, vy, vz, x, y, z, speed, bodies) {
  for (let b = 0; b < bodies.length; b++) {
    const { center, radii } = bodies[b]
    const rz = radii[2]
    if (z > center[2] - rz) continue

    const dx = (x - center[0]) / radii[0]
    const dy = (y - center[1]) / radii[1]
    const wakeDist = Math.sqrt(dx * dx + dy * dy)

    if (wakeDist < 2.0) {
      const factor = (1 - wakeDist / 2) * 0.15 * speed
      const p = (z - center[2]) * 6
      vx += Math.sin(p + y * 5) * factor
      vy += Math.cos(p + x * 7) * factor
      vz *= 0.92
    }
  }

  return [vx, vy, vz]
}

export function speed(vx, vy, vz) {
  return Math.sqrt(vx * vx + vy * vy + vz * vz)
}
