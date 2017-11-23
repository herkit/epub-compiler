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
            _attr: { "full-path": "out.opf", "media-type":"application/oebps-package+xml" }
            } 
          }
        ]
      }
    ]
  }
], { declaration: true }));


var opf = [
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
  }
];

console.log(xml(opf, { declaration: true } ));

zip.file('out.opf', xml(opf, { declaration: true } ));
zip.file('content.html', '<html>This is the e-book content</html>');

/*zip.file('toc.ncx', '<?xml version=\'1.0\' encoding=\'utf-8\'?> \
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="en"> \
  <head> \
    <meta content="e63567de-7e37-4bd0-b478-acbeb6e1a3a5" name="dtb:uid"/> \
    <meta content="1" name="dtb:depth"/> \
    <meta content="calibre (3.12.0)" name="dtb:generator"/> \
    <meta content="0" name="dtb:totalPageCount"/> \
    <meta content="0" name="dtb:maxPageNumber"/> \
  </head> \
  <docTitle> \
    <text>Snorre Sturlasøns Kongesagaer</text> \
  </docTitle> \
  <navMap/> \
</ncx>');*/

zip
.generateNodeStream({type:'nodebuffer',streamFiles:true})
.pipe(fs.createWriteStream('out.zip'))
.on('finish', function () {
    console.log("out.epub written.");
});