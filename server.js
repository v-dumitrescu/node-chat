const { setUser, setRoomUsers } = require('./functions/users');
const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
let element;

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {

  socket.on('join', (obj, ack) => {
    const { username, room, error } = setUser(obj.username, obj.room);
    const setUsersList = setRoomUsers(room);

    if(error) {
      return ack(error);
    }

    socket.join(room);
    io.to(room).emit('setUserInList', username);
    io.to(room).emit('joinMessage', `${username} has joined`);
    ack(null, username, setUsersList);
  });

  io.on('disconnect', () => {

  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
