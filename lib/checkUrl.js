module.exports = function(url, onSuccess, onFailure) {

    var isHttps = (url.indexOf('https') === 0);

    require(isHttps ? 'https' : 'http').get(url, function(res) {
        if (res.statusCode === 200) {
            onSuccess.call(null);
        } else {
            onFailure.call(res.statusCode);
        }
    }).on('error', onFailure);

};

