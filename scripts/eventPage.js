// Global cache
var gBiasRatings = {
  allData: null,
  domains: null, // array of domains (keys of allData)
  set: null, // set of domains
  expandedSet: null // array expansion of the set of domains
};

const gDeepURLs = false; // This is a 10x performance hit when set to true...set true only on FB?
const gDebug = true;
// Enum mapping bias rating strings to folder names
const gNoRating = "Not Rated";
const gBiasEnum = {
  "Left": {
    "str": "l",
    "color": [24, 85, 249, 100],
    "score": -1
  },
  "Lean Left": {
    "str": "ll",
    "color": [77, 76, 201, 100],
    "score": -0.5
  },
  "Center": {
    "str": "c",
    "color": [130, 67, 152, 100],
    "score": 0
  },
  "Lean Right": {
    "str": "lr",
    "color": [190, 56, 98, 100],
    "score": 0.5
  },
  "Right": {
    "str": "r",
    "color": [252, 57, 57, 100],
    "score": 1
  },
  "Not Rated": {
    "str": "n",
    "color": [116, 116, 116, 100],
    "score": null
  }
};

/**
 * 
 * @param {String} siteBiasString, bias rating of curent site, one of: 
 * @param {Number} feedBiasRating, current feed bias from -1 to 1, where -1 = L, 1 = R, 0 = C 
 */
function updateIcon(siteBiasString, feedBiasRating) {
  var siteBiasShortString = gBiasEnum[siteBiasString].str // For letter/color in icon
  const badgeText = siteBiasString == gNoRating ? '' : siteBiasShortString.toUpperCase()
  const feedBiasValue = Math.round(((feedBiasRating + 1) * 8) + 1)

  siteBiasShortString = 'w' // For no letter/color in icon
  chrome.browserAction.setIcon({
    path: `./images/ext-images/${siteBiasShortString}-icons/${feedBiasValue}-icon.png`
  }, printErrorCallback);

  chrome.browserAction.setBadgeText({
    text: badgeText
  });

  chrome.browserAction.setBadgeBackgroundColor({
    color: gBiasEnum[siteBiasString].color
  });
}

function printErrorCallback() {
  if (chrome.runtime.lastError) {
    console.warn("There was a (handled) error: ", chrome.runtime.lastError.message);
  } else {
    // Tab exists
  }
}

// Argument of the callback is the bias ratings object
function getBiasRatings(callback) {
  if (gBiasRatings.allData == null) {
    $.getJSON(chrome.extension.getURL('biasRatings.json'), function (biasRatings) {
      gBiasRatings.allData = biasRatings;
      gBiasRatings.domains = Object.keys(biasRatings)
      gBiasRatings.set = new Set(gBiasRatings.domains);
      gBiasRatings.expandedSet = [...gBiasRatings.set]
      callback(gBiasRatings);
    })
  } else {
    callback(gBiasRatings);
  }
}

// Function to crawl links through redirects to find news stories
function getRedirectUrl(url, callback = null) {
  $.ajax({
    type: "HEAD",
    async: true,
    cache: false,
    url: url,
  }).done(function (message, text, jqXHR) {
    let headers = jqXHR.getAllResponseHeaders();
    let regexp = /https?:\/\/[a-zA-Z]*.[a-zA-Z]*.com/gm;
    let urls = Array.from(headers.matchAll(regexp), m => m[0]);
    callback(urls);
  });
}

/**
 * 
 * @param {chrome.tabs.tab} tab, the tab to use to update the icon (i.e. url to use)
 * @param {Number} feedBiasRating, current feed bias from -1 to 1, where -1 = L, 1 = R, 0 = C 
 */
function tabUpdateIcon(tab, feedBiasRating = 0) {
  if (tab.url) {
    getBiasRatings(function (ratings) {
      let domain = url2Domain(tab.url)
      if (gDebug) console.log('Received HTML from:', tab.url)
      siteBiasString = gNoRating
      if (ratings.allData[domain] != null && domain != "") {
        siteBiasString = ratings.allData[domain].rating
        if (gDebug) console.log("Bias rating is: ", siteBiasString);
        updateIcon(siteBiasString, feedBiasRating)
      } else {
        updateIcon(siteBiasString, feedBiasRating)
      }
    });
  }
}


// Run each time the active tab is changed to change the icon
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    tabUpdateIcon(tab);
  });
});


// src: https://stackoverflow.com/questions/6497548/chrome-extension-make-it-run-every-page-load
// Run the background script any time a new page is loaded and becomes the focus to run
// the feed and story bias calculations, and change the icon
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  tabUpdateIcon(tab)
  if (changeInfo.status == 'complete' && tab.active) {
    chrome.tabs.executeScript(tab.id, {
      file: "scripts/getUrlsScript.js"
    }, function () {
      const lastErr = chrome.runtime.lastError;
      if (lastErr) {
        console.log('tab: ' + tab.id + ' lastError: ' + JSON.stringify(lastErr));
      }

      // TODO: A site has been visited for the first time, do stuff!

    });
  }
})

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    const urlList = request.content
    var domainList = []
    if (gDeepURLs) {
      urlList.forEach(function (url) {
        getRedirectUrl(url, function (allURLs) {
          for (deepURL in allURLs) {
            domainList.push(url2Domain(deepURL));
          }
        })
      })
    } else {
      urlList.forEach(function (url) {
        domainList.push(url2Domain(url))
      });
    }
    // Fetch the list of all news site ratings
    getBiasRatings(function (ratings) {
      let domainSet = new Set(domainList);
      let intersection = new Set(ratings.expandedSet.filter(x => domainSet.has(x)));
      if (gDebug) console.log(intersection)
      let numerator = 0;
      let denominator = 0;
      intersection.forEach(function (domain) {
        const ratingString = ratings.allData[domain].rating
        const score = gBiasEnum[ratingString].score
        if (score != null && domain != "") {
          numerator += score
          denominator += 1
        }
      })
      // Use page rating to update overall bias index, it loads to slow for any 1 page
      const pageRating = denominator == 0 ? 0 : (numerator / denominator)
      if (gDebug) console.log("Page rating: ", pageRating)
      // chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
      //   let tab = tabs[0]
      //   tabUpdateIcon(tab, pageRating)
      // });
    });
  });


/////////////////////////////////////////////////////////////////////

// Generally query tabs, src: https://stackoverflow.com/questions/1979583/how-can-i-get-the-url-of-the-current-tab-from-a-google-chrome-extension
// chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//   let url = tabs[0].url;
//   // use `url` here inside the callback because it's asynchronous!
// });


// FIXME: OLD REFERENCE CODE 

// /**
//  * Makes a http request to the iftt webhook specified in options.js
//  * @param {Boolean} turnOn - true if a request to the "Turn On" routine should be made, else false
//  * @param {Function} callback - a callback function to be called, will be passed the status code of the HTTP request as arg
//  */
// const makeReq = (turnOn, callback = null) => {
//   chrome.storage.sync.get({
//     apiKey: "",
//     onEventName: "",
//     offEventName: ""
//   }, function (items) {
//     if (items.apiKey == "" ||
//       items.onEventName == "" ||
//       items.offEventName == "") {
//       chrome.storage.sync.set({
//         apiIsConnected: false
//       });
//     } else {
//       const req = new XMLHttpRequest();
//       const eventName = turnOn ? items.onEventName : items.offEventName;
//       const apiKey = items.apiKey;
//       const baseUrl = "https://maker.ifttt.com/trigger/" + eventName + "/with/key/" + apiKey;
//       const value1 = "1"; // Not used, but can be used in certain routines
//       const value2 = "2"
//       const urlParams = `value1=${value1}&value2=${value2}`;

//       req.open("POST", baseUrl, true);
//       req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//       req.send(urlParams);

//       req.onreadystatechange = function () { // Call a function when the state changes.
//         if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
//           // Update charge symbol on state change
//           navigator.getBattery().then(battery => {
//             updateBatteryLevel(battery.level, battery.charging);
//           });
//           if (callback != null) {
//             callback(this.status)
//             chrome.storage.sync.set({
//               apiIsConnected: true
//             });
//           }
//         }
//       }
//     }
//   });
// }

// /**
//  * Automatically fire the "Turn On" webhook specified in options.js
//  * if the level < minCharge, and the "Turn Off" webhook if 
//  * level > maxCharge
//  * @param {Number} level - The current battery level %, should be between 0 and 100
//  * @param {Boolean} isCharging - True if battery is currently charging, else false
//  */
// const handleBatteryLevel = (level, isCharging) => {
//   level *= 100 // Change to percent
//   chrome.storage.sync.get({
//     maxCharge: 80,
//     minCharge: 20,
//     isActive: true,
//   }, function (items) {
//     if (items.isActive) {
//       if (level >= items.maxCharge && isCharging) {
//         makeReq(false);
//       }
//       if (level <= items.minCharge && !isCharging) {
//         makeReq(true);
//       }
//     }
//   });
// }

// function getBatteryStatus() {
//   navigator.getBattery().then(battery => {
//     updateBatteryLevel(battery.level, battery.charging);
//     handleBatteryLevel(battery.level, battery.charging);
//   });
// }

// chrome.alarms.create('batteryLevel', {
//   when: Date.now() + 1000,
//   periodInMinutes: 2
// });
// chrome.runtime.onInstalled.addListener(getBatteryStatus);
// chrome.alarms.onAlarm.addListener(getBatteryStatus);