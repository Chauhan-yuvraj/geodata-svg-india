// src/index.ts

// Import the stylesheet so that it gets included in the build
import './styles/map.css';

// Export the main component that users will interact with
export { MapOfSvg } from './components/MapOfSvg';

// Optionally, export the types for users who want to use them
export type { SvgPath, StateModule, IndiaModule } from './types';