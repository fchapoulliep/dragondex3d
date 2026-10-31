/**
 * Importing React, the Loader component, the DragonBallType component, and the Link component.
 */
import React, { Suspense, useEffect, useMemo, useRef } from "react";
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

/** How long the model takes to come forward to its place, in seconds. */
const ENTRANCE_S = 0.5;

/** How far behind its place the model starts, in scene units (the camera stands 5 units away). */
const ENTRANCE_DEPTH = 15;

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
  // One mixer per model: created on every render, it restarted the animation
  // each time the page changed state (loader, description), hence the jolts
  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const frames = useRef(0);
  const group = useRef<THREE.Group>(null);
  const entrance = useRef<{ from: THREE.Vector3; elapsed: number } | null>(null);

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

  useFrame(({ camera }, delta) => {
    mixer.update(delta);
    // A few frames let the framing settle (centering, scale, camera fit): only
    // then is the model shown, coming forward from far behind its place.
    frames.current += 1;
    if (frames.current === 5) {
      // Along the line of sight (the camera looks at the origin), so that the
      // far-away model stands right behind the loader
      const from = camera.position.clone().normalize().multiplyScalar(-ENTRANCE_DEPTH);
      entrance.current = { from, elapsed: 0 };
      onReady();
    }

    const move = entrance.current;
    if (move && group.current) {
      // A long first frame (shader compilation) must not skip half the move
      move.elapsed = Math.min(move.elapsed + Math.min(delta, 1 / 30), ENTRANCE_S);
      const progress = move.elapsed / ENTRANCE_S;
      // Fast at first, then slows down to settle in place
      const eased = 1 - Math.pow(1 - progress, 3);
      group.current.position.copy(move.from).multiplyScalar(1 - eased);
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

  return (
    <group ref={group}>
      <primitive object={scene} scale={0.25} position={[0, -2, 0]} />
    </group>
  );
};

/**
 * How long a model may take to show before the loader appears: a quick one,
 * such as a model already seen during the visit (drei keeps it in memory),
 * needs none.
 */
const LOADER_DELAY_MS = 150;

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

  // The loader stands where the model will appear, and only once the model
  // has taken more than LOADER_DELAY_MS to show.
  const [loaderPhase, setLoaderPhase] = React.useState<
    "visible" | "closing" | "hidden"
  >("hidden");
  const [drawnPath, setDrawnPath] = React.useState<string | null>(null);
  const [descriptionOpen, setDescriptionOpen] = React.useState(false);
  const modelDrawn = drawnPath === modelPath;

  useEffect(() => {
    if (modelDrawn) return;
    const timer = setTimeout(() => setLoaderPhase("visible"), LOADER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [modelDrawn, modelPath]);

  useEffect(() => {
    if (!modelDrawn) return;
    // The loader fades out while the model comes forward
    setLoaderPhase((phase) => (phase === "visible" ? "closing" : phase));
  }, [modelDrawn]);

  const backgroundPath = dragonballcharacter
    ? `${import.meta.env.BASE_URL}backgrounds/${dragonballcharacter.saga
        .toLowerCase()
        .replace(/ /g, "-")}.png`
    : null;

  // A background shows only once fully loaded and decoded, then fades in over
  // the previous one (or the dark base), which leaves once fully covered
  const [backgrounds, setBackgrounds] = React.useState<{ id: number; path: string }[]>([]);
  const nextBackgroundId = useRef(0);

  useEffect(() => {
    if (!backgroundPath) return;
    let cancelled = false;
    const image = new Image();
    image.src = backgroundPath;
    image
      .decode()
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        // A new id each time, so that coming back to a background fades it in again
        const id = nextBackgroundId.current++;
        setBackgrounds((layers) =>
          layers[layers.length - 1]?.path === backgroundPath
            ? layers
            : [...layers, { id, path: backgroundPath }],
        );
      });
    return () => {
      cancelled = true;
    };
  }, [backgroundPath]);

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
    <div id="dragonball-overlay">
      {backgrounds.map((layer) => (
        <div
          key={layer.id}
          className="dragonball-background"
          style={{ backgroundImage: `url(${layer.path})` }}
          // Once this one has faded in, the layers it covers leave the page
          onAnimationEnd={() =>
            setBackgrounds((layers) => layers.filter((other) => other.id >= layer.id))
          }
        />
      ))}
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
