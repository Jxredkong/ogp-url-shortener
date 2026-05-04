import { Suspense } from "react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";

/**
 * Decorative full-viewport gradient background.
 * Colors picked to evoke OGP's deep-indigo-into-violet palette.
 */
export default function ShaderBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <Suspense fallback={null}>
        <ShaderGradientCanvas
          style={{ width: "100%", height: "100%" }}
          pixelDensity={1}
          fov={45}
        >
          <ShaderGradient
            control="props"
            type="waterPlane"
            color1="#1A2C7A"
            color2="#4A61C0"
            color3="#8AA0E8"
            animate="on"
            uTime={0}
            uSpeed={0.18}
            uStrength={2.4}
            uDensity={1.6}
            uFrequency={5.5}
            uAmplitude={0}
            positionX={0}
            positionY={0}
            positionZ={0}
            rotationX={50}
            rotationY={0}
            rotationZ={-60}
            cAzimuthAngle={180}
            cPolarAngle={80}
            cDistance={2.8}
            cameraZoom={9.1}
            lightType="3d"
            brightness={1.25}
            envPreset="city"
            grain="off"
            reflection={0.1}
            range="enabled"
            rangeStart={0}
            rangeEnd={40}
            toggleAxis={false}
            zoomOut={false}
          />
        </ShaderGradientCanvas>
      </Suspense>
      {/* Soft white veil so foreground text stays readable */}
      <div className="absolute inset-0 bg-background/55 dark:bg-background/40" />
    </div>
  );
}
