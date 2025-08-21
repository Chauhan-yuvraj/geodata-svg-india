import { useState, type SetStateAction } from "react";
import { MapOfSvg } from "my-india-maps";
import "./index.css";
export default function App() {
  const [map, setMap] = useState("Bihar");

  return (
    <div className="main-div">
      <h1>India Map</h1>
      <MapOfSvg
        name={map}
        strokeColor="#2c3e50"
        pathFillColor="white"
        hoverPathColor="pink" // <-- works now 
        viewportConfig={{ x: 0, y: 0, width: 2500, height: 2500 }}
        onPathHover={(name, id) => console.log(name, id)}
        autoFit={true} // ✅ will auto-scale to fit container
        fillById={{ MH: "orange", KA: "green" }}
        onPathClick={(name: SetStateAction<string>) => setMap(name)}
      />
    </div>
  );
}
