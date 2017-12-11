var fs = require('fs'), 
    path = require('path'),
    mime = require('mime-types'),
    htmllint = require('htmllint');

exports.EpubProject = function(options) {
  var self = this;
  options = options || {};
  self.options = {
    validateHtml: options.validateHtml || true
  };
  self.meta = {
    author: "me",
    title: "mytitle"
  };
  self.content = new ProjectFolder('', self.options);

  self.save = function(filePath) {
    var proj = self.serialize(path.dirname(filePath));
    fs.writeFile(filePath, JSON.stringify(proj), function(err) {
      if (err)
        console.log(err);
      else
        console.log('Saved project to ' + filePath);
    })
    JSON.stringify(proj);
  }

  self.serialize = function(rootPath) {
    return {
      meta: self.meta,
      content: self.content.serialize(rootPath)
    }
  }
}

function ProjectFolder(name, options) {
  var self = this;
  self.options = options || {};
  self.name = name;
  self.content = [];

  self.addFile = function(file) {
    var file = new ProjectFile(file, self.options);
    self.content.push(file);
    return file;
  }

  self.addFolder = function(folder) {
    var folder = new ProjectFolder(name, self.options);
    self.content.push(folder);
    return folder;
  }

  self.serialize = function(rootPath) {
    return {
      type: 'folder',
      name: self.name,
      content: self
        .content
        .map(
          function(item) { 
            return item.serialize(rootPath); 
          }
        )
    }
  }
}

function ProjectFile(filePath, options) {
  options = options || {};
  var self = this;
  self.name = path.basename(filePath);
  self.filePath = filePath;

  var mediaType = options.mediaType || getMediaType(filePath);

  if (mediaType === 'application/xhtml+xml' && options.validateHtml)
  {
    var file = fs.readFileSync(self.filePath, 'utf8');
    console.log("Linting " + self.filePath);
    htmllint(file, {'line-end-style': false}).then(function(out) { console.log(out); });
  }

  self.mediaType = mediaType;
  self.serialize = function(rootPath) {
    return {
      type: 'file',
      name: self.name,
      mediaType: self.mediaType,
      content: path.posix.relative(rootPath, self.filePath)
    }
  }
}

function getMediaType(filePath) {
  var ext = path.extname(filePath);
  var mediaType = mime.lookup(ext);

  if (mediaType === 'text/html')
    mediaType = 'application/xhtml+xml';

  return mediaType;
}