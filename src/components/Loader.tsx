/**
 * Importing React and the loader CSS.
 */
import React from "react";
import "../css/loader.css";

/**
 * Props for the Loader component.
 */
interface LoaderProps {
  /** Fades the loader out, while the model comes forward. */
  closing: boolean;
  /** Called once the loader has faded out, for the page to remove it. */
  onClosed: () => void;
}

/**
 * Loader component that displays a loading animation.
 *
 * This component includes:
 * - A Dragon Ball Radar animation.
 *
 * @component
 * @example
 * return (
 *   <Loader />
 * )
 */
const Loader: React.FC<LoaderProps> = ({ closing, onClosed }) => {
  return (
    <div
      className={`loader${closing ? " closing" : ""}`}
      onAnimationEnd={(event) => {
        // The radar's own animations bubble up too: only the loader's fade-out counts.
        if (event.target === event.currentTarget && event.animationName === "loaderOut") {
          onClosed();
        }
      }}
    >
      <div className="randar-box">
        <input type="checkbox" checked readOnly className="randar-checkbox" />
        <div className="randar-top"></div>
        <div className="randar-top-body"></div>
        <div className="randar-content">
          <div className="rander-ball"></div>
          <div className="rander-ball"></div>
          <div className="rander-ball"></div>
          <div className="rander-ball"></div>
          <div className="rander-pos"></div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
