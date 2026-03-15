import { Suspense, useState, useMemo, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import Model from './components/Model'
import Loader from './components/Loader'
import Lighting from './components/Lighting'
import WindParticles from './components/WindParticles'
import ControlPanel from './components/ControlPanel'
import { CAMERA, ORBIT_CONTROLS, WIND, BIKE_ELLIPSOID } from './constants'
import { getFlowVelocity, addWakeTurbulence } from './simulation/flowField'

const SIM_TO_KMH = 20
const KMH_TO_SIM = 1 / SIM_TO_KMH
let nextId = 2

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

// Empirical drafting model anchored to on-track measurements:
// - ~50-55% drag reduction at 0.3 m wheel gap
// - ~45% at 0.7 m wheel gap
// (Sciacchitano et al., Ring of Fire, MDPI Proceedings 2020)
function dragReductionFromGap(gapMeters) {
  if (gapMeters <= 0.3) return 0.55
  if (gapMeters <= 0.7) {
    const t = (gapMeters - 0.3) / 0.4
    return 0.55 + (0.45 - 0.55) * t
  }
  if (gapMeters <= 2.0) {
    const t = (gapMeters - 0.7) / 1.3
    return 0.45 + (0.27 - 0.45) * t
  }
  if (gapMeters <= 8.0) {
    const t = (gapMeters - 2.0) / 6.0
    return 0.27 + (0.10 - 0.27) * t
  }
  return 0.10
}

export default function Scene() {
  const [windSpeedKmh, setWindSpeedKmh] = useState(WIND.defaultSpeed * SIM_TO_KMH)
  const [leadPowerWatts, setLeadPowerWatts] = useState(320)
  const [bikes, setBikes] = useState([{ id: 1, gapCm: 0 }])
  const [selectedBikeId, setSelectedBikeId] = useState(1)

  const windAngle = 0
  const windSpeedSim = windSpeedKmh * KMH_TO_SIM

  const bikePositions = useMemo(() => {
    const pos = [0]
    for (let i = 1; i < bikes.length; i++) pos.push(pos[i - 1] - bikes[i].gapCm / 100)
    return pos
  }, [bikes])

  const bodies = useMemo(
    () => bikePositions.map((z) => ({ center: [0, 0, z], radii: BIKE_ELLIPSOID })),
    [bikePositions],
  )

  const addBike = useCallback(() => {
    setBikes((prev) => [...prev, { id: nextId++, gapCm: 250 }])
  }, [])

  const removeBike = useCallback((id) => {
    setBikes((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const updateBikeGap = useCallback((id, gapCm) => {
    setBikes((prev) => prev.map((b) => (b.id === id ? { ...b, gapCm } : b)))
  }, [])

  useEffect(() => {
    if (!bikes.some((b) => b.id === selectedBikeId)) {
      setSelectedBikeId(bikes[0]?.id ?? 1)
    }
  }, [bikes, selectedBikeId])

  const savingsById = useMemo(() => {
    const result = {}
    // Aerodynamic share of power rises with speed.
    // ~40% around very low speeds to ~90% around race speeds.
    const aeroShare = clamp(0.4 + 0.5 * ((windSpeedKmh - 20) / 30), 0.4, 0.9)
    const leadAeroPower = leadPowerWatts * aeroShare

    for (let i = 0; i < bikes.length; i++) {
      const id = bikes[i].id
      if (i === 0) {
        result[id] = { savedWatts: 0, savedPct: 0, localKmh: windSpeedKmh }
        continue
      }

      // Baseline reduction from direct wheel gap to rider ahead
      const directGap = bikes[i].gapCm / 100
      let draftReduction = dragReductionFromGap(directGap)

      // Additional shelter from multiple riders ahead (diminishing returns)
      // capped to observed upper range in literature (~66%).
      const ridersAhead = i
      if (ridersAhead > 1) {
        draftReduction += 0.06 * (1 - Math.exp(-(ridersAhead - 1) * 0.8))
      }
      draftReduction = clamp(draftReduction, 0, 0.66)

      // Keep local flow readout from simulated field (visual consistency)
      const others = bodies.filter((_, idx) => idx !== i)
      let [vx, vy, vz] = getFlowVelocity(0, 0.45, bikePositions[i], windSpeedSim, others)
      ;[vx, vy, vz] = addWakeTurbulence(vx, vy, vz, 0, 0.45, bikePositions[i], windSpeedSim, others)
      const local = Math.sqrt(vx * vx + vy * vy + vz * vz)
      const localKmh = local * SIM_TO_KMH

      const savedWatts = leadAeroPower * draftReduction

      result[id] = {
        savedWatts,
        savedPct: draftReduction,
        localKmh,
      }
    }
    return result
  }, [bikes, bikePositions, bodies, windSpeedKmh, windSpeedSim, leadPowerWatts])

  return (
    <div className="scene-container">
      <Canvas camera={CAMERA} gl={{ antialias: true }}>
        <Lighting />
        <Suspense fallback={<Loader />}>
          <Model
            showPressure
            windAngle={windAngle}
            bikePositions={bikePositions}
            bikeIds={bikes.map((b) => b.id)}
            selectedBikeId={selectedBikeId}
            onSelectBike={setSelectedBikeId}
          />
          <WindParticles windSpeed={windSpeedSim} visible bodies={bodies} />
        </Suspense>
        <OrbitControls {...ORBIT_CONTROLS} />
      </Canvas>

      <ControlPanel
        windSpeedKmh={windSpeedKmh}
        setWindSpeedKmh={setWindSpeedKmh}
        leadPowerWatts={leadPowerWatts}
        setLeadPowerWatts={setLeadPowerWatts}
        bikes={bikes}
        addBike={addBike}
        removeBike={removeBike}
        updateBikeGap={updateBikeGap}
        selectedBikeId={selectedBikeId}
        selectBike={setSelectedBikeId}
        savingsById={savingsById}
      />
    </div>
  )
}
