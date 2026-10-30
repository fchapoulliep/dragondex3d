/**
 * Importing React, the Loader component, the DragonBallType component, and the Link component.
 */
import React, { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import dragonBallList from "../data/dragoncharacters.json";
import Loader from "./Loader";
import * as THREE from "three";
import "../css/dragonballcharacter.css";
import DragonBallType from "./DragonBallType";
import { Link } from "react-router-dom";

/**
 * Interface for the DragonBallProps type, which includes the Character ID.
 */
interface DragonBallProps {
  dragonBallId: string;
}

/**
 * Interface for the DragonBallModelProps type, which includes the model path and Character ID.
 */
interface DragonBallModelProps {
  modelPath: string;
  /** Called once the model is drawn and its framing has settled. */
  onReady: () => void;
}

/**
 * Component that renders a 3D model of a Dragon Ball Character using the provided model path and Character ID.
 * It handles loading the model, playing idle animations, and adjusting the model's scale and materials.
 *
 * @component
 * @param {DragonBallModelProps} props - The properties for the DragonBallModel component.
 * @param {string} props.modelPath - The path to the 3D model file.
 * @returns {JSX.Element} The rendered 3D model of the Dragon Ball Character.
 */
const DragonBallModel: React.FC<DragonBallModelProps> = ({ modelPath, onReady }) => {
  const { scene, animations } = useGLTF(modelPath);
  const mixer = new THREE.AnimationMixer(scene);
  const frames = useRef(0);

  useEffect(() => {
    if (animations.length > 0) {
      const idleAnimation = animations.find(
        (clip) =>
          clip.name.toLowerCase().includes("idle") ||
          clip.name.toLowerCase().includes("wait") ||
          clip.name === "0"
      );
      const action = mixer.clipAction(idleAnimation || animations[0]);
      action.play();
    }

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [animations, mixer, scene]);

  useFrame((_, delta) => {
    mixer.update(delta);
    // A few frames let the framing settle (centering, scale, camera fit): only
    // then is the model shown, so that it never jumps or glides into place.
    frames.current += 1;
    if (frames.current === 5) {
      onReady();
    }
  });

  useEffect(() => {
    if (scene) {
      const box = new THREE.Box3().setFromObject(scene);
      const size = new THREE.Vector3();
      box.getSize(size);

      const delta = Math.min(1.0 / size.x, 1.0 / size.y, 1.0 / size.z);
      scene.scale.set(delta, delta, delta);
    }
  }, [scene]);

  return <primitive object={scene} scale={0.25} position={[0, -2, 0]} />;
};

/**
 * Models drawn during this visit. drei keeps them in memory, so they come back
 * at once and need no loader.
 */
const seenModels = new Set<string>();

/** How long the loader stays at least, for a model not seen yet. */
const LOADER_MIN_MS = 1000;

/**
 *  Component that renders a Dragon Ball Character page with a 3D model, description, and type information.
 * @param dragonBallId The ID of the Character to display.
 * @returns The Dragon Ball Character page with the 3D model, description, and type information.
 */
const DragonBallCharacter: React.FC<DragonBallProps> = ({ dragonBallId }) => {
  const dragonballcharacter = dragonBallList.find(
    (p) => p.id === parseInt(dragonBallId)
  );

  const dragonballcharacterName = dragonballcharacter
    ? dragonballcharacter.name
    : "";

  const modelPath = useMemo(
    () =>
      `${
        import.meta.env.BASE_URL
      }models/${dragonballcharacterName}/${dragonballcharacterName}.glb?v=${__BUILD_ID__}`,
    [dragonballcharacterName]
  );

  // The loader follows the model rather than a fixed delay. A model not seen
  // yet shows it at once and for at least LOADER_MIN_MS, so that a quick load
  // reads as a transition rather than a black flash; a model already seen
  // during the visit is still in memory and shows up without it.
  const [loaderPhase, setLoaderPhase] = React.useState<
    "visible" | "closing" | "hidden"
  >("visible");
  const [drawnPath, setDrawnPath] = React.useState<string | null>(null);
  const [descriptionOpen, setDescriptionOpen] = React.useState(false);
  const modelDrawn = drawnPath === modelPath;
  const loaderShownAt = useRef(performance.now());

  useLayoutEffect(() => {
    if (seenModels.has(modelPath)) {
      setLoaderPhase("hidden");
      return;
    }
    loaderShownAt.current = performance.now();
    setLoaderPhase("visible");
  }, [modelPath]);

  useEffect(() => {
    if (!modelDrawn) return;
    seenModels.add(modelPath);
    const elapsed = performance.now() - loaderShownAt.current;
    const timer = setTimeout(
      () => setLoaderPhase((phase) => (phase === "visible" ? "closing" : phase)),
      Math.max(0, LOADER_MIN_MS - elapsed),
    );
    return () => clearTimeout(timer);
  }, [modelDrawn, modelPath]);

  if (!dragonballcharacter) {
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
        }}
      >
        The Dragon Ball Character does not exist
        <Link to="/">Go back to the DragonDex</Link>
      </div>
    );
  }

  return (
    <div
      id="dragonball-overlay"
      style={{
        backgroundImage: `url(${
          import.meta.env.BASE_URL
        }backgrounds/${dragonballcharacter.saga.toLowerCase().replace(/ /g, "-")}.png)`,
        backgroundPosition: "bottom",
        backgroundSize: "cover",
      }}
    >
      {loaderPhase !== "hidden" && (
        <Loader
          closing={loaderPhase === "closing"}
          onClosed={() => setLoaderPhase("hidden")}
        />
      )}
      {/* On phones the description folds into a bar with the name, opened on demand;
          on wider screens it is always open and the toggle is hidden */}
      <div className={`dragonball-description${descriptionOpen ? " open" : ""}`}>
        <div className="description-head">
          <h2>{dragonballcharacter.name}</h2>
          <button
            type="button"
            className="description-toggle"
            aria-expanded={descriptionOpen}
            aria-controls="dragonball-details"
            aria-label={descriptionOpen ? "Hide the description" : "Show the description"}
            onClick={() => setDescriptionOpen((open) => !open)}
          >
            {/* Lucide "chevron-up" icon (ISC license) */}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m18 15-6-6-6 6" />
            </svg>
          </button>
        </div>
        <div id="dragonball-details" className="description-details">
          <p>{dragonballcharacter.description}</p>
        </div>
      </div>
      <div className="dragonball-types">
        <DragonBallType
          key={dragonballcharacter.type}
          type={dragonballcharacter.type}
        />
      </div>

      <Canvas style={{
          background: "transparent",
          // Hidden until the model is in place, then faded in
          opacity: modelDrawn ? 1 : 0,
          transition: "opacity 150ms",
        }} shadows key={modelPath}>
        <ambientLight intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={2} castShadow />
        <directionalLight position={[5, 5, -5]} intensity={2} castShadow />
        <OrbitControls
          enableDamping
          dampingFactor={0.25}
          minDistance={2}
          maxDistance={6}
          autoRotate
        />
        {/* A model still loading suspends the scene only: without this boundary,
            the page itself would wait, and the previous page would stay on screen */}
        <Suspense fallback={null}>
          <DragonBallModel
            modelPath={modelPath}
            onReady={() => setDrawnPath(modelPath)}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default DragonBallCharacter;
