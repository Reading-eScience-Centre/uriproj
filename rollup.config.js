import { defineConfig } from 'rollup';
import babel from '@rollup/plugin-babel'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'

const outputCfgs = [
  {
    minify: true,
  },
  {
    minify: false
  }
]

export default defineConfig({
  input: 'src/index.js',
  plugins: [
    nodeResolve({ browser: true }),
    commonjs({ include: 'node_modules/**' }),
    babel({ babelHelpers: 'bundled' }),
  ],
  external: ['proj4'],

  output: outputCfgs.map(opts => ({
    file: 'uriproj.' + (opts.minify ? 'min' : 'src') + '.js',
    format: 'iife',
    name: 'uriproj',
    sourcemap: true,
    globals: {
      proj4: 'proj4'
    },
    plugins: (opts.minify ? [terser()] : [])
  })),

})