import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
// This command builds the explicitly requested PUBLIC MOCKUP, not a connected
// student service. All mock API requests stay in the visitor's browser tab.
const env = { ...process.env, VITE_AUTH_MODE: 'mock', VITE_PUBLIC_DEMO: 'true' }
for (const [script, ...args] of [
  ['typescript/lib/tsc.js', '-b'],
  ['vite/bin/vite.js', 'build'],
]) {
  const result = spawnSync(process.execPath, [path.join(root, 'node_modules', script), ...args], { cwd: root, env, stdio: 'inherit' })
  if (result.error) { console.error(result.error.message); process.exit(1) }
  if (result.status !== 0) process.exit(result.status ?? 1)
}
