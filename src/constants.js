export const MODEL_PATH = '/meshy.glb'

export const MODEL_ROTATION = [0, Math.PI / 2, 0]

export const CAMERA = {
  position: [3, 1.2, 3],
  fov: 50,
}

export const ORBIT_CONTROLS = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 1,
  maxDistance: 40,
}

export const WIND = {
  defaultSpeed: 1.5,
  direction: [0, 0, -1],
}

// Ellipsoid in world space after rotation:
//   bike length (1.91) → Z, height (1.17) → Y, width (0.62) → X
export const BIKE_ELLIPSOID = [0.4, 0.7, 1.1]

export const NUM_STREAMLINES = 280
export const TRAIL_LENGTH = 70

export const FLOW_RENDER = {
  pointSize: 11,
}

export const SPAWN = {
  xRange: [-1.0, 1.0],
  yRange: [-1.1, 1.1],
  zFront: 3,
  zBack: -3.5,
}
