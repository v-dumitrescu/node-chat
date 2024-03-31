const { setUser,
  setRoomUsers,
  getUserById,
  getUserByUsername,
  setMessage,
  getPrivateMessages
} = require('./functions/users');

const http = require('http');
const path = require('path');
const express = require('express');
const socketio = require('socket.io');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {

  socket.on('join', (obj, ack) => {
    const { id, username, room, error } = setUser(socket.id, obj.username, obj.room);
    const setUsersList = setRoomUsers(room);

    if (error) {
      return ack(error);
    }

    socket.join(room);
    io.to(room).emit('setUserInRoomList', {
      id,
      username
    });
    //io.to(room).emit('joinMessage', `${username} has joined`);
    socket.broadcast.to(room).emit('joinMessage', `${username} has joined`);
    ack(null, username, room, setUsersList);
  });

  socket.on('room message', ({ to, from, message }, ack) => {
    io.to(to).emit('room message', {
      from,
      message
    });
    setMessage(to, from, message);
    ack(to, from);
  });

  socket.on('private message', ({ to, from, message }, ack) => {
    const id = to;
    const { username } = getUserById(id);
    setMessage(username, from, message);
    const { id: senderId } = getUserByUsername(from);
    const messages = getPrivateMessages(username, from);
    socket.to(id).emit('private message', {
      senderId,
      messages
    });
    ack(username, from);
  });

  socket.on('getPrivateMessages', ({ to, from }, ack) => {
    const id = to;
    const { username } = getUserById(id);
    const messages = getPrivateMessages(username, from);
    ack(messages);
  });

  io.on('disconnect', () => {

  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
