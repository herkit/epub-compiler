var compiler = require('./lib/compiler');

compiler.compile(
  {
    meta: {
      title: "Test publication",
      author: "Henrik Grotle"
    },
    content: [
      {
        type: 'content',
        name: 'content.html',
        mediaType: 'application/xhtml+xml',
        content: '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><body>This is the e-book content</body></html>'
      }
    ]
  }
);