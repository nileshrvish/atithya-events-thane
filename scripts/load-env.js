/**
 * Minimal .env reader — no dependency needed.
 *
 * Loads KEY=value pairs from the project-root .env into process.env, without
 * overwriting variables that are already set. That ordering matters: on Netlify
 * the dashboard's environment variables must win over any committed file.
 *
 * Supports `#` comments, blank lines, optional `export ` prefixes, and single
 * or double quoted values.
 */
'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function loadEnv(file) {
  const envPath = file || path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return false;

  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq < 0) continue;

    const key = line.slice(0, eq).replace(/^export\s+/, '').trim();
    let value = line.slice(eq + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
  return true;
};
