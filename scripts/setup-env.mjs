// Creates a local .env from .env.example with freshly generated development secrets.
// Safe by default: refuses to overwrite an existing .env (pass --force to regenerate).
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const TARGET = '.env';
const force = process.argv.includes('--force');

if (existsSync(TARGET) && !force) {
  console.log('.env already exists; leaving it unchanged (use --force to regenerate).');
  process.exit(0);
}

const secret = (bytes = 24) => randomBytes(bytes).toString('base64url');

const generated = {
  POSTGRES_SUPERUSER_PASSWORD: secret(),
  DB_OWNER_PASSWORD: secret(),
  DB_APP_PASSWORD: secret(),
  REDIS_PASSWORD: secret(),
  S3_ACCESS_KEY: `dev${secret(9)}`,
  S3_SECRET_KEY: secret(),
};

const values = { ...generated };
const get = (key) => values[key];

const template = readFileSync('.env.example', 'utf8');
const ports = Object.fromEntries(
  [...template.matchAll(/^(\w+_PORT)=(\d+)$/gm)].map((m) => [m[1], m[2]]),
);

values.DATABASE_URL = `postgres://dairy_app:${get('DB_APP_PASSWORD')}@127.0.0.1:${ports.POSTGRES_PORT}/dairy_dev`;
values.DATABASE_MIGRATION_URL = `postgres://dairy_owner:${get('DB_OWNER_PASSWORD')}@127.0.0.1:${ports.POSTGRES_PORT}/dairy_dev`;
values.REDIS_URL = `redis://:${get('REDIS_PASSWORD')}@127.0.0.1:${ports.REDIS_PORT}`;
values.S3_ENDPOINT = `http://127.0.0.1:${ports.S3_PORT}`;

const out = template
  .split('\n')
  .map((line) => {
    const m = /^(\w+)=(.*)$/.exec(line);
    return m && values[m[1]] !== undefined ? `${m[1]}=${values[m[1]]}` : line;
  })
  .join('\n');

writeFileSync(TARGET, out, { mode: 0o600 });
console.log('Created .env with generated local development secrets (not committed).');
