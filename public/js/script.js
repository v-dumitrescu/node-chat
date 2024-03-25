const socket = io();

const form = document.getElementById('index-form');

function htmlEncode(str) {
  return String(str).replace(/[^\w. ]/gi, function (c) {
    return '&#' + c.charCodeAt(0) + ';';
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();

  socket.emit('join', {
    username: e.target.username.value,
    room: e.target.room.value
  }, (error, username) => {
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
        doc.querySelector('.user-messages').innerHTML += `<p>${htmlEncode(username)} has joined</p>`;
        const setDocInnerHtml = doc.querySelector('html').innerHTML;
        document.querySelector('html').innerHTML = setDocInnerHtml;
      }
    });
    xhr.send();
  });
});

new MutationObserver(() => {
  const setMessagesContainer = document.querySelector('.user-messages');
  socket.on('message', (msg) => {
    setMessagesContainer.innerHTML += `<p>${htmlEncode(msg)}</p>`;
  });
}).observe(
  document.querySelector('html'),
  {
    childList: true
  }
);