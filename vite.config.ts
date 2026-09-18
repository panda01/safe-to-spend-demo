import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Sub-path that the built site is served from on GitHub Pages.
 *
 * The repository is published as a *project* page at
 * https://panda01.github.io/safe-to-spend-demo/, so the site lives under the repository
 * name rather than at the domain root. Every generated asset URL has to carry this prefix
 * or the browser resolves them against the domain root instead and the page renders blank.
 */
const GITHUB_PAGES_BASE_PATH = '/safe-to-spend-demo/'

/**
 * Builds the Vite configuration, choosing the public base path to match how the app is
 * being served.
 *
 * Vite reports `command: 'serve'` for *both* `vite` (dev) and `vite preview`, so `command`
 * alone cannot tell them apart. `isPreview` is what separates the two: preview replays the
 * already-built `dist/` output, whose asset URLs have the GitHub Pages prefix baked in, so
 * it has to be served under the same prefix or every asset 404s. Plain dev serves from
 * source and is left at the domain root for a shorter local URL.
 *
 * @param {import('vite').ConfigEnv} configEnv - Environment Vite resolves the config in.
 * @param {'build' | 'serve'} configEnv.command - `'build'` for `vite build`, `'serve'` for
 *   both the dev server and the preview server.
 * @param {boolean} [configEnv.isPreview] - `true` only when the preview server is serving a
 *   previous build. Optional, hence the explicit comparison against `true`.
 * @returns {import('vite').UserConfig} Config whose `base` matches the serving context.
 */
export default defineConfig(({ command, isPreview }) => {
  const isServingTheProductionBundle = command === 'build' || isPreview === true

  return {
    base: isServingTheProductionBundle ? GITHUB_PAGES_BASE_PATH : '/',
    plugins: [react()],
  }
})
