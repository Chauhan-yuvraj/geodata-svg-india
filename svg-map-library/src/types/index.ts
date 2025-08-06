// src/types/index.ts

// The structure of the data module for a single STATE (e.g., HaryanaData.ts)
export interface StateModule {
  id: string;
  name: string;
  paths: SvgPath[];
  viewBox: string; // A specific viewBox is crucial for zooming in on a state
}

// The structure of the main INDIA data module (indiaData.ts)
export interface IndiaModule {
  id: 'india';
  name: 'India';
  paths: SvgPath[];
  viewBox: string; // The viewBox for the entire country map
}

export interface SvgPath {
  id: string;
  name: string;
  d: string;
  transform?: string;
  className?: string;
}

export interface MapData {
  paths: SvgPath[];
  viewBox?: string;
}