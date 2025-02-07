const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3001 });
let players = {};

server.on('connection', (socket) => {
  let playerId = null;

  socket.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'register') {
      playerId = data.id;
      players[playerId] = socket;
      console.log(`Joueur ${playerId} connecté`);
    } else if (data.type === 'signal' && players[data.target]) {
      players[data.target].send(JSON.stringify({ type: 'signal', data: data.data, from: playerId }));
    }
  });

  socket.on('close', () => {
    if (playerId) delete players[playerId];
    console.log(`Joueur ${playerId} déconnecté`);
  });
});

console.log('Serveur WebSocket de signalisation lancé sur ws://localhost:3001');
