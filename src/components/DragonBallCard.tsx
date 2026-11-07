/**
 * Importing react and the Tilt component. As long as the css
 */
import React, { useEffect, useRef } from "react";
import Tilt from "react-parallax-tilt";
import "../css/dragonballcard.css";

import { Link } from "react-router-dom";
import DragonBallType from "./DragonBallType";

/**
 * Props for the DragonBallCard component.
 *
 * @interface DragonBallCardProps
 * @property {number} id - The unique identifier for the Dragon Ball Character.
 * @property {string} name - The name of the Dragon Ball Character.
 * @property {string} type - The type of the Dragon Ball Character.
 * @property {string} saga - The saga of the Dragon Ball Character.
 */
interface DragonBallCardProps {
  id: number;
  name: string;
  type: string;
  saga: string;
}

/**
 * The tilt library sizes its glare once, when the pointer enters the card.
 * The active card keeps growing after that (a 0.3 s height transition), so a
 * pointer arriving during the growth got a glare sized on the smaller card,
 * which left the corners bare until it came back. The card is measured again
 * whenever its layout size changes. setSize is internal to the library (not in
 * its types): it is called only if present.
 */
function useGlareFollowsSize() {
  const ref = useRef<Tilt>(null);
  useEffect(() => {
    const tilt = ref.current as unknown as {
      setSize?: () => void;
      wrapperEl?: { node: HTMLElement | null };
    } | null;
    const node = tilt?.wrapperEl?.node;
    if (!tilt || !node || typeof tilt.setSize !== "function" || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => tilt.setSize?.());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return ref;
}

/**
 * DragonBallCard component that displays a Dragon Ball Character card with its name, ID, types, and image.
 */
const DragonBallCard: React.FC<DragonBallCardProps> = (dragonballcharacter) => {
  const glareRef = useGlareFollowsSize();
  return (
    <Tilt
      ref={glareRef}
      className={`background-stripes dragonball-cards ${dragonballcharacter.saga}`}
      glareEnable
      glareMaxOpacity={0.3}
      glareColor="white"
      glarePosition="all"
      glareBorderRadius="20px"
      scale={1.1}
    >
      <div className="inner-element">
        <Link to={`/${dragonballcharacter.id}`}>
          <div className="dragonball-types">
            <DragonBallType
              key={dragonballcharacter.type}
              type={dragonballcharacter.type}
            />
          </div>
          <p>{dragonballcharacter.name}</p>
          <img className="dragon-ball-character-image"
            src={`${import.meta.env.BASE_URL}/sprites/${
              dragonballcharacter.name
            }.png`}
            alt={dragonballcharacter.name}
          />
        </Link>
      </div>
    </Tilt>
  );
};

export default DragonBallCard;
