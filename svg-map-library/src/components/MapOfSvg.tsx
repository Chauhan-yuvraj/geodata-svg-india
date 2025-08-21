// src/components/MapOfSvg.tsx
import React, { useState, useEffect } from "react";
import { SvgPath } from "../types";

interface ViewportConfig {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
}

interface MapOfSvgProps {
  name: string;
  height?: string | number;
  width?: string | number;

  // Interaction
  onPathClick?: (pathName: string, pathId: string) => void;
  onPathHover?: (pathName: string | null, pathId: string) => void;

  // Customization
  viewportConfig?: ViewportConfig;
  autoFit?: boolean;
  preserveAspectRatio?: string;
  fillById?: Record<string, string>; // ✅ custom colors per region

  // Styling
  strokeWidth?: number;
  strokeColor?: string;
  pathFillColor?: string;
  coverFillColor?: string;
  backgroundColor?: string;
  hoverPathColor?: string; // ✅ new prop
}

export const MapOfSvg: React.FC<MapOfSvgProps> = ({
  name,
  width = "100%",
  height = "100%",
  onPathClick,
  onPathHover,
  viewportConfig,
  autoFit = true,
  preserveAspectRatio = "xMidYMid meet",
  strokeWidth = 1,
  strokeColor = "#000",
  pathFillColor = "#f0f0f0",
  coverFillColor = "black",
  backgroundColor = "transparent",
  fillById = {}, // ✅ per-region colors
  hoverPathColor = "lightblue", // ✅ default hover
}) => {
  const [mapView, setMapView] = useState<{
    paths: SvgPath[];
    viewBox?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const loadMap = async () => {
      try {
        if (name.toLowerCase() === "india") {
          const mod = await import("../Data/indiaData");
          setMapView({
            paths: mod.indiaData.paths,
            viewBox: mod.indiaData.viewBox,
          });
        } else {
          const mod = await import(`../data/states/${name}Data.ts`);
          const stateData = mod[`${name}Data`];
          setMapView({ paths: stateData.paths, viewBox: stateData.viewBox });
        }
      } catch (e) {
        setError(`Map "${name}" not found. Check data files.`);
      }
    };
    loadMap();
  }, [name]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!mapView) return <div>Loading map...</div>;

  const { x = 0, y = 0, width: vw, height: vh } = viewportConfig || {};
  const viewBox =
    vw && vh ? `${x} ${y} ${vw} ${vh}` : mapView.viewBox ?? "0 0 1000 1000";

  return (
    <svg
      width={autoFit ? "100%" : width}
      height={autoFit ? "100%" : height}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      style={{ backgroundColor, userSelect: "none" }}
    >
      <g>
        {mapView.paths.map((path) => {
          const isHovered = hoveredId === path.id;
          const fill = isHovered
            ? hoverPathColor // ✅ override when hovered
            : fillById[path.id] ||
              (path.className?.includes("map-cover")
                ? coverFillColor
                : pathFillColor);

          return (
            <path
              key={path.id}
              d={path.d}
              id={path.id}
              className={path.className}
              transform={path.transform}
              style={{
                cursor: onPathClick ? "pointer" : "default",
                stroke: strokeColor,
                strokeWidth,
                fill,
                transition: "fill 0.2s ease",
              }}
              onClick={() => onPathClick?.(path.name, path.id)}
              onMouseEnter={() => {
                setHoveredId(path.id);
                onPathHover?.(path.name, path.id);
              }}
              onMouseLeave={() => {
                setHoveredId(null);
                onPathHover?.(null, path.id);
              }}
            />
          );
        })}
      </g>
    </svg>
  );
};
