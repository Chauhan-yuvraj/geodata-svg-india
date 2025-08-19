// src/components/SafeMapOfSvg.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { MapOfSvg } from './MapOfSvg';

interface SafeMapOfSvgProps {
  name: string;
  height?: string | number;
  width?: string | number;
  onPathClick?: (pathName: string, pathId: string) => void;
  onPathHover?: (pathName: string | null, pathId: string) => void;
  initialZoom?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  strokeWidth?: number;
  strokeColor?: string;
  pathFillColor?: string;
  coverFillColor?: string;
  backgroundColor?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map component error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>🗺️</div>
            <h3 style={{ margin: '0 0 5px 0' }}>Map Unavailable</h3>
            <p style={{ margin: '0', fontSize: '14px' }}>
              There was an issue loading the map component.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const SafeMapOfSvg: React.FC<SafeMapOfSvgProps> = (props) => {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMapError = useCallback((error: Error) => {
    console.error('Map error caught:', error);
    setMapError(error.message);
  }, []);

  const handleRetry = useCallback(() => {
    setMapError(null);
    // Force a re-render by updating a key or state
  }, []);

  // Don't render on server side
  if (!isClient) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#f8f8f8'
      }}>
        Loading map...
      </div>
    );
  }

  if (mapError) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 5px 0' }}>Map Error</h3>
          <p style={{ margin: '0', fontSize: '14px' }}>
            {mapError}
          </p>
          <button
            onClick={handleRetry}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary onError={handleMapError}>
      <MapOfSvg {...props} />
    </MapErrorBoundary>
  );
};