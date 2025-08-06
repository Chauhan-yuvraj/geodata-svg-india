import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'), // or src/index.tsx
      name: 'MyIndiaMaps',
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'my-india-maps.js'
        if (format === 'umd') return 'my-india-maps.umd.cjs'
        return `my-india-maps.${format}.js`
      }
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})