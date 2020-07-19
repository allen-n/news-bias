// Shared utility functions
function url2Domain(url) {
    var domain = url.replace(/^https?:\/\//, ''); // Strip off https:// and/or http://
    domain = domain.replace(/^[a-zA-Z]*\./, ''); // Strip off anything before the first .
    domain = domain.split('/')[0]; // Get the domain and just the domain (not the path)
    return domain
}

/**
 * @param {JSON} json, a JSON object
 * @return {Number} the size of the stringified json 
 */
function jsonLength(json) {
    return JSON.stringify(json).length
}

/**
 * Clear the chrome.storage object (and all user data)
 */
function clearStorage() {
    chrome.storage.sync.clear(function () {
        console.log("All data deleted")
    })
}