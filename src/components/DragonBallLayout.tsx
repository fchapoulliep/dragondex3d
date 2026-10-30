// DragonBallLayout.tsx
import React, { useEffect } from "react";
import NavBar from "./NavBar";
import Slider from "./Slider";
import { useParams } from "react-router-dom";
import DragonBallCharacter from "./DragonBallCharacter";
import dragonBallList from "../data/dragoncharacters.json";

// Read from the data rather than hardcoded, so the right arrow stays correct when characters are added.
const lastId = String(Math.max(...dragonBallList.map((c) => c.id)));

/**
 * `DragonBallLayout` is a React functional component that renders the layout for displaying a Dragon Ball Character.
 * It uses the `useParams` hook to extract the `dragonballId` from the URL parameters.
 *
 * The component includes:
 * - A `NavBar` component at the top.
 * - A `Slider` component with direction "left" if the character exists and the `dragonballId` is not "1".
 * - A `DragonBallCharacter` component that displays the Character based on the `dragonballId` or a default ID if `dragonballId` is not available.
 * - A `Slider` component with direction "right" if the character exists and is not the last one.
 *
 * @returns {JSX.Element} The rendered layout for the Dragon Ball Character page.
 */
const DragonBallLayout: React.FC = () => {
  const { dragonballId } = useParams<{ dragonballId: string }>();
  const character = dragonBallList.find((c) => c.id === Number(dragonballId));

  // The tab title follows in-app navigation; the built page of each character already has it.
  useEffect(() => {
    document.title = character ? `${character.name} | DragonDex 3D` : "DragonDex 3D";
  }, [character]);

  // No arrows on an unknown id: they would lead to other unknown ids.
  return (
    <>
      <NavBar />
      {character && dragonballId !== "1" && <Slider direction="left" />}
      <DragonBallCharacter dragonBallId={dragonballId || "defaultId"} />
      {character && dragonballId !== lastId && <Slider direction="right" />}
    </>
  );
};

export default DragonBallLayout;
