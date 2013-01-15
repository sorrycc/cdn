var async = require('async');
var FileHandler = require('./fileHandler');

function main(files, onComplete) {

    "use strict";

    async.series([
        function(callback) {
            FileHandler.init(files);
            FileHandler.checkSource();
            FileHandler.checkValidType();
            FileHandler.checkExist(callback);
        },
        function(callback) {
            FileHandler.showInfo(callback);
        },
        function(callback) {
            FileHandler.prepareUpload();
            FileHandler.upload(callback);
        },
        function(callback) {
            FileHandler.postUpload(onComplete);
        }
    ]);
}

module.exports = main;

if (!module.parent) {
    main();
}

