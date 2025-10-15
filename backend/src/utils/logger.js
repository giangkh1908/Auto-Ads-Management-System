import fs from 'fs'
import path from 'path'

const LOG_DIR = path.resolve(process.cwd(), 'backend', 'logs')
const LOG_FILE = path.join(LOG_DIR, 'adsWizard.log')

try {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })
} catch (e) {
  // ignore
}

function timestamp() {
  return new Date().toISOString()
}

function write(level, msg, meta) {
  const entry = {
    ts: timestamp(),
    level,
    message: typeof msg === 'string' ? msg : (msg && msg.message) || String(msg),
    meta: meta || null,
  }

  const line = JSON.stringify(entry) + '\n'
  try {
    fs.appendFileSync(LOG_FILE, line)
  } catch (e) {
    // best-effort logging to console if file write fails
    // eslint-disable-next-line no-console
    console.error('Failed to write log file', e)
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](line)
  }
}

export default {
  info: (msg, meta) => write('info', msg, meta),
  warn: (msg, meta) => write('warn', msg, meta),
  error: (msg, meta) => write('error', msg, meta),
  debug: (msg, meta) => write('debug', msg, meta),
}
