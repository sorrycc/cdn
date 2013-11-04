var async = require('async');
var FileHandler = require('./fileHandler');

function main(files, onComplete) {

    var fileHandler = new FileHandler(files, onComplete);

    async.series([
        function(callback) {
            fileHandler.checkSource();
            fileHandler.checkValidType();
            fileHandler.checkExist(callback);
        },
        function(callback) {
            fileHandler.showInfo(callback);
        },
        function(callback) {
            fileHandler.prepareUpload();
            fileHandler.upload(callback);
        },
        function(callback) {
            fileHandler.postUpload();
        }
    ]);
}

module.exports = main;

if (!module.parent) {
    main();
}
