// XSS Protection
function htmlEncode(str) {
  return String(str).replace(/[^\w. ]/gi, function (c) {
    return '&#' + c.charCodeAt(0) + ';';
  });
};

// AJAX Call
const setXhrRequest = (method, url, callback) => {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url);
  xhr.addEventListener('readystatechange', callback);
  xhr.send();
};