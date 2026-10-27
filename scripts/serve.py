"""servidor estático local (127.0.0.1) para que Chrome cargue los módulos de vendor/ sin internet"""
import http.server, threading, functools, socket, os
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
def start(root='.'):
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    h = functools.partial(Q, directory=os.path.abspath(root)); srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), h)
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return f'http://127.0.0.1:{port}'
