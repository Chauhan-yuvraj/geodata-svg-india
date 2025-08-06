// Updated App.tsx example

import { useState } from "react";

import { MapOfSvg } from "my-india-maps";
import "my-india-maps/style.css";

function App() {
  const [currentMap, setCurrentMap] = useState("India");

  const handlePathClick = (pathName: string, pathId: string) => {
    alert(`You clicked on ${pathName} (ID: ${pathId})`);

    // Navigate to the state map when a state is clicked on the India map
    if (currentMap.toLowerCase() === "india") {
      setCurrentMap(pathName);
    }
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>Interactive Map Library</h1>

      <div style={{ margin: "20px 0" }}>
        <button onClick={() => setCurrentMap("India")}>Show India</button>
        <button onClick={() => setCurrentMap("Goa")}>Show India</button>
        <button onClick={() => setCurrentMap("Kerala")}>Show Kerela</button>
        <button onClick={() => setCurrentMap("India")}>Show India</button>
        <button onClick={() => setCurrentMap("India")}>Show India</button>
        <button onClick={() => setCurrentMap("Gujarat")}>Show Gujarat</button>
        <button onClick={() => setCurrentMap("Uttar Pradesh")}>
          Show Uttar Pradesh
        </button>
      </div>

      <h2>Displaying Map of: {currentMap}</h2>
      
      <p style={{ fontSize: "14px", color: "#666", margin: "10px 0" }}>
        • Use mouse wheel to zoom in/out<br/>
        • Click and drag to pan around<br/>
        • Use the zoom controls on the right<br/>
        • Click on regions to interact
      </p>

      <div
        style={{
          margin: "0 auto",
          width: "90vw",
          height: "80vh",
          border: "2px solid #ddd",
          borderRadius: "8px",
          overflow: "hidden",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
        }}
      >
        <MapOfSvg 
          name={currentMap} 
          onPathClick={handlePathClick}
          initialZoom={1}
          enableZoom={true}
          enablePan={true}
        />
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#888" }}>
        <p>Map data includes proper scaling and translation transformations</p>
      </div>
    </div>
  );
}

export default App;