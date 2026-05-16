import threading
import time
import requests
import uvicorn
import webview
import sys
import os

# Ensure the backend module is accessible
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from backend.server import app

def start_server():
    """Starts the FastAPI server using uvicorn."""
    # Run uvicorn in the current thread (which will be a background thread)
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")

def wait_for_server(url="http://127.0.0.1:8000/api/system_status", timeout=15):
    """Waits for the FastAPI server to become responsive."""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print("[✅] Sunucu aktif, arayüz başlatılıyor...")
                return True
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(0.5)
    
    print("[❌] Hata: Sunucu başlatılamadı veya çok yavaş!")
    return False

if __name__ == '__main__':
    print("="*60)
    print("🚀 Akıllı Sentetik Veri Artırım Platformu Başlatılıyor...")
    print("="*60)
    
    # 1. Start FastAPI server in a background thread
    # daemon=True ensures the thread exits when the main program finishes
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # 2. Wait until the server is ready to accept connections
    if wait_for_server():
        # 3. Create and start the native desktop window using pywebview
        window = webview.create_window(
            title='Sentetik Veri Üretim Hattı', 
            url='http://127.0.0.1:8000',
            width=1400, 
            height=900,
            min_size=(1024, 768)
        )
        # start() blocks until the window is closed
        webview.start()
        
        print("\n[ℹ️] Uygulama kapatıldı. Sunucu durduruluyor...")
    else:
        sys.exit(1)
