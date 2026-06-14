import asyncio
import random
from datetime import datetime
from fastapi import FastAPI
import socketio
import uvicorn

app = FastAPI()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

tracking_task_started = False

# Estado simulado de funcionarios (Coordenadas iniciales en Manizales)
simulated_officials = [
    {"id_official": 1, "latitude": 5.06889, "longitude": -75.51738}, # Cerca a la Alcaldía
    {"id_official": 2, "latitude": 5.0558, "longitude": -75.4950},  # Hacia el Cable
    {"id_official": 3, "latitude": 5.0710, "longitude": -75.5250}   # Hacia Chipre
]

@app.get("/")
async def home():
    return {"message": "Socket.IO Tracking Server Running"}

async def simulate_tracking():
    while True:
        await asyncio.sleep(5) # Emitir cada 5 segundos
        
        updated_officials = []
        current_time = datetime.now().isoformat()
        
        for official in simulated_officials:
            # Simular movimiento sumando pequeños desplazamientos (aprox 10-20 metros)
            official["latitude"] += random.uniform(-0.0002, 0.0002)
            official["longitude"] += random.uniform(-0.0002, 0.0002)
            
            updated_officials.append({
                "id_official": official["id_official"],
                "latitude": official["latitude"],
                "longitude": official["longitude"],
                "last_gps_update": current_time
            })

        payload = { "officials": updated_officials }
        
        # Emitir el evento definido en el README
        await sio.emit("official_tracking", payload)
        print(f"Tracking emitido a las {current_time}")

@sio.event
async def connect(sid, environ, auth):
    global tracking_task_started
    print(f"Cliente conectado: {sid}")
    
    if not tracking_task_started:
        sio.start_background_task(simulate_tracking)
        tracking_task_started = True

@sio.event
async def disconnect(sid):
    print(f"Cliente desconectado: {sid}")

# Endpoints HTTP Mock para Start/Stop
@app.post("/api/officials/tracking/start")
async def start_tracking(payload: dict):
    # Simula la respuesta del README
    return {
        "ignored": { "inactive": [], "invalid": [], "missing": [], "missing_coords": [] },
        "started_ids": payload.get("ids", [])
    }

@app.post("/api/officials/tracking/stop")
async def stop_tracking(payload: dict):
    ids = payload.get("ids", [])
    # Simula la respuesta del README
    return {
        "invalid": [], "not_tracking": [], "stopped_all": len(ids) == 0, "stopped_ids": ids
    }

if __name__ == "__main__":
    uvicorn.run(socket_app, host="0.0.0.0", port=6001, reload=False)