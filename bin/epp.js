#! /usr/bin/env node
var path = require('path'),
    epub = require('../lib/project');

var project = new epub.EpubProject();
project.content.addFile('content/test.html');
var fontsFolder = project.content.addFolder('fonts');
fontsFolder.addFile('fonts/arial-regular.otf');


project.save(path.join(process.cwd(), 'test.epp'));