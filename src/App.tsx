import "./css/App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import DragonBallLayout from "./components/DragonBallLayout";
import DragonDex from "./components/DragonDex";

function App() {
  return (
    // Real paths (/dragondex3d/12) rather than a hash: GitHub Pages serves one
    // HTML file per character, written at build time (see vite.config.ts).
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<DragonDex />} />
        <Route path="/:dragonballId" element={<DragonBallLayout />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
