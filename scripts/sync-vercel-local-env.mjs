import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function syncVercelLocalEnv(root) {
  const source = await readFile(join(root, '.env.local'), 'utf8')
  const target = join(root, '.env')
  let previous
  try {
    previous = await readFile(target, 'utf8')
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (previous !== undefined && previous !== source) {
    const backup = join(root, '.vercel/local-backups')
    await mkdir(backup, { recursive: true, mode: 0o700 })
    await chmod(backup, 0o700)
    await writeFile(join(backup, `vercel-env-${Date.now()}.env`), previous, { mode: 0o600 })
  }
  if (previous !== source) await writeFile(target, source, { mode: 0o600 })
  await chmod(target, 0o600)
}
