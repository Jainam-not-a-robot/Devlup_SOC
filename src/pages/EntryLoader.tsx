import { useEffect } from "react";
import { useGLTF, useProgress, useTexture } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useNavigate } from "react-router-dom";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader";

function CompressedModelPreloader() {
  const { gl } = useThree();

  useEffect(() => {
    const ktx2Loader = new KTX2Loader().setTranscoderPath("/basis/").detectSupport(gl);

    useGLTF.preload("/model-compressed.glb", false, false, (loader: GLTFLoader) => {
      loader.setKTX2Loader(ktx2Loader);
    });

    return () => {
      ktx2Loader.dispose();
    };
  }, [gl]);

  return null;
}

export default function EntryLoader() {
  const navigate = useNavigate();
  const { progress, active } = useProgress();
  const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  useEffect(() => {
    useTexture.preload("/screenshots/screenshot.png");
  }, []);

  useEffect(() => {
    if (!active && roundedProgress >= 100) {
      const timer = window.setTimeout(() => {
        navigate("/entry", { replace: true });
      }, 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [active, navigate, roundedProgress]);

  return (
    <>
      <Canvas
        style={{
          position: "fixed",
          inset: 0,
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <CompressedModelPreloader />
      </Canvas>

      <div className="grid h-screen w-screen place-items-center bg-[radial-gradient(circle_at_center,#1e3a8a2a_0%,#020617_58%,#000_100%)]">
        <div className="flex w-[90%] max-w-md flex-col items-center gap-6 rounded-2xl border border-cyan-300/30 bg-black/70 p-7 backdrop-blur-md">
          <div className="relative grid h-36 w-36 place-items-center">
            <div className="absolute inset-0 animate-spin rounded-full border border-cyan-300/40 [animation-duration:3.2s]" />
            <div className="absolute inset-[12%] animate-spin rounded-full border border-blue-400/50 [animation-direction:reverse] [animation-duration:2.3s]" />
            <div className="absolute inset-[24%] animate-spin rounded-full border border-indigo-400/60 [animation-duration:1.6s]" />
            <div className="h-7 w-7 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_22px_#22d3ee]" />
          </div>

          <div className="w-full">
            <p className="mb-3 text-center text-xs uppercase tracking-[0.28em] text-cyan-100/90">Initializing Portal</p>
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-cyan-950/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${roundedProgress}%` }}
              />
            </div>
            <p className="text-center text-sm font-medium text-cyan-100/85">{roundedProgress}%</p>
          </div>
        </div>
      </div>
    </>
  );
}
