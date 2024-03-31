const socket = io();

let messageAuthor = null;
let sendMessageTo = null;
let privateMessage = false;

const form = document.getElementById('index-form');

form.addEventListener('submit', e => {
  e.preventDefault();

  socket.emit('join', {
    username: e.target.username.value,
    room: e.target.room.value
  }, transformPage);
});

new MutationObserver(domContentLoaded)
  .observe(
    document.querySelector('html'),
    {
      childList: true
    });