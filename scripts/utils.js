// Shared utility functions
function url2Domain(url) {
    var domain = url.replace(/^https?:\/\//, ''); // Strip off https:// and/or http://
    domain = domain.replace(/^[a-zA-Z]*\./, ''); // Strip off anything before the first .
    domain = domain.split('/')[0]; // Get the domain and just the domain (not the path)
    return domain
}


function getRedirectUrl(url, callback = null) {
    // var xhr = new XMLHttpRequest();
    // xhr.open('HEAD', url, true);
    // xhr.onload = function () {
    //     console.log(xhr.responseURL); // http://example.com/test
    // };
    // xhr.send(null);
    $.ajax({
        type: "HEAD",
        async: true,
        cache: false,
        url: url,
    }).done(function (message, text, jqXHR) {
        let headers = jqXHR.getAllResponseHeaders();
        let regexp = /https?:\/\/[a-zA-Z]*.[a-zA-Z]*.com/gm;
        let urls = Array.from(headers.matchAll(regexp), m => m[0]);
        console.log(urls)
        // console.log(message, text, jqXHR.getAllResponseHeaders())
        // console.log(message, text, jqXHR.getResponseHeader('TM-finalURL'))
        // imageData.push([imageTemp[i], jqXHR.getResponseHeader('Content-Length')]);
    });
}