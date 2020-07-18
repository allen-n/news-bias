// Global cache
var gBiasRatings = {
  allData: null,
  domains: null, // array of domains (keys of allData)
  set: null, // set of domains
  expandedSet: null // array expansion of the set of domains
};

var gDeepURLs = false; // This is a 10x performance hit when set to true...

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

// src: https://stackoverflow.com/questions/6497548/chrome-extension-make-it-run-every-page-load
// Run the background script any time a new page is loaded and becomes the focus
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.active) {
    chrome.tabs.executeScript(tab.id, {
      file: "scripts/getUrlsScript.js"
    }, function () {
      const lastErr = chrome.runtime.lastError;
      if (lastErr) {
        console.log('tab: ' + tab.id + ' lastError: ' + JSON.stringify(lastErr));
      }
      getBiasRatings(function (ratings) {
        let domain = url2Domain(tab.url)
        console.log('Recieved HTML from:', tab.url)
        if (ratings.allData[domain] != null) {
          console.log("Bias rating is: ", ratings.allData[domain].rating);
        }
      });

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
      console.log(intersection)
    });
  });




    // $.getJSON(chrome.extension.getURL('biasRatings.json'), function (biasRatings) {

    //   let ratingSet = new Set(Object.keys(biasRatings)); // keys are the domains
    //   let domainSet = new Set(domainList);
    //   let intersection = new Set([...ratingSet].filter(x => domainSet.has(x)));
    //   console.log(intersection)
    // })


/////////////////////////////////////////////////////////////////////

// Generally query tabs, src: https://stackoverflow.com/questions/1979583/how-can-i-get-the-url-of-the-current-tab-from-a-google-chrome-extension
// chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
//   let url = tabs[0].url;
//   // use `url` here inside the callback because it's asynchronous!
// });


// FIXME: OLD REFERENCE CODE 
// function updateBatteryLevel(level, isCharging) {
//   const batteryLevelText = level !== 1 ? (level * 100).toFixed() : '';
//   const chargingStatus = isCharging ? 'charging' : 'not-charging';

//   chrome.browserAction.setIcon({
//     path: `./images/icon-${chargingStatus}.png`
//   }, error_callback);

//   chrome.browserAction.setBadgeText({
//     text: batteryLevelText
//   });

//   chrome.browserAction.setBadgeBackgroundColor({
//     color: [94, 97, 106, 255]
//   });
// }

// function error_callback() {
//   if (chrome.runtime.lastError) {
//     console.log(chrome.runtime.lastError.message);
//   } else {
//     // Tab exists
//   }
// }


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