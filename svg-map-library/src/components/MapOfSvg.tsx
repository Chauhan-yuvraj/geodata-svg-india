// src/components/MapOfSvg.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import { SvgPath } from "../types";

interface MapViewData {
  paths: SvgPath[];
  viewBox?: string;
}

interface MapOfSvgProps {
  name: string;
  height?: string | number;
  width?: string | number;
  onPathClick?: (pathName: string, pathId: string) => void;
  initialZoom?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
}

interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Normalizes a state name into the format needed for dynamic import.
 */
const formatStateNameForImport = (name: string) => {
  const cleanedName = name.replace(/_/g, " ");
  const camelCase = cleanedName
    .replace(/\s(.)/g, (match) => match.toUpperCase())
    .replace(/\s/g, "");
  const pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.slice(1);

  return {
    moduleName: `${pascalCase}Data`,
    exportKey: `${camelCase}Data`,
  };
};

/**
 * Calculates bounding box for all paths
 */
const calculateBoundingBox = (paths: SvgPath[]): ViewBox => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  paths.forEach((path) => {
    // Simple regex to extract coordinates from path data
    const coords = path.d.match(/-?\d+\.?\d*/g);
    if (coords) {
      for (let i = 0; i < coords.length; i += 2) {
        const x = parseFloat(coords[i]);
        const y = parseFloat(coords[i + 1]);
        if (!isNaN(x) && !isNaN(y)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
  });

  const padding = 50;
  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
};

const isPathClickable = (
  className?: string,
  onPathClick?: Function
): boolean => {
  if (!onPathClick) return false;
  if (!className) return true;
  return !className.includes("map-cover");
};

/**
 * Generates the appropriate CSS classes for a path
 */
const getPathClasses = (path: SvgPath, mapName: string): string => {
  const baseClasses = [];

  const defaultClass =
    mapName.toLowerCase() === "india" ? "state-boundary" : "district-boundary";
  baseClasses.push(defaultClass);

  if (path.className) {
    baseClasses.push(path.className);
  }

  return baseClasses.join(" ");
};

export const MapOfSvg: React.FC<MapOfSvgProps> = ({
  name,
  width = "100%",
  height = "100%",
  onPathClick,
  initialZoom = 1,
  enableZoom = true,
  enablePan = true,
}) => {
  const [mapView, setMapView] = useState<MapViewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Zoom and pan state
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Original viewBox for calculations
  const [originalViewBox, setOriginalViewBox] = useState<ViewBox | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const loadMapData = async () => {
      setIsLoading(true);
      setError(null);
      setMapView(null);

      try {
        let mapModule;
        if (name.toLowerCase() === "india") {
          mapModule = await import("../Data/indiaData");
          const data = {
            paths: mapModule.indiaData.paths,
            viewBox: mapModule.indiaData.viewBox,
          };
          setMapView(data);
        } else {
          const { moduleName, exportKey } = formatStateNameForImport(name);
          mapModule = await import(`../Data/states/${moduleName}.ts`);
          const stateData = mapModule[exportKey];
          if (!stateData) {
            throw new Error(
              `Could not find exported data '${exportKey}' in module '${moduleName}'.`
            );
          }
          const data = {
            paths: stateData.paths,
            viewBox: stateData.viewBox,
          };
          setMapView(data);
        }
      } catch (err) {
        console.error("Failed to load map data:", err);
        setError(
          `Could not load map data for "${name}". Check spelling and file names.`
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, [name]);

  // Calculate viewBox when map data loads
  useEffect(() => {
    if (mapView) {
      let viewBox: ViewBox;

      if (mapView.viewBox) {
        const [x, y, w, h] = mapView.viewBox.split(" ").map(Number);
        viewBox = { x, y, width: w, height: h };
      } else {
        viewBox = calculateBoundingBox(mapView.paths);
      }

      setOriginalViewBox(viewBox);
      // Reset zoom and pan when new map loads
      setZoom(initialZoom);
      setPan({ x: 0, y: 0 });
    }
  }, [mapView, initialZoom]);

  // Calculate current viewBox based on zoom and pan
  const getCurrentViewBox = useCallback((): string => {
    if (!originalViewBox) return "0 0 1000 1000";

    const zoomedWidth = originalViewBox.width / zoom;
    const zoomedHeight = originalViewBox.height / zoom;

    const x =
      originalViewBox.x +
      (originalViewBox.width - zoomedWidth) / 2 -
      pan.x / zoom;
    const y =
      originalViewBox.y +
      (originalViewBox.height - zoomedHeight) / 2 -
      pan.y / zoom;

    return `${x} ${y} ${zoomedWidth} ${zoomedHeight}`;
  }, [originalViewBox, zoom, pan]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!enablePan) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !enablePan) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!enableZoom) return;
    e.preventDefault();

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, zoom * zoomFactor));
    setZoom(newZoom);
  };

  // Zoom controls
  const zoomIn = () => {
    const newZoom = Math.min(10, zoom * 1.2);
    setZoom(newZoom);
  };

  const zoomOut = () => {
    const newZoom = Math.max(0.1, zoom * 0.8);
    setZoom(newZoom);
  };

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (isLoading) {
    return <div>Loading Map...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!mapView || !originalViewBox) {
    return null;
  }

  return (
    <div style={{ position: "relative", width, height }}>
      {/* Zoom Controls */}
      {enableZoom && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          <button
            onClick={zoomIn}
            style={{
              padding: "5px 10px",
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            +
          </button>
          <button
            onClick={zoomOut}
            style={{
              padding: "5px 10px",
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            -
          </button>
          <button
            onClick={resetZoom}
            style={{
              padding: "5px 10px",
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            Reset
          </button>
        </div>
      )}

      {/* Zoom Level Indicator */}
      {enableZoom && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 10,
            background: "rgba(255, 255, 255, 0.8)",
            padding: "5px 10px",
            borderRadius: "3px",
            fontSize: "12px",
          }}
        >
          Zoom: {zoom.toFixed(1)}x
        </div>
      )}

      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={getCurrentViewBox()}
        preserveAspectRatio="xMidYMid meet"
        style={{
          cursor: enablePan ? (isDragging ? "grabbing" : "grab") : "default",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g>
          {mapView.paths.map((path) => {
            const isClickable = isPathClickable(path.className, onPathClick);
            const pathClasses = getPathClasses(path, name);

            return (
              <path
                key={path.id}
                id={path.id}
                d={path.d}
                transform={path.transform}
                className={pathClasses}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isClickable && onPathClick) {
                    onPathClick(path.name, path.id);
                  }
                }}
                style={{
                  cursor: isClickable ? "pointer" : "default",
                  fill: path.className?.includes("map-cover")
                    ? "black"
                    : undefined, // <-- color override
                }}
              >
                <title>{path.name}</title>
              </path>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
