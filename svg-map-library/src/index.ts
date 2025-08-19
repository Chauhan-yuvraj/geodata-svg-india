// src/index.ts
import './styles/map.css';

// Export both the original and safe versions
export { MapOfSvg } from './components/MapOfSvg';
export { SafeMapOfSvg } from './components/SafeMapOfSvg';

// Export types
export type { SvgPath, StateModule, IndiaModule } from './types';