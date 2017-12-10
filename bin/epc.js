#! /usr/bin/env node

var path = require('path');
var Parser = require('commandline-parser').Parser,
    parser = new Parser({
        name : "epc",
        desc : 'Epub compiler',
        extra : ''
    });

var resolve = path.resolve;

var compiler = require('../lib/compiler');

var projectfile = resolve(parser.getArguments()[1]);
console.log("Loading " + projectfile);

var fs = require('fs');

fs.readFile(projectfile, 'utf8', function (err, data) {
    if (err) throw err; // we'll not consider error handling for now
    var project = JSON.parse(data);
    var pathInfo = path.parse(projectfile);
    project.basePath = path.dirname(projectfile);
    project.output = { filename: pathInfo.name + '.epub' };
    compiler.compile(project);
});

