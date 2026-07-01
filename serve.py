import http.server
import urllib.request
import os

API_HOST = 'http://localhost:3001'
DIST_DIR = os.path.join(os.path.dirname(__file__), 'client', 'dist')

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/'):
            self.proxy_request('GET')
        elif self.path.startswith('/uploads/'):
            self.proxy_request('GET')
        else:
            file_path = self.translate_path(self.path)
            if os.path.isfile(file_path):
                super().do_GET()
            else:
                self.path = '/'
                super().do_GET()

    def do_POST(self):
        if self.path.startswith('/api/'):
            self.proxy_request('POST')

    def do_PUT(self):
        if self.path.startswith('/api/'):
            self.proxy_request('PUT')

    def do_DELETE(self):
        if self.path.startswith('/api/'):
            self.proxy_request('DELETE')

    def proxy_request(self, method):
        body = None
        length = int(self.headers.get('Content-Length', 0))
        if length > 0:
            body = self.rfile.read(length)
        req = urllib.request.Request(
            f'{API_HOST}{self.path}',
            data=body,
            headers={k: v for k, v in self.headers.items() if k.lower() not in ('host', 'content-encoding')},
            method=method
        )
        try:
            with urllib.request.urlopen(req) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ('transfer-encoding', 'content-encoding'):
                        self.send_header(k, v)
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.end_headers()
            self.wfile.write(e.read())

    def translate_path(self, path):
        path = super().translate_path(path)
        rel = os.path.relpath(path, os.getcwd())
        return os.path.join(DIST_DIR, rel)

if __name__ == '__main__':
    os.chdir(DIST_DIR)
    server = http.server.HTTPServer(('0.0.0.0', 8000), ProxyHandler)
    print('FRED server running on http://localhost:8000')
    print('API proxied to http://localhost:3001')
    server.serve_forever()
