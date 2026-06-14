import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { OfficialTrackingPayload } from '../models/tracking'; // Asegúrate de ajustar la ruta

@Injectable({
  providedIn: 'root'
})
export class TrackingSocketService {
  private socket: Socket | undefined;
  
  // TODO: Mover a tu archivo environment
  private readonly socketUrl = 'http://localhost:6001'; 
  
  // Subject para emitir los datos de tracking a los componentes suscritos
  private trackingUpdates$ = new Subject<OfficialTrackingPayload>();

  constructor() {}

  /**
   * Inicia la conexión con el servidor Socket.IO
   */
  connect(): void {
    if (!this.socket || this.socket.disconnected) {
      this.socket = io(this.socketUrl, {
        // Opciones de configuración (opcional)
        transports: ['websocket', 'polling'] 
      });

      this.socket.on('connect', () => {
        console.log('🟢 Conectado al servidor de tracking (Socket.IO)');
      });

      // Escuchamos el evento 'official_tracking' proveniente del backend
      this.socket.on('official_tracking', (data: OfficialTrackingPayload) => {
        // Emitimos la nueva data a los componentes de Angular
        this.trackingUpdates$.next(data);
      });

      this.socket.on('disconnect', () => {
        console.log('🔴 Desconectado del servidor de tracking (Socket.IO)');
      });
    }
  }

  /**
   * Cierra la conexión de forma segura
   */
  disconnect(): void {
    if (this.socket && this.socket.connected) {
      this.socket.disconnect();
    }
  }

  /**
   * Retorna un Observable al que el componente del mapa puede suscribirse
   * para recibir las coordenadas en tiempo real.
   */
  getTrackingUpdates(): Observable<OfficialTrackingPayload> {
    return this.trackingUpdates$.asObservable();
  }
}