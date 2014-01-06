require('shelljs/global');
var fs = require('fs');
var needle = require('needle');
var path = require('path');
var async = require('async');
var program = require('commander');
var download = require('download');
var TYPES = require('./TYPES');
var CheckUrl = require('./checkUrl');
var TEMP = '.alicdn-temp';

var FileHandler = function(files, onComplete) {
    var that = this;
    this.Files = {};
    this.copyUrls = [];
    this.onComplete = onComplete || function() {};

    if (typeof files === 'string') {
        files = [files];
    }

    files.forEach(function(file) {
        that.Files[file] = {};
        that.Files[file].path = file;
        that.Files[file].key = file;
        that.Files[file].name = require('./fileName').parse(file);
    });
};

FileHandler.prototype = {

    each: function(fn, callback) {
        var that = this;
        async.forEachSeries(Object.keys(this.Files).sort(), function(item, done) {
            fn(that.Files[item], done);
        }, function(err) {
            // exit!!!
            if (that.length() <= 0) {
                rm('-rf', TEMP);
                console.error(('  Something bad happended.').red);
                program.emit('--help');
                that.onComplete(err);
                return;
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
        console.info('Start checking files.');
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
                    var stream = download(file.path, TEMP);
                    var downloaded = function() {
                        file.path = TEMP + '/' + file.name;
                        stream.removeListener('close', downloaded);
                        done();
                    };
                    stream.on('close', downloaded);
                }, function() {
                    that.error('Can\'t access this web source.', file);
                    done(err);
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
                        str2 += ' ' + info.width + 'x' + info.height;
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
                'bizName': that.Config.bizName,
                'token': that.Config.token,
                'isImportance': '0'
            };
            done();
        });
    },

    upload: function(callback) {
        var that = this;

        process.stdout.write('Busy in uploading ☕  ');
        var inter = setInterval(function() {
            process.stdout.write(".");
        }, 1000);


        this.each(function(file, done) {
            file.data && needle.post(that.Config.url, file.data,
                { multipart: true, timeout: 0 }, function(error, response, body) {
                if (inter) {
                    clearInterval(inter);
                    inter = null;
                    console.log();
                }

                if (error || body.stat !== 'ok') {
                    var msg;
                    if (error) {
                        msg = error;
                    } else if (body && body.message) {
                        msg = body.message;
                    } else {
                        msg = JSON.stringify(body);
                    }
                    that.error(msg, file);
                    done(error);
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

        console.info('  ➜  '.red + hostUrl.green + ' ~ ' + file.name.cyan);
        this.copyUrls.push(hostUrl);
        CheckUrl(hostUrl, function() {
            done();
        }, function(err) {
            that.error('Can\'t access cdn url:', file);
            that.error('Maybe something wrong, or check your web.', file);
            done(err);
        });
    },

    postUpload: function() {
        // clear .alicdn-temp
        rm('-rf', TEMP);

        console.info('👍  Uploaded ' + this.strLength() + ' to alipay cdn successfully!');

        // copy to clipborad
        require('cliparoo')(this.copyUrls.join('\\n'), function() {});

        var url = this.copyUrls.length === 1 ? this.copyUrls[0] : this.copyUrls;
        this.onComplete(null, url);
    }

};

module.exports = FileHandler;
