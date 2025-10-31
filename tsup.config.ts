import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/server.ts'],
	outDir: 'build',
	format: ['cjs'],
	target: 'es2023',
	clean: true,
	minify: false,
	sourcemap: true,
	treeshake: true,
	splitting: false,
	dts: false,
	noExternal: [/(.*)/],
	tsconfig: './tsconfig.json',
	esbuildOptions(options) {
		options.alias = {
			'@': './src',
		}
	},
})
