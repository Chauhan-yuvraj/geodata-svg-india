import React, { useState, useEffect, useRef, useCallback } from "react";
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
  onPathClick?: (pathName: string, pathId: string) => void;
  onPathHover?: (pathName: string | null, pathId: string) => void;
  viewportConfig?: ViewportConfig;
  autoFit?: boolean;
  preserveAspectRatio?: string;
  fillById?: Record<string, string>;
  strokeWidth?: number;
  strokeColor?: string;
  pathFillColor?: string;
  coverFillColor?: string;
  backgroundColor?: string;
  hoverPathColor?: string;
  enableZoomPan?: boolean;
  minScale?: number;
  maxScale?: number;
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
  fillById = {},
  hoverPathColor = "lightblue",
  enableZoomPan = true,
  minScale = 0.1,
  maxScale = 10,
}) => {
  const [mapView, setMapView] = useState<{
    paths: SvgPath[];
    viewBox?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Enhanced zoom/pan state
  const [transform, setTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const isPanning = useRef(false);
  const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
  const initialViewBox = useRef<string>("");

  useEffect(() => {
    const loadMap = async () => {
      try {
        if (name.toLowerCase() === "india") {
          const mod = await import("../Data/indiaData");
          setMapView({
            paths: mod.indiaData.paths,
            viewBox: mod.indiaData.viewBox,
          });
          initialViewBox.current = mod.indiaData.viewBox || "0 0 1000 1000";
        } else {
          const mod = await import(`../data/states/${name}Data.ts`);
          const stateData = mod[`${name}Data`];
          setMapView({ paths: stateData.paths, viewBox: stateData.viewBox });
          initialViewBox.current = stateData.viewBox || "0 0 1000 1000";
        }
      } catch (e) {
        setError(`Map "${name}" not found. Check data files.`);
      }
    };
    loadMap();
  }, [name]);

  // Get SVG point from screen coordinates
  const getSVGPoint = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    // Convert screen coordinates to SVG coordinates
    const svgX =
      ((clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
    const svgY =
      ((clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;

    return { x: svgX, y: svgY };
  }, []);

  // Handle zoom with proper mouse position
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enableZoomPan) return;

      e.preventDefault();
      e.stopPropagation();

      const zoomIntensity = 0.1;
      const wheel = e.deltaY < 0 ? 1 : -1;
      const zoom = Math.exp(wheel * zoomIntensity);

      // Get mouse position in SVG coordinates
      const mousePoint = getSVGPoint(e.clientX, e.clientY);

      setTransform((prev) => {
        const newScale = Math.min(
          Math.max(prev.scale * zoom, minScale),
          maxScale
        );
        const scaleRatio = newScale / prev.scale;

        // Zoom towards mouse position
        const newX = prev.x - (mousePoint.x - prev.x) * (scaleRatio - 1);
        const newY = prev.y - (mousePoint.y - prev.y) * (scaleRatio - 1);

        return {
          x: newX,
          y: newY,
          scale: newScale,
        };
      });
    },
    [enableZoomPan, getSVGPoint, minScale, maxScale]
  );

  // Handle pan start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enableZoomPan) return;

      e.preventDefault();
      isPanning.current = true;
      lastPanPoint.current = getSVGPoint(e.clientX, e.clientY);

      if (svgRef.current) {
        svgRef.current.style.cursor = "grabbing";
      }
    },
    [enableZoomPan, getSVGPoint]
  );

  // Handle pan move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enableZoomPan || !isPanning.current || !lastPanPoint.current) return;

      e.preventDefault();
      const currentPoint = getSVGPoint(e.clientX, e.clientY);

      const dx = currentPoint.x - lastPanPoint.current.x;
      const dy = currentPoint.y - lastPanPoint.current.y;

      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));

      lastPanPoint.current = currentPoint;
    },
    [enableZoomPan, getSVGPoint]
  );

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    isPanning.current = false;
    lastPanPoint.current = null;

    if (svgRef.current) {
      svgRef.current.style.cursor = enableZoomPan ? "grab" : "default";
    }
  }, [enableZoomPan]);

  // Reset view to initial state
  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // Expose reset function via ref (for external use)
  useEffect(() => {
    if (svgRef.current) {
      (svgRef.current as any).resetView = resetView;
    }
  }, [resetView]);

  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!mapView) return <div>Loading map...</div>;

  const { x = 0, y = 0, width: vw, height: vh } = viewportConfig || {};
  const viewBox =
    vw && vh ? `${x} ${y} ${vw} ${vh}` : mapView.viewBox ?? "0 0 1000 1000";

  // Create transform string for the main group
  const transformString = `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`;

  return (
    <div
      style={{
        width: autoFit ? "100%" : width,
        height: autoFit ? "100%" : height,
        position: "relative",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio={preserveAspectRatio}
        style={{
          backgroundColor,
          userSelect: "none",
          cursor: enableZoomPan
            ? isPanning.current
              ? "grabbing"
              : "grab"
            : "default",
          touchAction: "none", // Prevent browser zoom on touch devices
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={transformString}>
          {mapView.paths.map((path) => {
            // ✅ Skip hover for certain classes
            const isSkippable =
              path.className?.includes("map-cover") ||
              path.className?.includes("water") ||
              path.className?.includes("foreign");

            const isHovered = !isSkippable && hoveredId === path.id;

            const fill = isHovered
              ? hoverPathColor
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
                  cursor: onPathClick && !isSkippable ? "pointer" : "inherit",
                  stroke: strokeColor,
                  strokeWidth: strokeWidth / transform.scale,
                  fill,
                  transition: "fill 0.2s ease",
                  vectorEffect: "non-scaling-stroke",
                }}
                onClick={(e) => {
                  if (isSkippable) return; // ✅ Ignore clicks too if needed
                  e.stopPropagation();
                  const capitalized =
                    path.name.charAt(0).toUpperCase() + path.name.slice(1);
                  onPathClick?.(capitalized, path.id);
                }}
                
                onMouseEnter={(e) => {
                  if (isSkippable) return;
                  setHoveredId(path.id);
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    text: path.name,
                  });
                  onPathHover?.(path.name, path.id);
                }}
                onMouseLeave={() => {
                  if (isSkippable) return;
                  setHoveredId(null);
                  setTooltip(null);
                  onPathHover?.(null, path.id);
                }}
                onMouseMove={(e) => {
                  if (isSkippable || !tooltip) return;
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY,
                    text: path.name,
                  });
                }}
              />
            );
          })}
        </g>
      </svg>

      {/* Optional: Add zoom controls */}
      {enableZoomPan && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            zIndex: 1000,
          }}
        >
          <button
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.min(prev.scale * 1.2, maxScale),
              }))
            }
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid #ccc",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            +
          </button>
          <button
            onClick={() =>
              setTransform((prev) => ({
                ...prev,
                scale: Math.max(prev.scale / 1.2, minScale),
              }))
            }
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid #ccc",
              borderRadius: "3px",
              cursor: "pointer",
            }}
          >
            -
          </button>
          <button
            onClick={resetView}
            style={{
              padding: "5px 10px",
              background: "rgba(255,255,255,0.9)",
              border: "1px solid #ccc",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Reset
          </button>
        </div>
      )}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 10,
            top: tooltip.y + 10,
            background: "rgba(0,0,0,0.75)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "12px",
            pointerEvents: "none",
            zIndex: 2000,
            whiteSpace: "nowrap",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
};
