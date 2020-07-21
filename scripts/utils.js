// Shared utility functions


/**
 * 
 * @param {string} url a url in the something.domain.com format
 * @return {string} the domain of the passed url, i.e. domain.com 
 */
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
 * @param {function} callback the callback function to be called after all
 * chrome storage data is deleted
 */
function clearStorage(callback) {
    // TODO: refactor to use DataStore abstraction instead of chrome.storage.sync
    chrome.storage.sync.clear(function () {
        callback();
    })
}