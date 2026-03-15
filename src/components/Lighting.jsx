import { Environment } from '@react-three/drei'

export default function Lighting() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.3} />
      <Environment preset="studio" />
    </>
  )
}
