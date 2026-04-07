import { Environment, useGLTF, useProgress, useTexture } from "@react-three/drei";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EXRLoader, GLTFLoader, KTX2Loader } from "three-stdlib";

const TECH_FACTS = [
  "The first computer bug was an actual moth found in a relay-based machine in 1947.",
  "The Apollo Guidance Computer ran lunar missions with less memory than a modern smartwatch.",
  "The first website is still online, preserving the original vision for the web.",
  "JavaScript was created in just 10 days before growing into one of the web's core languages.",
  "The term AI was coined in 1956 at the Dartmouth Summer Research Project.",
  "GPUs were designed for graphics first, then became essential for modern AI training.",
];

const ENTRY_ENVIRONMENT_MAP = "/docklands_01_1k.exr";

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

function EntrySceneAssetPreloader() {
  useLoader.preload(EXRLoader, ENTRY_ENVIRONMENT_MAP);
  useLoader(EXRLoader, ENTRY_ENVIRONMENT_MAP);

  return <Environment files={ENTRY_ENVIRONMENT_MAP} background />;
}

export default function EntryLoader() {
  const navigate = useNavigate();
  const { progress, active } = useProgress();
  const roundedProgress = Math.max(0, Math.min(100, Math.round(progress)));
  const [factIndex, setFactIndex] = useState(0);
  const isSceneReady = !active && roundedProgress >= 100;
  const statusLabel = useMemo(
    () => (isSceneReady ? "3D scene ready" : "Loading entry environment"),
    [isSceneReady],
  );

  useEffect(() => {
    useTexture.preload("/screenshots/screenshot.png");
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setFactIndex((current) => (current + 1) % TECH_FACTS.length);
    }, 2600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (isSceneReady) {
      const timer = window.setTimeout(() => {
        navigate("/entry", { replace: true });
      }, 300);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [isSceneReady, navigate]);

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
        <EntrySceneAssetPreloader />
      </Canvas>

      <div className="grid h-screen w-screen place-items-center bg-[radial-gradient(circle_at_center,#1e3a8a2a_0%,#020617_58%,#000_100%)]">
        <div className="flex w-[90%] max-w-md flex-col items-center gap-5">
          <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-white/20 bg-black/70 p-7 backdrop-blur-md">
            <div className="relative grid h-40 w-40 place-items-center [perspective:900px]">
              <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute inset-[14%] rounded-full border border-white/15" />
              <div className="relative h-20 w-20 animate-[spin_4.8s_linear_infinite] [transform:rotateX(-28deg)_rotateY(35deg)] [transform-style:preserve-3d]">
                <div className="absolute inset-0 border border-white/90 bg-white/8 shadow-[0_0_18px_rgba(255,255,255,0.2)] [transform:translateZ(40px)]" />
                <div className="absolute inset-0 border border-white/90 bg-white/8 shadow-[0_0_18px_rgba(255,255,255,0.2)] [transform:rotateY(180deg)_translateZ(40px)]" />
                <div className="absolute inset-0 border border-white/90 bg-white/7 shadow-[0_0_18px_rgba(255,255,255,0.18)] [transform:rotateY(90deg)_translateZ(40px)]" />
                <div className="absolute inset-0 border border-white/90 bg-white/7 shadow-[0_0_18px_rgba(255,255,255,0.18)] [transform:rotateY(-90deg)_translateZ(40px)]" />
                <div className="absolute inset-0 border border-white/90 bg-white/6 shadow-[0_0_18px_rgba(255,255,255,0.16)] [transform:rotateX(90deg)_translateZ(40px)]" />
                <div className="absolute inset-0 border border-white/90 bg-white/6 shadow-[0_0_18px_rgba(255,255,255,0.16)] [transform:rotateX(-90deg)_translateZ(40px)]" />
              </div>
            </div>

            <div className="w-full">
              <p className="mb-3 text-center text-xs uppercase tracking-[0.28em] text-white/90">Initializing Portal</p>
              <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white via-slate-200 to-slate-400 transition-all duration-300"
                  style={{ width: `${roundedProgress}%` }}
                />
              </div>
              <p className="text-center text-sm font-medium text-white/80">
                {roundedProgress}% | {statusLabel}
              </p>
            </div>
          </div>
          <div className="min-h-14 w-full px-3">
            <p className="mb-1 text-center text-[10px] uppercase tracking-[0.28em] text-white/45">
              Tech Fact Stream
            </p>
            <p className="text-center text-sm leading-6 text-white/88 transition-opacity duration-300">
              {TECH_FACTS[factIndex]}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
