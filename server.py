import sys
import urllib.request
import urllib.parse
import json
from http.server import SimpleHTTPRequestHandler, HTTPServer

class ProxyHTTPRequestHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        # Якщо клієнт звертається до нашого /api
        if self.path.startswith('/api'):
            # Витягуємо ключове слово з параметрів (наприклад, ?keyword=Falcon)
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            keyword = query_params.get('keyword', [''])[0]

            # Формуємо URL для зовнішнього API (Варіант 4) [cite: 467, 472, 473]
            safe_keyword = urllib.parse.quote(keyword)
            external_url = f"https://ll.thespacedevs.com/2.2.0/launch/?mode=list&search={safe_keyword}"

            try:
                # Робимо запит до thespacedevs (додаємо User-Agent, щоб API нас не заблокувало)
                req = urllib.request.Request(external_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response:
                    data = response.read()

                # Відправляємо отримані дані клієнту
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(data)

            except Exception as e:
                # Якщо сталася помилка на зовнішньому сервері
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            # Для всіх інших запитів (/, /script.js, /style.css) віддаємо файли [cite: 500, 501]
            if self.path == '/':
                self.path = '/index.html'
            return super().do_GET()

if __name__ == '__main__':
    # Порт за замовчуванням 8000, але його можна змінити через аргумент 
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
        
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHTTPRequestHandler)
    print(f"Сервер успішно запущено! Відкрий у браузері: http://localhost:{port}")
    httpd.serve_forever()