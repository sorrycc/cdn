#!/usr/bin/env node

try {
  var spm = require('spm');
  spm.plugin.install({
    name: 'cdn',
    binary: 'cdn',
    description: 'upload a image to alipay cdn.'
  });
} catch(e) {
  console.log(' you need install spm to register the program');
  console.log();
  console.log('$ npm install spm -g');
  console.log();
  console.log(" if you have installed spm, it maybe you haven't set a NODE_PATH environment variable");
  console.log();
}
