var JSZip = require('jszip');
var fs = require("fs");
var xml = require('xml');
var uuidv4 = require('uuid/v4');
var path = require('path');

module.exports.compile = function(project) {
  var zip = JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE'});

  if (project.id === undefined)
    project.id = uuidv4();

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

  var opfxml = xml(generateOpf(project));
  console.log(opfxml, { declaration: true } );

  zip.file('content.opf', opfxml);
  console.log(project.basePath);

  var flatcontent = flattenContent(project, '', idProvider());
  console.log(flatcontent);
  flatcontent.forEach(function(item, idx) {
    switch(item.type) {
      case 'content':
        zip.file(item.path, item.content, { compression: 'DEFLATE' });
        break;
      case 'file':
        var data = fs.readFileSync(path.join(project.basePath, item.src));
        zip.file(item.path, data, { compression: 'DEFLATE' });
        break;
      default:
        console.log('No compile action for item type: ' + item.type);
    }
    console.log(item);
    console.log(path.join(project.basePath, item.src));
  });


  var toc = xml(generateTOC(project), { declaration: true } );

  console.log(toc);

  zip.file('toc.ncx', toc);

  zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
        level: 9
    }
  })
  .then(function(content) {
    fs.writeFile(project.output.filename, content, function(err) {
      if (err)
        return console.log(err);
      console.log(project.output.filename + " written.");
    });
  });
}

function flattenContent(item, basePath, idprovider) {
  switch (item.type) {
    case "file":
      return [ {
        "path": path.posix.join(basePath, item.name),
        "type": item.type,
        "mediaType": item.mediaType,
        "id": idprovider.getId(item.mediaType),
        "src": item.content
      } ];
    case "content":
      return [ {
        "path": path.posix.join(basePath, item.name),
        "type": item.type,
        "mediaType": item.mediaType,
        "id": idprovider.getId(item.mediaType),
        "src": item.content
      } ];
    case undefined:
    case "folder":
      var result = item
        .content
        .map(function(subitem) { 
          return flattenContent(subitem, path.posix.join(basePath, item.name || ''), idprovider);
        })
        .reduce(function(accumulator, currentValue) {
          return accumulator.concat(currentValue);
        }, []);
      return result;
  }
}

function idProvider() {
  var self = this;
  self.nextId = 1;

  self.getId = function(type) {
    var id = 'id' + self.nextId;
    self.nextId++;
    return id;
  }
  
  return self;
}

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
                project.id
              ]
            },
            {
              'dc:date': new Date().toISOString()
            }
          ]
        },
        {
          manifest: 
            flattenContent(project, '', idProvider())
            .map(function(content, i) {
              return { item: { _attr: { id: content.id, href: content.path, 'media-type': content.mediaType }}}
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

function generateTOC(project) {
  return [
    { ncx: [
        { _attr: { 'xmlns': 'http://www.daisy.org/z3986/2005/ncx/', 'version': '2005-1'/*, 'xml:lang': 'no-NB'*/} },
        { head: 
          [
            { meta: { _attr: { name: 'dtb:uid', content: project.id } } },
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
