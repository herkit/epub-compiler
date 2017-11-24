var JSZip = require('jszip');
var fs = require("fs");
var zip = JSZip();
var xml = require('xml');
var uuidv4 = require('uuid/v4');

zip.file('mimetype', 'application/epub+zip', { compression: 'STORE'});

var id = uuidv4();

var project = {
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

var metaInf = zip.folder('META-INF');
metaInf.file('container.xml', xml([
  {
    container: [
      { _attr: { version: "1.0", xmlns: "urn:oasis:names:tc:opendocument:xmlns:container" } },
      { rootfiles: 
        [
          { rootfile: { 
            _attr: { "full-path": "content.opf", "media-type":"application/oebps-package+xml" }
            } 
          }
        ]
      }
    ]
  }
], { declaration: true }));


project.content.forEach(function(content, i) {
  if (content.id === undefined)
    content.id = 'id' + (i + 1);
});

var opfxml = xml(generateOpf(project));
console.log(opfxml, { declaration: true } );

zip.file('content.opf', opfxml);

project.content.forEach(function(item, i) {
  zip.file(item.name, item.content);  
})

var toc = xml(generateTOC(), { declaration: true } );

console.log(toc);

zip.file('toc.ncx', toc);

zip
.generateNodeStream({type:'nodebuffer',streamFiles:true})
.pipe(fs.createWriteStream('out.epub'))
.on('finish', function () {
    console.log("out.epub written.");
});


function generateOpf(project) {
  var opf = 
    { 
      'package': [
        { _attr: { xmlns: "http://www.idpf.org/2007/opf", 'xmlns:dc': 'http://purl.org/dc/elements/1.1/', 'unique-identifier': 'uuid_id', version: '2.0' } },
        { metadata: [
            { 'dc:title': project.meta.title || '[no title]' },
            { 'dc:creator': [
                { _attr: { 'opf:role': 'aut', 'opf:file-as': project.meta.author || '[unknown]' }},
                project.meta.author || '{unknown}'
              ] 
            },
            { 'dc:identifier': [
                { _attr: { 'opf:scheme': 'uuid', 'id': 'uuid_id' } },
                id
              ]
            },
            {
              'dc:date': new Date().toISOString()
            }
          ]
        },
        {
          manifest: 
            project
            .content
            .map(function(content, i) {
              return { item: { _attr: { id: content.id, href: content.name, 'media-type': content.mediaType }}}
            })
            .concat(
              [ { item: { _attr: { id: 'ncx', href: 'toc.ncx', 'media-type': 'application/x-dtbncx+xm'}}}]
            )
        },
        { spine: [
            { _attr: { toc: 'ncx' } },
            { itemref: { _attr: { idref: 'id1' } } }
          ]
        }
      ]
    };

  return opf;
}

function generateTOC() {
  return [
    { ncx: [
        { _attr: { 'xmlns': 'http://www.daisy.org/z3986/2005/ncx/', 'version': '2005-1'/*, 'xml:lang': 'no-NB'*/} },
        { head: 
          [
            { meta: { _attr: { name: 'dtb:uid', content: id } } },
            { meta: { _attr: { name: 'dtb:depth', content: "1" } } },
            { meta: { _attr: { name: 'dtb:generator', content: "epub-compiler" } } },
            { meta: { _attr: { name: 'dtb:totalPageCount', content: "0" } } },
            { meta: { _attr: { name: 'dtb:maxPageNumber', content: "0" } } }
          ]
        },
        { docTitle: 
          [ 
            { text: 'Test publication' } 
          ] 
        },
        { navMap: 
          [
          ]
        }
      ]
    }
  ]
}
