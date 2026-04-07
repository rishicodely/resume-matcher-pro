import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchGateway {
  @WebSocketServer()
  server!: Server;

  notifyCompletion(data: any) {
    this.server.emit('matchCompleted', data);
  }
}
