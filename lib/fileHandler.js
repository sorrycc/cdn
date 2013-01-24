require('colors');
require('shelljs/global');
var fs = require('fs');
var needle = require('needle');
var path = require('path');
var async = require('async');
var TYPES = require('./TYPES');
var CheckUrl = require('./checkUrl');
var TEMP = '.alicdn-temp';

var FileHandler = {

    Files: {},

    copyUrls: [],

    init: function(files, onComplete) {
        var that = this;
        if (typeof files === 'string') {
            files = [files];
        }

        this.onComplete = onComplete || function() {};

        files.forEach(function(file) {
            that.Files[file] = {};
            that.Files[file].path = file;
            that.Files[file].key = file;
            that.Files[file].name = require('./fileName').parse(file);
        });
    },

    each: function(fn, callback) {
        var that = this;
        async.forEachSeries(Object.keys(this.Files).sort(), function(item, done) {
            fn(that.Files[item], done);
        }, function() {
            // exit!!!
            if (that.length() <= 0) {
                rm('-rf', TEMP);
                that.onComplete();
                process.exit();
            }
            callback && callback();
        });
    },
    
    error: function(msg, file) {
        console.error(('  ' + file.name + ': ' + msg).red);
        delete this.Files[file.key];
    },

    length: function() {
        return Object.keys(this.Files).length;
    },
    
    strLength: function() {
        var len = this.length();
        if (len === 1) {
            return 'one file';
        } else {
            return len + ' files';
        }
    },

    checkSource: function() {
        console.info('Start check files.');
        this.each(function(file, done) {
            var urlReg = /(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/;
            if (urlReg.test(file.path)) {
                file.webSource = true;
            }
            done();
        });
    },

    checkValidType: function() {
        var that = this;
        this.each(function(file, done) {
            file.type = TYPES.check(file.name);
            if (!file.type) {
                that.error('Invalid! Accept types: ' + TYPES.ACCEPTS.join(' '), file);
            }
            done();
        });
    },

    checkExist: function(callback) {
        var that = this;
        this.each(function(file, done) {
            if (!file.webSource) {
                if (!test('-e', file.path)) {
                    that.error('It is not existed!', file);
                } else if (test('-d', file.path)) {
                    that.error('It is a folder!', file);
                } else if (!test('-f', file.path)) {
                    that.error('It is not a regular file!', file);
                }
                done();
            } else {
                CheckUrl(file.path, function() {
                    mkdir('-p', TEMP);
                    cd(TEMP);
                    exec('wget ' + file.path, {silent: true});
                    cd('..');
                    file.path = TEMP + '/' + file.name;
                    done();
                }, function() {
                    that.error('Can\'t access this web source.', file);
                    done();
                });
            }
        }, callback);
    },

    showInfo: function(callback) {
        var that = this;        
        console.info('Ready to upload ' + this.strLength() + ':');

        this.each(function(file, done) {
            fs.readFile(file.path, function(err, data) {
                var str = '  ' + file.name.cyan;
                var str2 = ' @ ' + file.type;
                str2 += ' ' + (data.length/1024.0).toFixed(2) + ' KB';

                // swf file can't read info
                if (file.type.indexOf('flash') === -1) {
                    var info = require('imageinfo')(data);                
                    if (info.type === 'image') {
                        str2 += ' ' + info.width + '✕' + info.height;
                    }
                }
                console.info(str + str2.magenta);
                done();
            });
        }, callback);
    },

    prepareUpload: function() {
        var that = this;
        var configPath = process.env.HOME + '/.cdn_config';
        if (!test('-e', configPath)) {
            configPath = path.resolve(__dirname, '../config.json');
        }
        this.Config = JSON.parse(fs.readFileSync(configPath));
        this.each(function(file, done) {
            file.data = {
                'Filename': {
                    content_type: 'text'
                },
                'filedata': {
                    filename: file.name,
                    file: file.path,
                    content_type: file.type
                },
                'username': that.Config.username,
                'isImportance': '0'
            };
            done();
        });
    },

    upload: function(callback) {
        var that = this;

        console.info('Uploading by ' + this.Config.username.grey + ' ...');
        this.each(function(file, done) {
            file.data && needle.post(that.Config.url, file.data, { multipart: true }, function(error, response, body) {
                if (error || body.stat !== 'ok') {
                    var msg;
                    if (error) {
                        msg = error;
                    } else if (body && body.message) {
                        msg = body.message;
                    }
                    that.error(msg, file);
                    done();                    
                } else {
                    that._postOneFileUpload(file, body.info[0], done);
                }
            });
        }, callback);
    },

    _postOneFileUpload: function(file, body, done) {
        var hostUrl;
        var that = this;

        var uploadPath = body.uploadPath;
        if (uploadPath.indexOf('assets') !== -1) {
            hostUrl = 'https://a.alipayobjects.com' + 
            uploadPath.replace('assets', '/u') + body.newName;
        } else {
            hostUrl = 'https://i.alipayobjects.com' + 
            uploadPath.replace('apimg', '') + body.newName;
        }

        CheckUrl(hostUrl, function() {
            console.info('  ➠ '.red + hostUrl.green + ' » ' + file.name.cyan);
            that.copyUrls.push(hostUrl);
            done();
        }, function() {
            that.error('Fail to Upload it, sorry.', file);
            done();
        });
    },

    postUpload: function() {
        // clear .alicdn-temp
        rm('-rf', TEMP);

        console.info('Upload ' + this.strLength() + ' to alipay cdn successfully!');
        this.onComplete(this.copyUrls.length > 1 ? this.copyUrls[0] : this.copyUrls);            
        // copy to clipborad in MacOS
        exec('echo "' + this.copyUrls.join('\\n') + '\\c" | pbcopy', {silent: true});
    }

};

module.exports = FileHandler;
