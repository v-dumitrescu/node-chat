const http = require('http');
const path = require('path');

const express = require('express');
const socketio = require('socket.io');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
  socket.emit('welcome');

  io.on('disconnect', () => {

  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
