exports.check = function(fileName) {

    var type;

    require('./TYPES').TYPES.forEach(function(item) {
        var reg = new RegExp('\\' + item + '$', 'gi');
        if (reg.test(fileName)) {
            type = item;
            return;
        }
    });

    return type;

};
