import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
import { syncVercelLocalEnv } from './sync-vercel-local-env.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const cache = join(root, '.vercel/npm-cache')
// Vercel 62 reads .env for API functions; Vite reads .env.local.
// Keep the ignored, owner-only runtime file aligned with the primary config.
await syncVercelLocalEnv(root)
// Vite loads these for the frontend, but the API runtime also needs them.
// Pass them privately through the process environment, never CLI arguments.
const localEnv = loadEnv('development', root, '')
await mkdir(cache, { recursive: true })
console.log('Starting local frontend and API with Vite routing. The first CLI install may take a minute.')
const child = spawn('npx', [
  '--yes',
  `--cache=${cache}`,
  'vercel@62.1.0',
  'dev',
  '--local-config',
  join(root, 'vercel.local-dev.json'),
  '--listen',
  'localhost:3000',
], { cwd: root, stdio: 'inherit', env: { ...process.env, ...localEnv } })

child.on('error', () => {
  console.error('Could not start Vercel CLI. Check that Node.js and npm are available in this terminal.')
  process.exitCode = 1
})
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
})
