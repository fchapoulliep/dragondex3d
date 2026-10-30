/**
 * Importing React and the loader CSS.
 */
import React from "react";
import "../css/loader.css";

/**
 * Props for the Loader component.
 */
interface LoaderProps {
  /** Plays the closing animation (the black disc shrinks to the center). */
  closing: boolean;
  /** Called once the closing animation is over, for the page to remove the loader. */
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
      className={`loader${closing ? " animation" : ""}`}
      onAnimationEnd={(event) => {
        // The inner animation loops forever: only the disc's own closing animation counts.
        if (event.target === event.currentTarget && closing) {
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
