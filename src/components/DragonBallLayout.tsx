// DragonBallLayout.tsx
import React from "react";
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
 * - A `Slider` component with direction "left" if the `dragonballId` is not "1".
 * - A `DragonBallCharacter` component that displays the Character based on the `dragonballId` or a default ID if `dragonballId` is not available.
 * - A `Slider` component with direction "right" if the `dragonballId` is not the last character's id.
 *
 * @returns {JSX.Element} The rendered layout for the Dragon Ball Character page.
 */
const DragonBallLayout: React.FC = () => {
  const { dragonballId } = useParams<{ dragonballId: string }>();

  return (
    <>
      <NavBar />
      {dragonballId !== "1" && <Slider direction="left" />}
      <DragonBallCharacter dragonBallId={dragonballId || "defaultId"} />
      {dragonballId !== lastId && <Slider direction="right" />}
    </>
  );
};

export default DragonBallLayout;
