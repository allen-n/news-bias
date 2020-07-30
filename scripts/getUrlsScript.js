


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

extractUrls();

function destructor() {
    // Destruction is needed only once
    document.removeEventListener(destructionEvent, destructor);
    observer.disconnect();
    delete observer;
    // Persist mutation cache, this is the same page
    // Tear down content script: Unbind events, clear timers, restore DOM, etc.
}

var destructionEvent = 'destructMyBias' + chrome.runtime.id;
// Unload previous content script if needed
document.dispatchEvent(new CustomEvent(destructionEvent));
document.addEventListener(destructionEvent, destructor);

// Fires constantly:
MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var mutationCache = new Set() // Cache to prevent the same mutation from being read twice

var observer = new MutationObserver(function (mutations, observer) {
    // fired when a mutation occurs
    for (let mutation of mutations) {
        if (!mutationCache.has(mutation)) {
            mutationCache.add(mutation);
            for (let node of mutation.addedNodes) {
                extractUrls(node)
            }
        }
    }

});

gStorageAPI.get({
    followDeepLinks: false
}, function (items) {
    if (items.followDeepLinks) {
        // define what element should be observed by the observer
        // and what types of mutations trigger the callback
        observer.observe(document.body, {
            subtree: true,
            attributes: true,
            childList: true

        });
    }
})


