import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/index.ts', 'src/preact.ts', 'src/react.ts', 'src/vue.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
})
