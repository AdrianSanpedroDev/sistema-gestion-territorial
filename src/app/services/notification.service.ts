import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private socket: Socket;

  constructor() {
    console.log('Inicializando NotificationService, conectando a WebSocket...');
    this.socket = io(environment.socketUrl, {
      transports: ['websocket']
    });
    console.log('Intentando conectar a WebSocket en', environment.socketUrl);

    this.socket.on('connect', () => {
      console.log('Conectado al servidor');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del servidor');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Error conexión:', error);
    });
  }

  onNewNotification(topic:string): Observable<any> {

    return new Observable(observer => {

      this.socket.on(topic, (data) => {
        observer.next(data);
      });

    });
  }
}




