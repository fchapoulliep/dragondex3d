/* Importing React and Link from react-router-dom */
import React from "react";

/* Importing Swiper components */
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import SwiperCore from "swiper/core";
SwiperCore.use([Keyboard, Navigation]);
import "swiper/swiper-bundle.css";

/* Importing the CSS file */
import "../css/dragondex.css";

/* Importing the list of Dragon Ball Character */
import dragonBallCharacterList from "../data/dragoncharacters.json";

/* Importing the Footer component */
import Footer from "./Footer";
import DragonBallCard from "./DragonBallCard";

import dragonBallLogo from "../assets/logo/dragonBallLogo.png";

/**
 * Pokedex component that displays a list of Dragon Ball Characters as links.
 * Each Dragon Ball Character name is converted to lowercase and used as the URL path.
 *
 * @component
 * @example
 * return (
 *   <Pokedex />
 * )
 */
const DragonDex: React.FC = () => {
  // Back on the list after a character page, the tab title goes back to the site name.
  React.useEffect(() => {
    document.title = "DragonDex 3D";
  }, []);

  const [dragonBallCharacterToShow, setDragonBallCharacterToShow] =
    React.useState(dragonBallCharacterList);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("");

  /**
   * handleInput function that filters the Dragon Ball Characters list based on the search query.
   */
  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    filterDragonBallCharacter(query, selectedType);
  };

  /**
   * handleTypeChange function that filters the Dragon Ball Characters list based on the selected type.
   */
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value;
    setSelectedType(type);
    filterDragonBallCharacter(searchQuery, type);
  };

  /**
   * Normalizes a given text string by:
   * 1. Decomposing combined graphemes into their constituent parts (NFD normalization).
   * 2. Removing diacritical marks (accents).
   * 3. Converting the text to lowercase.
   *
   * @param text - The input string to be normalized.
   * @returns The normalized string.
   */
  const normalizeText = (text: string) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  /**
   * filterDragonBallCharacter function that filters the Dragon Ball Characters list based on the search query and type.
   * @param query the search query
   * @param type the selected type
   */
  const filterDragonBallCharacter = (query: string, type: string) => {
    const filteredDragonBallCharacter = dragonBallCharacterList.filter(
      (dragonBallCharacter) => {
        const matchesName =
          normalizeText(dragonBallCharacter.name).startsWith(
            normalizeText(query)
          ) ||
          normalizeText(dragonBallCharacter.name).includes(
            normalizeText(query)
          );
        const matchesType =
          type === "" ? true : dragonBallCharacter.saga === type;
        return matchesName && matchesType;
      }
    );
    setDragonBallCharacterToShow(filteredDragonBallCharacter);
  };

  return (
    <div id="dragondex">
      <div id="dragondex-navbar">
        <a
          href={`${import.meta.env.BASE_URL}`}
          style={{ height: "100%", display: "flex", alignItems: "center" }}
        >
          <img
            src={dragonBallLogo}
            alt="Dragon Ball Logo"
            style={{ width: "80px" }}
          />
        </a>
        <search id="search-bar">
          <input
            name="dragonballcharacter-name"
            type="text"
            placeholder="Search Character"
            onInput={handleInput}
          />
          <select name="dragonballcharacter-type" onChange={handleTypeChange}>
            <option value="">All Sagas</option>
            {Array.from(
              new Set(
                dragonBallCharacterList.flatMap((dragonballcharacter) => dragonballcharacter.saga)
              )
            ).map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
        </search>
      </div>
      <div id="dragondex-container">
        <Swiper
          spaceBetween={30}
          slidesPerView="auto"
          centeredSlides={true}
          freeMode={true}
          navigation={true}
          initialSlide={2}
          keyboard
          cssMode
        >
          {dragonBallCharacterToShow.map((dragonBallCharacter, index) => (
            <SwiperSlide
              style={{
                width: "300px",
                textAlign: "center",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
              key={index}
            >
              <DragonBallCard
                key={index}
                name={dragonBallCharacter.name}
                id={dragonBallCharacter.id}
                type={dragonBallCharacter.type}
                saga={dragonBallCharacter.saga.toLowerCase().replace(/ /g, "-")}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <Footer />
    </div>
  );
};

export default DragonDex;
