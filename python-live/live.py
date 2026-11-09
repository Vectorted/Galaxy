#!/usr/bin/env python3
# -*- coding: utf-8 -*-

#
# live.py — A zero-dependency static server for ES module front-ends.
# Copyright (c) 2026 Vectorted
# https://github.com/Vectorted
#
# Released under the MIT License. See the LICENSE file for details.
#

"""
A zero-dependency static file server tuned for ES module front-ends.

Requires **Python 3.7+**. Run it directly:
    python live.py --port 3000 --root ./

Why this server exists:
- `<script type="module">` and dynamic `import()` are rejected by browsers
  unless JavaScript files are served with a JavaScript MIME type.
- It adds path traversal protection, CORS, optional SPA fallback, and 
  structured logging — without pulling in any dependencies.

@module live
@license MIT
"""

import argparse
import functools
import http.server
import mimetypes
import os
import posixpath
import socketserver
import sys
import urllib.parse

# Force JavaScript and WebAssembly MIME types for ES module compatibility.
mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/javascript', '.mjs')
mimetypes.add_type('application/wasm', '.wasm')

class LiveHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom request handler to override default HTTP behavior.
    """

    def __init__(self, *args, **kwargs):
        """
        Initializes the handler with a specific directory.
        
        Args:
            *args: Variable length argument list.
            **kwargs: Arbitrary keyword arguments.
        """
        directory = kwargs.pop('directory', os.getcwd())
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self):
        """
        Appends custom headers (like CORS) to the response before sending.
        """
        if getattr(self.server, 'cors_enabled', False):
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', '*')
        
        # Prevent MIME sniffing
        self.send_header('X-Content-Type-Options', 'nosniff')
        
        # Cache control
        self.send_header('Cache-Control', 'no-cache')
        
        super().end_headers()

    def do_OPTIONS(self):
        """
        Handles HTTP OPTIONS requests for CORS preflight.
        """
        if getattr(self.server, 'cors_enabled', False):
            self.send_response(204)
            self.end_headers()
        else:
            self.send_error(405, "Method Not Allowed")

    def send_head(self):
        """
        Common code for GET and HEAD commands.
        
        This intercepts the default file resolution to implement SPA fallback
        and logs the file size sent.
        
        Returns:
            file object or None
        """
        path = self.translate_path(self.path)
        
        # Check if path is a directory and try to append index files
        if os.path.isdir(path):
            for index_name in self.server.index_files:
                index_path = os.path.join(path, index_name)
                if os.path.exists(index_path):
                    path = index_path
                    break
        
        # SPA Fallback: If file doesn't exist, serve the main index file
        if not os.path.exists(path) and self.server.spa_fallback:
            fallback_path = os.path.join(self.directory, self.server.index_files[0])
            if os.path.exists(fallback_path):
                path = fallback_path

        # Ensure we don't serve directories directly if we hit here
        if not os.path.exists(path) or os.path.isdir(path):
            self.send_error(404, "File not found")
            return None

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, "File not found")
            return None

        try:
            fs = os.fstat(f.fileno())
            file_size = fs.st_size
            # Store the size on the server instance or handler for logging
            self._bytes_sent = file_size
            
            self.send_response(200)
            self.send_header("Content-Type", self.guess_type(path))
            self.send_header("Content-Length", str(file_size))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise

    def log_request(self, code='-', size='-'):
        """
        Overrides default request logging to match the `live.js` format.
        
        Args:
            code (int): HTTP status code.
            size (int or str): File size in bytes.
        """
        # Determine bytes sent based on whether we returned a file
        bytes_sent = getattr(self, '_bytes_sent', 0) if code == 200 or code == 304 else 0
        size_info = f" Send {bytes_sent} bytes" if bytes_sent > 0 else ""
        
        log_entry = f"{self.command} {self.path} -> {code}{size_info}"
        sys.stdout.write(f"[live] {log_entry}\n")
        sys.stdout.flush()

    def log_error(self, format, *args):
        """
        Overrides default error logging.
        
        Args:
            format (str): Format string.
            *args: Arguments for the format string.
        """
        sys.stderr.write(f"[live] {self.address_string()} - {format%args}\n")
        sys.stderr.flush()


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """
    A threaded HTTP server to handle concurrent requests.
    """
    daemon_threads = True

    def __init__(self, server_address, RequestHandlerClass, index_files, spa_fallback, cors_enabled):
        """
        Initializes the server with custom configuration.
        
        Args:
            server_address (tuple): (host, port) to bind.
            RequestHandlerClass (class): The handler class.
            index_files (list): List of index filenames to look for.
            spa_fallback (bool): Whether to fallback to index for 404s.
            cors_enabled (bool): Whether to add CORS headers.
        """
        self.index_files = index_files
        self.spa_fallback = spa_fallback
        self.cors_enabled = cors_enabled
        super().__init__(server_address, RequestHandlerClass)


def main():
    """
    CLI entry point: parse arguments and start the server.
    """
    parser = argparse.ArgumentParser(
        description="live — zero-dependency ES module static server (Python version)"
    )
    parser.add_argument('--port', type=int, default=3000, help='TCP port (default: 3000)')
    parser.add_argument('--host', type=str, default='0.0.0.0', help='Bind address (default: 0.0.0.0)')
    parser.add_argument('--root', type=str, default=os.getcwd(), help='Directory to serve (default: script directory)')
    parser.add_argument('--index', type=str, default='index.html', help='Index filename (default: index.html)')
    parser.add_argument('--spa', action='store_true', help='Enable SPA history fallback')
    parser.add_argument('--cors', action='store_true', help='Enable permissive CORS')

    args = parser.parse_args()

    # Resolve root to absolute path
    root = os.path.abspath(args.root)
    if not os.path.exists(root):
        print(f"[live] Error: Root directory '{root}' does not exist.")
        sys.exit(1)

    handler = functools.partial(LiveHTTPRequestHandler, directory=root)
    
    try:
        httpd = ThreadingHTTPServer(
            (args.host, args.port), 
            handler, 
            index_files=[args.index],
            spa_fallback=args.spa,
            cors_enabled=args.cors
        )
    except OSError as e:
        print(f"[live] Error: {e}")
        sys.exit(1)

    display_host = '127.0.0.1' if args.host == '0.0.0.0' else args.host
    url = f"http://{display_host}:{args.port}"

    print(f"[live] serving {root}")
    print(f"[live] listening on {url}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[live] SIGINT received, closing...")
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    main()