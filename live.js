/*
 * live — a zero-dependency static server for ES module front-ends.
 * Copyright (c) 2026 Vectorted
 * https://github.com/Vectorted
 *
 * Released under the MIT License. See the LICENSE file for details.
 */

/**
 * @file A zero-dependency static file server tuned for ES module front-ends.
 *
 * Requires **Node.js 22+**. Run it directly:
 *
 * ```bash
 * node live.js --port 3000 --root ./
 * ```
 *
 * Why this server exists:
 * - `<script type="module">` and dynamic `import()` are rejected by browsers
 *   unless JavaScript files are served with a JavaScript MIME type
 *   (`text/javascript`). Many minimal servers get this wrong.
 * - It adds path traversal protection, ETag/304 conditional requests,
 *   optional SPA history fallback, CORS and structured logging — without
 *   pulling in Express or any other dependency.
 *
 * @module live
 * @license MIT
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

/**
 * Minimal logger contract. Both methods are optional; missing methods are
 * silently ignored.
 *
 * @typedef {Object} Logger
 * @property {(message: string) => void} [info]  Called for informational lines.
 * @property {(message: string) => void} [error] Called for error lines.
 */

/**
 * Hook executed before the static handler. Return `true` (or a Promise
 * resolving to `true`) to indicate the request has been fully handled and
 * the static handler must not run.
 *
 * @callback RequestHook
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @returns {boolean | Promise<boolean>}
 */

/**
 * Options accepted by {@link createStaticServer}.
 *
 * @typedef {Object} ServerOptions
 * @property {string}   [root]         Absolute or relative directory to serve. Defaults to the directory of this module.
 * @property {number}   [port]         TCP port for the CLI. Defaults to `3000`.
 * @property {string}   [host]         Bind address for the CLI. Defaults to `'0.0.0.0'`.
 * @property {boolean}  [spaFallback]  When `true`, unknown paths fall back to the first index file. Defaults to `false`.
 * @property {string}   [cacheControl] Value for the `Cache-Control` header. Defaults to `'no-cache'`.
 * @property {readonly string[]} [indexFiles] Candidate index filenames for directory requests. Defaults to `['index.html']`.
 * @property {boolean}  [cors]         When `true`, emit permissive CORS headers and answer preflight requests. Defaults to `false`.
 * @property {Logger}   [logger]       Logger used by the request pipeline. Defaults to `console`.
 * @property {RequestHook} [onRequest] Optional hook to intercept requests before static resolution.
 */

/**
 * Extension → MIME type map. Keys are lowercase and include the leading dot.
 *
 * JavaScript entries intentionally use `text/javascript` (the current
 * WHATWG/IANA recommended type). `application/javascript` is also accepted by
 * browsers, but `text/javascript` is the forward-compatible choice.
 *
 * @type {ReadonlyMap<string, string>}
 */
export const MIME_TYPES = new Map([
  ['.html',  'text/html; charset=utf-8'],
  ['.htm',   'text/html; charset=utf-8'],
  ['.js',    'text/javascript; charset=utf-8'],
  ['.mjs',   'text/javascript; charset=utf-8'],
  ['.cjs',   'application/node'],
  ['.css',   'text/css; charset=utf-8'],
  ['.json',  'application/json; charset=utf-8'],
  ['.map',   'application/json; charset=utf-8'],
  ['.txt',   'text/plain; charset=utf-8'],
  ['.xml',   'application/xml; charset=utf-8'],
  ['.svg',   'image/svg+xml'],
  ['.png',   'image/png'],
  ['.jpg',   'image/jpeg'],
  ['.jpeg',  'image/jpeg'],
  ['.gif',   'image/gif'],
  ['.webp',  'image/webp'],
  ['.avif',  'image/avif'],
  ['.ico',   'image/x-icon'],
  ['.woff',  'font/woff'],
  ['.woff2', 'font/woff2'],
  ['.ttf',   'font/ttf'],
  ['.otf',   'font/otf'],
  ['.wasm',  'application/wasm'],
  ['.pdf',   'application/pdf'],
  ['.ts',    'text/typescript; charset=utf-8'],
]);

/**
 * Default values applied on top of user-provided {@link ServerOptions}.
 *
 * @type {Readonly<{
 *   root: string,
 *   port: number,
 *   host: string,
 *   spaFallback: boolean,
 *   cacheControl: string,
 *   indexFiles: readonly string[],
 *   cors: boolean
 * }>}
 */
export const DEFAULT_OPTIONS = Object.freeze({
  root: import.meta.dirname,
  port: 3000,
  host: '0.0.0.0',
  spaFallback: false,
  cacheControl: 'no-cache',
  indexFiles: Object.freeze(['index.html']),
  cors: false,
});

/**
 * Write a small plain-text response.
 *
 * @param {import('node:http').ServerResponse} res
 * @param {number} status          HTTP status code.
 * @param {string} message         Body text (a trailing newline is added).
 * @param {Record<string, string>} [extraHeaders]
 * @returns {void}
 */
function sendPlain(res, status, message, extraHeaders = {}) {
  const body = `${message}\n`;
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(body);
}

/**
 * `stat()` that never throws: returns `null` for missing or inaccessible paths.
 *
 * @param {string} path
 * @returns {Promise<import('node:fs').Stats | null>}
 */
async function statSafe(path) {
  try {
    return await stat(path);
  } catch {
    return null;
  }
}

/**
 * Build a weak ETag from size and mtime. Sufficient for static assets.
 *
 * @param {import('node:fs').Stats} stats
 * @returns {string}
 */
function makeETag(stats) {
  return `W/"${stats.size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
}

/**
 * Forward an info line to the configured logger, if any.
 *
 * @param {Logger | undefined} logger
 * @param {string} message
 * @returns {void}
 */
function logInfo(logger, message) {
  if (logger && typeof logger.info === 'function') logger.info(message);
}

/**
 * Forward an error line to the configured logger, if any.
 *
 * @param {Logger | undefined} logger
 * @param {string} message
 * @returns {void}
 */
function logError(logger, message) {
  if (logger && typeof logger.error === 'function') logger.error(message);
}

/**
 * Resolve a request pathname into an absolute filesystem path, refusing any
 * input that would escape `root`.
 *
 * The algorithm is deliberately path-segment based rather than relying on
 * platform-specific `normalize()` behaviour:
 *
 * 1. Percent-decode the pathname; reject malformed encodings and NUL bytes.
 * 2. Split on `/`, drop empty and `.` segments, and `pop()` on `..`.
 * 3. Reject Windows drive-letter segments (`C:`) regardless of host platform.
 * 4. `resolve(root, ...segments)` and double-check the prefix.
 *
 * @param {string} root         Absolute path to the served directory.
 * @param {string} requestPath  Raw `URL.pathname` (percent-encoded).
 * @returns {string | null}     Absolute filesystem path, or `null` if unsafe.
 */
export function resolveSafePath(root, requestPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(requestPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;

  /** @type {string[]} */
  const segments = [];
  for (const raw of decoded.split('/')) {
    if (raw === '' || raw === '.') continue;
    if (raw === '..') {
      segments.pop();
      continue;
    }
    if (/^[a-zA-Z]:$/.test(raw)) return null;
    segments.push(raw);
  }

  const candidate = resolve(root, ...segments);
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  if (candidate !== root && !candidate.startsWith(rootWithSep)) return null;
  return candidate;
}

/**
 * Create (but do not start) an HTTP server that statically serves `root`.
 *
 * The returned `http.Server` is not listening yet; call `server.listen(...)`
 * with your preferred port/host. Handy for tests that need an ephemeral port.
 *
 * @param {ServerOptions} [userOptions={}]
 * @returns {import('node:http').Server}
 *
 * @example
 * ```js
 * import { createStaticServer } from './live.js';
 *
 * const server = createStaticServer({ root: './public', spaFallback: true });
 * server.listen(0, '127.0.0.1', () => {
 *   const { port } = /** @type {import('node:net').AddressInfo} *\/ (server.address());
 *   console.log(`http://127.0.0.1:${port}`);
 * });
 * ```
 */
export function createStaticServer(userOptions = {}) {
  const options = { logger: console, ...DEFAULT_OPTIONS, ...userOptions };
  const root = resolve(options.root);

  /**
   * @param {import('node:http').IncomingMessage} req
   * @param {import('node:http').ServerResponse} res
   * @returns {Promise<{ bytesSent: number }>}
   */
  async function handle(req, res) {
    const method = req.method ?? 'GET';

    if (method === 'OPTIONS' && options.cors) {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers':
          req.headers['access-control-request-headers'] ?? '*',
        'Access-Control-Max-Age': '86400',
      });
      res.end();
      return { bytesSent: 0 };
    }

    if (method !== 'GET' && method !== 'HEAD') {
      sendPlain(res, 405, 'Method Not Allowed', { Allow: 'GET, HEAD, OPTIONS' });
      return { bytesSent: 0 };
    }

    if (typeof options.onRequest === 'function') {
      const handled = await options.onRequest(req, res);
      if (handled) return { bytesSent: 0 };
    }

    /** @type {URL} */
    let url;
    try {
      url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    } catch {
      sendPlain(res, 400, 'Bad Request');
      return { bytesSent: 0 };
    }

    /** @type {string | null} */
    let filePath = resolveSafePath(root, url.pathname);
    if (filePath === null) {
      sendPlain(res, 400, 'Bad Request');
      return { bytesSent: 0 };
    }

    /** @type {import('node:fs').Stats | null} */
    let stats = await statSafe(filePath);

    if (stats && stats.isDirectory()) {
      for (const name of options.indexFiles) {
        const candidate = join(filePath, name);
        const candidateStats = await statSafe(candidate);
        if (candidateStats && candidateStats.isFile()) {
          filePath = candidate;
          stats = candidateStats;
          break;
        }
      }
    }

    if ((!stats || !stats.isFile()) && options.spaFallback) {
      const fallbackName = options.indexFiles[0] ?? 'index.html';
      const fallbackPath = join(root, fallbackName);
      const fallbackStats = await statSafe(fallbackPath);
      if (fallbackStats && fallbackStats.isFile()) {
        filePath = fallbackPath;
        stats = fallbackStats;
      }
    }

    if (!stats || !stats.isFile()) {
      sendPlain(res, 404, 'Not Found');
      return { bytesSent: 0 };
    }

    const etag = makeETag(stats);
    const lastModified = stats.mtime.toUTCString();
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];

    const notModified =
      (ifNoneMatch && ifNoneMatch === etag) ||
      (!ifNoneMatch &&
        typeof ifModifiedSince === 'string' &&
        Date.parse(ifModifiedSince) >= stats.mtime.getTime());

    if (notModified) {
      /** @type {Record<string, string>} */
      const headers = { ETag: etag, 'Last-Modified': lastModified };
      if (options.cors) headers['Access-Control-Allow-Origin'] = '*';
      res.writeHead(304, headers);
      res.end();
      return { bytesSent: 0 };
    }

    const extension = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES.get(extension) ?? 'application/octet-stream';

    /** @type {Record<string, string>} */
    const headers = {
      'Content-Type': contentType,
      'Content-Length': String(stats.size),
      'Last-Modified': lastModified,
      ETag: etag,
      'Cache-Control': options.cacheControl,
      'X-Content-Type-Options': 'nosniff',
    };
    if (options.cors) headers['Access-Control-Allow-Origin'] = '*';

    if (method === 'HEAD') {
      res.writeHead(200, headers);
      res.end();
      return { bytesSent: 0 };
    }

    res.writeHead(200, headers);
    const stream = createReadStream(filePath);
    stream.on('error', (error) => {
      logError(options.logger, `Read stream error for ${filePath}: ${error.message}`);
      res.destroy();
    });
    res.on('close', () => stream.destroy());
    stream.pipe(res);

    return { bytesSent: stats.size };
  }

  const server = createServer((req, res) => {
    const startedAt = process.hrtime.bigint();
    
    handle(req, res)
      .then((result) => {
        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        const sizeInfo = result.bytesSent > 0 ? ` Send ${result.bytesSent} bytes` : '';
        
        logInfo(
          options.logger,
          `${req.method ?? 'GET'} ${req.url ?? '/'} -> ${res.statusCode}${sizeInfo} (${elapsedMs.toFixed(1)}ms)`,
        );
      })
      .catch((error) => {
        const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
        logError(options.logger, `Unhandled error: ${detail}`);
        if (!res.headersSent) sendPlain(res, 500, 'Internal Server Error');
        else res.destroy();

        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
        logInfo(
          options.logger,
          `${req.method ?? 'GET'} ${req.url ?? '/'} -> 500 (${elapsedMs.toFixed(1)}ms)`,
        );
      });
  });

  server.on('clientError', (_error, socket) => {
    if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  return server;
}

/**
 * Parse `process.argv`-style arguments into {@link ServerOptions}.
 *
 * @param {readonly string[]} argv  Full argv array (including node and script).
 * @returns {ServerOptions & { help?: boolean }}
 */
function parseCliArgs(argv) {
  /** @type {ServerOptions & { help?: boolean }} */
  const result = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--port':
        result.port = Number(argv[++i]);
        break;
      case '--host':
        result.host = argv[++i];
        break;
      case '--root':
        result.root = argv[++i];
        break;
      case '--index':
        result.indexFiles = [argv[++i]];
        break;
      case '--spa':
        result.spaFallback = true;
        break;
      case '--cors':
        result.cors = true;
        break;
      case '-h':
      case '--help':
        result.help = true;
        break;
      default:
        if (arg.startsWith('--')) throw new Error(`Unknown option: ${arg}`);
    }
  }
  return result;
}

/**
 * Print CLI usage to stdout.
 *
 * @returns {void}
 */
function printHelp() {
  console.log(
    [
      'live — zero-dependency ES module static server',
      '',
      'Usage:',
      '  node live.js [options]',
      '',
      'Options:',
      '  --root <dir>   Directory to serve        (default: script directory)',
      '  --port <n>     TCP port                  (default: 3000)',
      '  --host <addr>  Bind address              (default: 0.0.0.0)',
      '  --index <file> Index filename            (default: index.html)',
      '  --spa          Enable SPA history fallback',
      '  --cors         Enable permissive CORS',
      '  -h, --help     Show this help',
    ].join('\n'),
  );
}

/**
 * Return `true` when the module is executed directly via `node live.js`.
 *
 * @returns {boolean}
 */
function isEntryPoint() {
  if (!process.argv[1]) return false;
  return resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

/**
 * CLI entry point: parse args, start listening, install signal handlers.
 *
 * @returns {import('node:http').Server}
 */
function main() {
  let cliOptions;
  try {
    cliOptions = parseCliArgs(process.argv);
  } catch (error) {
    console.error(`[live] Error: ${error.message}`);
    process.exit(1);
  }

  if (cliOptions.help) {
    printHelp();
    process.exit(0);
  }

  const server = createStaticServer(cliOptions);
  const port = cliOptions.port ?? DEFAULT_OPTIONS.port;
  const host = cliOptions.host ?? DEFAULT_OPTIONS.host;
  const root = resolve(cliOptions.root ?? DEFAULT_OPTIONS.root);

  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;
    
    console.log(`[live] serving ${root}`);
    console.log(`[live] listening on http://${displayHost}:${actualPort}`);
  });

  server.on('error', (error) => {
    console.error(`[live] server error: ${error.message}`);
    process.exit(1);
  });

  /** @param {string} signal */
  const shutdown = (signal) => {
    console.log(`\n[live] ${signal} received, closing...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}

if (isEntryPoint()) {
  main();
}