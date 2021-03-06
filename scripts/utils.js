// Shared utility functions

// For saving to local text file:
// https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file

// Shared Flags: 
// TODO: Deep URL crawl causes 10x performance hit, set true only on FB
const gDeepURLs = false;
const gDebug = true;
// Shared Enums:
const gNoRating = "Not Rated";
const gMixed = "Mixed";
const gDeepCrawlDomains = new Set(["facebook.com"]) // domains that deep crawling is done on
const gStorageAPI = chrome.storage.local
// Enum mapping bias rating strings to folder names
//TODO: There is a 'mixed' category, counting it as 'center', handle later
const gBiasEnum = {
  "Left": {
    "str": "l",
    "color": [24, 85, 249, 100],
    "score": -1,
    "rgba": 'rgba(24, 85, 249, 1)'
  },
  "Lean Left": {
    "str": "ll",
    "color": [77, 76, 201, 100],
    "score": -0.5,
    "rgba": 'rgba(77, 76, 201, 1)'
  },
  "Center": {
    "str": "c",
    "color": [130, 67, 152, 100],
    "score": 0,
    "rgba": 'rgba(130, 67, 152, 1)'
  },
  "Mixed": {
    "str": "c",
    "color": [130, 67, 152, 100],
    "score": 0,
    "rgba": 'rgba(130, 67, 152, 1)'
  },
  "Lean Right": {
    "str": "lr",
    "color": [190, 56, 98, 100],
    "score": 0.5,
    "rgba": 'rgba(190, 56, 98, 1)'
  },
  "Right": {
    "str": "r",
    "color": [252, 57, 57, 100],
    "score": 1,
    "rgba": 'rgba(252, 57, 57, 1)'
  },
  "Not Rated": {
    "str": "n",
    "color": [116, 116, 116, 100],
    "score": null,
    "rgba": 'rgba(116, 116, 116, 1)'
  }
};

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
  gStorageAPI.clear(function () {
    callback();
  })
}

/**
 * 
 * @param {Number} score a numeric score between -1 and 1
 * @param {number} max a value to clamp the max to if less than 100 
 * @return percent, the score represented as a percentage between 0 and 100,
 * i.e. -0.5 --> 25, 0 --> 50, -1 --> 0, 1 --> 100  
 */
function scoreToPercent(score, max = 100) {
  let percent = Math.round(50 * (score + 1))
  return percent < max ? percent : max;
}

function downloadObjectAsJson(exportObj, exportName) {
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
  var downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}