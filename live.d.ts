/*
 * live — a zero-dependency static server for ES module front-ends.
 * Copyright (c) 2026 Vectorted
 * https://github.com/Vectorted
 *
 * Released under the MIT License. See the LICENSE file for details.
 */

/**
 * Type declarations for `live.js`.
 *
 * Drop this file next to `live.js`. TypeScript (with
 * `moduleResolution: "node16" | "nodenext" | "bundler"`) will associate the
 * two automatically, so `import { createStaticServer } from './live.js'`
 * gets full IntelliSense and type checking.
 *
 * @packageDocumentation
 */

import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { Stats } from 'node:fs';

/**
 * Minimal logger contract. Both methods are optional; missing methods are
 * silently ignored.
 */
export interface Logger {
  /** Called for informational lines (request log, startup banner, …). */
  info?(message: string): void;
  /** Called for error lines (stream errors, unhandled handler errors, …). */
  error?(message: string): void;
}

/**
 * Hook executed before the static handler.
 *
 * Return `true` (or a Promise resolving to `true`) to indicate the request
 * has been fully handled and the static handler must not run.
 *
 * @example
 * ```ts
 * const onRequest: RequestHook = async (req, res) => {
 *   if (req.url?.startsWith('/api/')) {
 *     res.writeHead(200, { 'Content-Type': 'application/json' });
 *     res.end('{"ok":true}');
 *     return true;
 *   }
 *   return false;
 * };
 * ```
 */
export type RequestHook = (
  req: IncomingMessage,
  res: ServerResponse,
) => boolean | Promise<boolean>;

/**
 * Options accepted by {@link createStaticServer}.
 */
export interface ServerOptions {
  /**
   * Absolute or relative directory to serve.
   * Defaults to the directory of `live.js`.
   */
  root?: string;

  /**
   * TCP port used by the CLI. Defaults to `3000`.
   * Ignored by {@link createStaticServer}; call `server.listen` yourself.
   */
  port?: number;

  /**
   * Bind address used by the CLI. Defaults to `'0.0.0.0'`.
   * Ignored by {@link createStaticServer}; call `server.listen` yourself.
   */
  host?: string;

  /**
   * When `true`, unknown paths fall back to the first index file.
   * Useful for client-side routers using `history` mode.
   * Defaults to `false`.
   */
  spaFallback?: boolean;

  /**
   * Value for the `Cache-Control` header.
   * Defaults to `'no-cache'` (browsers revalidate via ETag).
   */
  cacheControl?: string;

  /**
   * Candidate index filenames for directory requests.
   * Defaults to `['index.html']`.
   */
  indexFiles?: readonly string[];

  /**
   * When `true`, emit permissive CORS headers and answer preflight requests.
   * Defaults to `false`.
   */
  cors?: boolean;

  /**
   * Logger used by the request pipeline.
   * Defaults to `console`.
   */
  logger?: Logger;

  /**
   * Optional hook to intercept requests before static resolution.
   * See {@link RequestHook}.
   */
  onRequest?: RequestHook;
}

/**
 * Fully-resolved default options. Mutating this object has no effect on
 * existing servers (it is deep-frozen).
 */
export const DEFAULT_OPTIONS: Readonly<{
  root: string;
  port: number;
  host: string;
  spaFallback: boolean;
  cacheControl: string;
  indexFiles: readonly string[];
  cors: boolean;
}>;

/**
 * Extension → MIME type map. Keys are lowercase and include the leading dot.
 *
 * JavaScript entries intentionally use `text/javascript`, the current
 * WHATWG/IANA recommended type, so `<script type="module">` and dynamic
 * `import()` work across modern browsers.
 */
export const MIME_TYPES: ReadonlyMap<string, string>;

/**
 * Resolve a request pathname into an absolute filesystem path, refusing any
 * input that would escape `root`.
 *
 * Percent-decodes the pathname, rejects malformed encodings and NUL bytes,
 * collapses `.` / `..` segments, rejects Windows drive-letter segments, and
 * double-checks the resolved path against `root`.
 *
 * @param root        Absolute path to the served directory.
 * @param requestPath Raw `URL.pathname` (still percent-encoded).
 * @returns Absolute filesystem path, or `null` if the path is unsafe.
 */
export function resolveSafePath(
  root: string,
  requestPath: string,
): string | null;

/**
 * Create (but do not start) an HTTP server that statically serves `root`.
 *
 * The returned `http.Server` is not listening yet; call `server.listen(...)`
 * with your preferred port/host. Handy for tests that need an ephemeral port.
 *
 * @param userOptions Options merged over {@link DEFAULT_OPTIONS}.
 * @returns A configured, non-listening HTTP server.
 *
 * @example
 * ```ts
 * import { createStaticServer } from './live.js';
 * import type { AddressInfo } from 'node:net';
 *
 * const server = createStaticServer({ root: './public', spaFallback: true });
 * server.listen(0, '127.0.0.1', () => {
 *   const { port } = server.address() as AddressInfo;
 *   console.log(`http://127.0.0.1:${port}`);
 * });
 * ```
 */
export function createStaticServer(userOptions?: ServerOptions): Server;

/**
 * Stat helper that never throws.
 *
 * @internal
 */
export type StatSafeResult = Stats | null;