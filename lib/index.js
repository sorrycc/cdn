require('colors');
require('shelljs/global');
var fs = require('fs');
var http = require('http');
var needle = require('needle');
var async = require('async');

var CheckUrl = require('./checkUrl');
var TYPES = require('./TYPES').TYPES;

var TEMP = '.alihost-temp';
var Config = {
    url: 'https://ecmng.alipay.com/home/uploadFile.json',
    username: 'xingmin.zhu'
};
var isWebResource = false;
var fileName = '';
var type = '';

function main(path) {

    "use strict";

    async.waterfall([
        // detect file type
        // prepare for upload
        function(callback) {
            var urlReg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
            if (urlReg.test(path)) {
                isWebResource = true;
            } else {
                if (!test('-e', path)) {
                    console.error((path + ' is not existed!').red);
                    return;
                }
                if (test('-d', path)) {
                    console.error((path + ' is a folder!').red);
                    return;
                }
                if (!test('-f', path)) {
                    console.error((path + ' is not a regular file!').red);
                    return;
                }
            }
            fileName = require('./fileName').parse(path);
            type = require('./checkType').check(fileName);
            if (!type) {
                console.error((path + ' is not a valid file!').red);
                console.error('alihost only accept those type: ' + TYPES.join(' '));                
                return; 
            }
            if (isWebResource) {
                CheckUrl.check(path, function() {
                    makeTemp();
                    cd(TEMP);
                    exec('wget ' + path, {silent: true});
                    path = fileName;
                    callback();
                }, function() {
                    console.log(('Upload ' + fileName + ' failure for reasons.').red);
                });
            } else {
                callback();            
            }
        },
        function(callback) {
            console.info('Ready to upload your file -> ' + fileName.cyan);    
            var data = {
                'Filename': {
                    content_type: 'text'
                },
                'filedata': {
                    filename: fileName,
                    file: path,
                    content_type: require('./TYPES').CONTENTS[type]
                },
                'username': Config.username,
                'isImportance': '0'
            };
            // upload by git push
            console.info('Uploading...');
            needle.post(Config.url, data, { multipart: true }, function(error, response, body) {
                if (error || body.stat !== 'ok') {
                    console.log(('Upload ' + fileName + ' failure for reasons.').red);
                    return;
                }
                callback(null, body);
            });    
        },
        function(body, callback) {
            if (isWebResource) {
                // post upload
                // clean temp folder
                cleanup();
            }

            // check the url is ok
            var hostUrl = 'https://i.alipayobjects.com/' + 
                body.info[0].uploadPath.replace('apimg', '') + body.info[0].newName;
            CheckUrl.check(hostUrl, function() {
                console.log('Upload ' + fileName.cyan + ' successed!');
                console.log('➠  ' + hostUrl.green);
            }, function() {
                console.log(('Upload ' + fileName + ' failure for reasons.').red);        
            }); 
        }
    ]);
}

function makeTemp() {
    rm('-rf', TEMP);
    mkdir('-p', TEMP);
}

function cleanup() {
    cd('..');   
    rm('-rf', TEMP);
}

exports.main = main;

if (!module.parent) {
    main();
}
