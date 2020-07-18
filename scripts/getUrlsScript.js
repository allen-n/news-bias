
var allUrls = document.body.querySelectorAll('a[href^=http]') // Most websites
var googUrls = document.body.querySelectorAll('a[href^="./articles"]') // On news.google.com

var urlList = [];
for (i = 0; i < allUrls.length; i++) {
    var url = allUrls[i].href
    urlList.push(url);
}

for (i = 0; i < googUrls.length; i++) {
    var url = googUrls[i].href
    urlList.push(url);
}

chrome.runtime.sendMessage({
    content: urlList
}, function (response) {
    const lastErr = chrome.runtime.lastError;
    if (lastErr) {
        console.log(`Couldn\'t send message. 
Likely because the background script isn\'t running yet (hang tight!). 
Error message: ` + JSON.stringify(lastErr));
    }
    console.log("myBias URLs logged")
});