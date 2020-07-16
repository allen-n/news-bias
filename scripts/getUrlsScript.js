var allUrls = document.body.querySelectorAll('a[href^=http]')
var domainList = [];
for (i = 0; i < allUrls.length; i++) {
    var url = allUrls[i].href
    var domain = url.replace(/^https?:\/\//, ''); // Strip off https:// and/or http://
    domain = domain.replace(/^[a-zA-Z]*\./, ''); // Strip off anything before the first .
    domain = domain.split('/')[0]; // Get the domain and just the domain (not the path)
    domainList.push(domain);
}

chrome.runtime.sendMessage({
    content: domainList
}, function (response) {
    const lastErr = chrome.runtime.lastError;
    if (lastErr) {
        console.log(`Couldn\'t send message. 
        Likely because the background script isn\'t running yet (hang tight!). 
        Error message: ` + JSON.stringify(lastErr));
    }
    console.log("myBias URLs logged")
});