exports.check = function(fileName) {

    var type;

    require('./TYPES').TYPES.forEach(function(item) {
        if (fileName.indexOf(item) !== -1) {
            type = item;
            return;
        }
    });

    return type;

};
