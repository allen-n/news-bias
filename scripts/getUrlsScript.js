


function extractUrls(domNodes = document.body) {
    var allUrls = []
    var googUrls = []
    if (!domNodes) return;
    
    try {
        allUrls = domNodes.querySelectorAll('a[href^=http]') // Most websites
        googUrls = domNodes.querySelectorAll('a[href^="./articles"]') // On news.google.com    
    } catch (error) {
        // TODO: remove this logging, occurs when the domNodes object isn't valid
        console.log(`myBias error parsing urls: ${error}`)
    }


    var domain = window.location.href;
    domain = url2Domain(domain)

    var urlList = [];
    for (i = 0; i < allUrls.length; i++) {
        var url = allUrls[i].href
        urlList.push(url);
    }

    for (i = 0; i < googUrls.length; i++) {
        var url = googUrls[i].href
        urlList.push(url);
    }

    if (allUrls.length == 0) {
        return
    }

    chrome.runtime.sendMessage({
        content: urlList,
        currentDomain: domain
    }, function (response) {
        const lastErr = chrome.runtime.lastError;
        if (lastErr) {
            console.log(`myBias Logging Error: ` + JSON.stringify(lastErr));
        } else {
            console.log("myBias URLs logged")
        }
    });
}

extractUrls()

// Fires constantly:
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

var observer = new MutationObserver(function (mutations, observer) {
    // fired when a mutation occurs
    // console.log(mutations, observer);
    for (let mutation of mutations) {
        for (let node of mutation.addedNodes) {
            extractUrls(node)
        }
    }
    // 
    // ...
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document.body, {
    subtree: true,
    attributes: true,
    childList: true
    //...
});