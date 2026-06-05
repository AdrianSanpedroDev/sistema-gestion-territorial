import asyncio

from fastapi import FastAPI
import socketio
import uvicorn

app = FastAPI()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

socket_app = socketio.ASGIApp(
    sio,
    other_asgi_app=app
)

notifications_task_started = False


@app.get("/")
async def home():
    return {"message": "Socket.IO Server Running"}


async def send_notifications():
    contador = 1

    while True:
        await asyncio.sleep(5)

        notification = {
            "id": contador,
            "img": "https://cdn-icons-png.flaticon.com/512/1827/1827349.png",
            "title": f"Nueva notificación {contador}",
            "subtitle": "¡Tienes una nueva notificación!"
        }

        await sio.emit("new_notification", notification)

        print(f"Notificación enviada {contador}")

        contador += 1


@sio.event
async def connect(sid, environ, auth):
    global notifications_task_started

    print(f"Cliente conectado: {sid}")

    if not notifications_task_started:
        sio.start_background_task(send_notifications)
        notifications_task_started = True


@sio.event
async def disconnect(sid):
    print(f"Cliente desconectado: {sid}")


if __name__ == "__main__":
    uvicorn.run(
        socket_app,
        host="0.0.0.0",
        port=6001,
        reload=False
    )
    
    
    
    
    
    
    