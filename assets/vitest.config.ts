import { defineConfig } from 'vitest/config'

export default defineConfig({
    // test/parity.test.ts reads the ux_icon() renders of the documentation, outside assets/
    server: { fs: { allow: ['..'] } },
    test: {
        environment: 'jsdom',
        globals: false,
        include: ['test/**/*.test.ts'],
        coverage: {
            include: ['src/**'],
            // clover.xml for the coverage report of the CI, text for the terminal
            reporter: ['text', 'clover'],
        },
    },
})
