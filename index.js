var JSZip = require('jszip');
var fs = require("fs");
var zip = JSZip();
var xml = require('xml');
var uuidv4 = require('uuid/v4');

zip.file('mimetype', 'application/epub+zip', { compression: 'STORE'});
var metaInf = zip.folder('META-INF');

var id = uuidv4();

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

var opfxml = xml(generateOpf());
console.log(opfxml, { declaration: true } );

zip.file('content.opf', opfxml);
zip.file('content.html', '<html>This is the e-book content</html>');

var toc = xml(generateTOC(), { declaration: true } );

console.log(toc);

zip.file('toc.ncx', toc);

zip
.generateNodeStream({type:'nodebuffer',streamFiles:true})
.pipe(fs.createWriteStream('out.zip'))
.on('finish', function () {
    console.log("out.epub written.");
});


function generateOpf() {
  var opf = 
    { 
      'package': [
        { _attr: { xmlns: "http://www.idpf.org/2007/opf", "unique-identifier": "uuid_id", version: "2.0" } },
        { metadata: [
            { 'dc:title': 'Test publication' },
            { 'dc:creator': [
                { _attr: { 'opf:role': 'aut', 'opf:file-as': 'Grotle, Henrik' }},
                "Henrik Grotle"
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
          manifest: [
            { item: { _attr: { id: 'id1', href: 'content.html', 'media-type': 'application/xhtml+xml' } } }
          ]
        },
        { spine: [
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
        { _attr: { 'xmlns': 'http://www.daisy.org/z3986/2005/ncx/', 'version': '2005-1', 'xml:lang': 'no-NB'} },
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
