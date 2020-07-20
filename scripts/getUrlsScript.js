
var allUrls = document.body.querySelectorAll('a[href^=http]') // Most websites
var googUrls = document.body.querySelectorAll('a[href^="./articles"]') // On news.google.com
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

chrome.runtime.sendMessage({
    content: urlList,
    currentDomain: domain
}, function (response) {
    const lastErr = chrome.runtime.lastError;
    if (lastErr) {
        console.log(`Couldn\'t send message. 
Likely because the background script isn\'t running yet (hang tight!). 
Error message: ` + JSON.stringify(lastErr));
    }
    console.log("myBias URLs logged")
});

// TODO: Implement Mutation observer to hadle scrolling dynamic pages

// // Select the node that will be observed for mutations
// var targetNode = document.body;

// // Options for the observer (which mutations to observe)
// var config = { attributes: true, childList: true, subtree: true };

// // Callback function to execute when mutations are observed
// var callback = function (mutationsList, observer) {
//     targetNode = document.body.querySelector("object");
//     for (var mutation of mutationsList) {
//         if (mutation.type == 'childList') {
//             console.log('A child node has been added or removed.');
//         }
//         else if (mutation.type == 'attributes') {
//             console.log('The ' + mutation.attributeName + ' attribute was modified.');
//         }
//     }
// };

// // Create an observer instance linked to the callback function
// var observer = new MutationObserver(callback);

// // Start observing the target node for configured mutations
// observer.observe(targetNode, config);