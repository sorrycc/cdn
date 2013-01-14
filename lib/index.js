require('colors');
require('shelljs/global');
var fs = require('fs');
var http = require('http');
var needle = require('needle');
var async = require('async');
var path = require('path');

var CheckUrl = require('./checkUrl');
var TYPES = require('./TYPES').TYPES;

var TEMP = '.alicdn-temp';
var isWebResource = false;
var fileName = '';
var type = '';

function main(filePath, onComplete) {

    "use strict";

    async.waterfall([
        // detect file type
        // prepare for upload
        function(callback) {
            var urlReg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
            if (urlReg.test(filePath)) {
                isWebResource = true;
            } else {
                if (!test('-e', filePath)) {
                    console.error((filePath + ' is not existed!').red);
                    return;
                }
                if (test('-d', filePath)) {
                    console.error((filePath + ' is a folder!').red);
                    return;
                }
                if (!test('-f', filePath)) {
                    console.error((filePath + ' is not a regular file!').red);
                    return;
                }
            }
            fileName = require('./fileName').parse(filePath);
            type = require('./checkType').check(fileName);
            if (!type) {
                console.error((filePath + ' is not a valid file!').red);
                console.error('Only accept those type: ' + TYPES.join(' '));
                return; 
            }
            if (isWebResource) {
                CheckUrl.check(filePath, function() {
                    rm('-rf', TEMP);
                    mkdir('-p', TEMP);
                    cd(TEMP);
                    exec('wget ' + filePath, {silent: true});
                    filePath = fileName;
                    callback();
                }, fail);
            } else {
                callback();
            }
        },
        function(callback) {
            console.info('Ready to upload your file: ');
            fs.readFile(filePath, function(err, data) {
                if (err) throw err;
                var info = require('imageinfo')(data);
                var str = '  ' + fileName.cyan + ' @';
                str += ' ' + require('./TYPES').CONTENTS[type];  
                str += ' ' + (data.length/1024.0).toFixed(2) + 'KB';
                if (info.type === 'image') {
                    str += ' ' + info.width + '×' + info.height;
                }
                console.info(str);
                callback();
            });
        },
        function(callback) {
            var configPath = process.env.HOME + '/.cdn_config';
            if (!test('-e', configPath)) {
                configPath = path.resolve(__dirname, '../config.json');
            }
            var Config = JSON.parse(fs.readFileSync(configPath));
            var data = {
                'Filename': {
                    content_type: 'text'
                },
                'filedata': {
                    filename: fileName,
                    file: filePath,
                    content_type: require('./TYPES').CONTENTS[type]
                },
                'username': Config.username,
                'isImportance': '0'
            };
            // upload by git push
            console.info('Uploading by ' + Config.username + '...');
            needle.post(Config.url, data, { multipart: true }, function(error, response, body) {
                if (error || body.stat !== 'ok') {
                    fail();                    
                    return;
                }
                callback(null, body);
            });    
        },
        function(body, callback) {
            if (isWebResource) {
                cd('..');
                rm('-rf', TEMP);
            }

            // check the url is ok
            var hostUrl = 'https://i.alipayobjects.com' + 
                body.info[0].uploadPath.replace('apimg', '') + body.info[0].newName;
            CheckUrl.check(hostUrl, function() {
                console.info('Upload to alipay cdn successfully!');
                console.info('  ➠ '.red + hostUrl.green + ' » ' + fileName.cyan);
                // copy to clipborad in MacOS
                exec('echo "' + hostUrl + '\\c" | pbcopy', {silent: true})
                onComplete();
            }, fail); 
        }
    ]);
}

module.exports = main;

if (!module.parent) {
    main();
}

function fail() {
    console.error(('Fail to Upload ' + fileName + ', sorry.').red);    
}

