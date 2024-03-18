const socket = io();

socket.on('welcome', () => {
  console.log('Connected');
});