const socket = io();

const form = document.getElementById('index-form');

function htmlEncode(str) {
  return String(str).replace(/[^\w. ]/gi, function (c) {
    return '&#' + c.charCodeAt(0) + ';';
  });
}

const fetchUsers = (users, element) => {
  users.forEach(user => {
    element.innerHTML += `
        <li><a href="#">${htmlEncode(user.username)}</a></li>
    `
  });
};

form.addEventListener('submit', e => {
  e.preventDefault();

  socket.emit('join', {
    username: e.target.username.value,
    room: e.target.room.value
  }, (error, username, users) => {
    if (error) {
      return alert(error);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', '../chat.html');
    xhr.addEventListener('readystatechange', function () {
      if (this.status === 200 && this.readyState === 4) {
        const domParser = new DOMParser();
        const responseData = this.responseText;
        const doc = domParser.parseFromString(responseData, 'text/html');
        const sidebarLeft = doc.querySelector('.sidebar-right');
        const usersList = sidebarLeft.querySelector('.users-list');
        fetchUsers(users, usersList);
        doc.querySelector('.user-messages').innerHTML += `<p><em>${htmlEncode(username)} has joined</em></p>`;
        const setDocInnerHtml = doc.querySelector('html').innerHTML;
        document.querySelector('html').innerHTML = setDocInnerHtml;
      }
    });
    xhr.send();
  });
});

new MutationObserver(() => {
  // Elements
  const setMessagesContainer = document.querySelector('.user-messages');
  const setUsersList = document.querySelector('.users-list');
  const chatForm = document.querySelector('#chat-form');
  const button = chatForm.querySelector('button');

  chatForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = e.target['input-msg'];
    button.setAttribute('disabled', true);
    button.style.backgroundColor = '#ccc';
    socket.emit('message', message.value, () => {
      message.value = '';
      message.focus();
      button.removeAttribute('disabled');
      button.style.backgroundColor = '#66CAF2';
     });
  });

  socket.on('joinMessage', msg => {
    setMessagesContainer.innerHTML += `<p class="chat-message"><em>${htmlEncode(msg)}</em></p>`;
  });

  socket.on('message', (msg) => {
    setMessagesContainer.innerHTML += `<p class="chat-message">${htmlEncode(msg)}</p>`;
  });

  socket.on('setUserInList', username => {
    setUsersList.insertAdjacentHTML('beforeend', `<li><a href="#">${htmlEncode(username)}</a></li>`); 
  });

}).observe(
  document.querySelector('html'),
  {
    childList: true
  }
);