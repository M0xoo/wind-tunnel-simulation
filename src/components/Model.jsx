import { useEffect, useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MODEL_PATH } from '../constants'

useGLTF.preload(MODEL_PATH)

function deepClone(scene) {
  const clone = scene.clone(true)
  clone.traverse((node) => {
    if (node.isMesh) {
      node.geometry = node.geometry.clone()
      node.material = node.material.clone()
    }
  })
  return clone
}

function BikeInstance({
  originalScene,
  bikeId,
  position,
  rotation,
  showPressure,
  modelWindDir,
  isSelected,
  onSelectBike,
}) {
  const myScene = useMemo(() => deepClone(originalScene), [originalScene])
  const originals = useRef(new Map())

  useEffect(() => {
    const n = new THREE.Vector3()
    const c = new THREE.Color()

    myScene.traverse((child) => {
      if (!child.isMesh) return

      if (!originals.current.has(child)) {
        originals.current.set(child, child.material)
      }

      if (!showPressure) {
        child.material = originals.current.get(child)
        if (child.geometry.attributes.color) child.geometry.deleteAttribute('color')
        return
      }

      const normals = child.geometry.attributes.normal
      if (!normals) return

      const count = normals.count
      const colors = new Float32Array(count * 3)

      for (let i = 0; i < count; i++) {
        n.fromBufferAttribute(normals, i)
        const cosAngle = -n.dot(modelWindDir)
        // 0 => sheltered / low resistance, 1 => facing wind / high resistance
        const resistance = Math.max(cosAngle, 0)

        // Color map: low resistance = green, medium = yellow, high = red
        if (resistance < 0.5) {
          c.lerpColors(
            new THREE.Color(0.08, 0.75, 0.25),
            new THREE.Color(0.95, 0.85, 0.15),
            resistance * 2,
          )
        } else {
          c.lerpColors(
            new THREE.Color(0.95, 0.85, 0.15),
            new THREE.Color(0.90, 0.15, 0.10),
            (resistance - 0.5) * 2,
          )
        }
        colors[i * 3] = c.r
        colors[i * 3 + 1] = c.g
        colors[i * 3 + 2] = c.b
      }

      child.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      child.material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.5,
        metalness: 0.1,
      })
    })
  }, [myScene, showPressure, modelWindDir])

  return (
    <group
      position={position}
      rotation={rotation}
      scale={isSelected ? 1.03 : 1}
      onClick={(e) => {
        e.stopPropagation()
        onSelectBike(bikeId)
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      <primitive object={myScene} />
    </group>
  )
}

export default function Model({
  showPressure = false,
  windAngle = 0,
  bikePositions = [0],
  bikeIds = [1],
  selectedBikeId = 1,
  onSelectBike = () => {},
}) {
  const { scene } = useGLTF(MODEL_PATH)
  const rotation = useMemo(() => {
    const baseYaw = 0
    return [0, baseYaw + windAngle, 0]
  }, [windAngle])
  const modelWindDir = useMemo(
    () => {
      const baseYaw = 0 // keep pressure coloring aligned with model yaw
      const totalYaw = baseYaw + windAngle
      return new THREE.Vector3(Math.sin(totalYaw), 0, -Math.cos(totalYaw))
    },
    [windAngle],
  )

  return (
    <>
      {bikePositions.map((zPos, i) => (
        <BikeInstance
          key={bikeIds[i]}
          originalScene={scene}
          bikeId={bikeIds[i]}
          position={[0, 0, zPos]}
          rotation={rotation}
          showPressure={showPressure}
          modelWindDir={modelWindDir}
          isSelected={bikeIds[i] === selectedBikeId}
          onSelectBike={onSelectBike}
        />
      ))}
    </>
  )
}
