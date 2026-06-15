import asyncio
import random
from datetime import datetime
from fastapi import FastAPI, Body
import socketio
import uvicorn
import httpx

app = FastAPI()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

tracking_task_started = False
officials_tracking = []

# =====================================================================
# URL BASE DE TU BACKEND (Sin el /api al final)
# =====================================================================
BACKEND_API_URL = "http://127.0.0.1:5000"

# Coordenadas por defecto (Manizales)
DEFAULT_LAT = 5.06889
DEFAULT_LNG = -75.51738

@app.get("/")
async def home():
    return {"message": "Servidor de Tracking Socket.IO Funcionando"}

async def fetch_officials_from_backend():
    """Obtiene los funcionarios REALES del backend"""
    global officials_tracking
    try:
        async with httpx.AsyncClient() as client:
            # 🛑 CORRECCIÓN DE LA RUTA: Agregamos /api/officials
            url = f"{BACKEND_API_URL}/api/officials"
            response = await client.get(url, timeout=10.0)
            
            if response.status_code == 200:
                data = response.json()
                
                # Tu JSON es directamente un array [ {..}, {..} ]
                officials = data if isinstance(data, list) else data.get('items', [])
                
                new_tracking_list = []
                for official in officials:
                    # Buscar si ya estaba para no reiniciar sus coordenadas si ya se estaba moviendo
                    existing = next((o for o in officials_tracking if o["id_official"] == official['id_official']), None)
                    
                    if existing:
                        new_tracking_list.append(existing)
                    else:
                        lat = official.get('last_latitude')
                        lng = official.get('last_longitude')
                        
                        # Si no tienen GPS (null), asignamos la de por defecto + un offset aleatorio 
                        # para que no queden uno encima del otro en el mapa.
                        if lat is None or lng is None:
                            lat = DEFAULT_LAT + random.uniform(-0.01, 0.01)
                            lng = DEFAULT_LNG + random.uniform(-0.01, 0.01)
                            
                        new_tracking_list.append({
                            "id_official": official['id_official'],
                            "name": official.get('name', 'Oficial'),
                            "latitude": lat,
                            "longitude": lng,
                        })
                
                officials_tracking.clear()
                officials_tracking.extend(new_tracking_list)
                
                print(f"✅ Éxito: {len(officials_tracking)} funcionarios cargados desde {url}")
                return True
            else:
                print(f"❌ Error HTTP {response.status_code} al consultar {url}")
                return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {str(e)}")
        return False

async def simulate_tracking():
    """Simula el movimiento de los funcionarios en el mapa"""
    while True:
        await asyncio.sleep(5)  # Emitir cada 5 segundos
        
        if not officials_tracking:
            print("⚠️ No hay funcionarios para trackear. Esperando...")
            continue
        
        updated_officials = []
        current_time = datetime.now().isoformat()
        
        for official in officials_tracking:
            # Movimiento aleatorio
            official["latitude"] += random.uniform(-0.0002, 0.0002)
            official["longitude"] += random.uniform(-0.0002, 0.0002)
            
            updated_officials.append({
                "id_official": official["id_official"],
                "name": official["name"],
                "latitude": official["latitude"],
                "longitude": official["longitude"],
                "last_gps_update": current_time
            })

        payload = {"officials": updated_officials}
        await sio.emit("official_tracking", payload)
        print(f"📡 Tracking emitido a las {current_time} para {len(updated_officials)} funcionarios.")

@sio.event
async def connect(sid, environ, auth):
    global tracking_task_started
    print(f"🔌 Cliente conectado: {sid}")
    
    if not tracking_task_started:
        await fetch_officials_from_backend()
        sio.start_background_task(simulate_tracking)
        tracking_task_started = True

@sio.event
async def disconnect(sid):
    print(f"❌ Cliente desconectado: {sid}")

# Endpoints de control
@app.post("/api/officials/tracking/refresh")
async def refresh_officials():
    success = await fetch_officials_from_backend()
    return {
        "success": success,
        "officials_count": len(officials_tracking),
        "officials": officials_tracking
    }

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=6001, reload=False)