// Global cache
var gBiasRatings = {
  allData: null,
  domains: null, // array of domains (keys of allData)
  set: null, // set of domains
  expandedSet: null // array expansion of the set of domains
};
// TODO: Deep URL crawl causes 10x performance hit, set true only on FB
const gDeepURLs = false;
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
 * @param {String} domain, a string corresponding to the domain to be stored, i.e. it has been visited 
 */
function storeSiteVisit(domain) {
  getBiasRatings(function (ratings) {
    // number of times this domain was visited or link was seen
    if (ratings.allData[domain] != null && domain != "") {
      chrome.storage.sync.get(domain, function (fetchedDomain) {
        chrome.storage.sync.get({
          totalVisitNumber: 0, // total number times a news site was visited
          averageVisitScore: 0, // average bias score for site visits, between -1 and 1
        }, function (items) {
          if (Object.keys(fetchedDomain).length == 0) {
            fetchedDomain = { visits: 0, linked: 0 }
          } else {
            fetchedDomain = JSON.parse(fetchedDomain[domain])
          }
          const visits = items.totalVisitNumber
          const siteBiasString = ratings.allData[domain].rating
          let score = visits * items.averageVisitScore
          score += gBiasEnum[siteBiasString].score


          var storageObj = {}
          const domainVisits = fetchedDomain.visits + 1
          const domainLinks = fetchedDomain.linked
          const json = JSON.stringify({ 'visits': domainVisits, 'linked': domainLinks })
          storageObj[domain] = json
          chrome.storage.sync.set(storageObj)
          chrome.storage.sync.set({
            totalVisitNumber: visits + 1, // one more visit
            averageVisitScore: score / (visits + 1) // updated score
          })
        })
      })
    }
  })
}

/**
 * 
 * @param {Set<String>} domains, a set of domains corresponding to all news sites linked from the loaded page 
 * @param {bool} storeLinksSeen, if true, the number of times each individual link is seen is stored in chrome storage, this is slower
 */
function storeLinkVisit(domains, storeLinksSeen = true) {
  // TODO: We should ignore links from the domain we are currently on from the count
  // TODO: Fix this function, it hashes domains together so it only counts unique domains on the page
  var numerator = 0;
  var denominator = 0;
  chrome.storage.sync.get({
    averageLinkScore: 0, // average bias score for links shown to client, between -1 and 1
    totalLinksSeen: 0 // total number of links seen be the client
  }, function (items) {
    getBiasRatings(function (ratings) {
      domains.forEach(function (domain) {
        const ratingString = ratings.allData[domain].rating
        const score = gBiasEnum[ratingString].score
        if (score != null && domain != "") {
          numerator += score
          denominator += 1
        }
        if (storeLinksSeen) {
          chrome.storage.sync.get(domain, function (fetchedDomain) {
            // if (gDebug) console.log("Fetched ", domain, " --> ", fetchedDomain)
            if (Object.keys(fetchedDomain).length == 0) {
              fetchedDomain = { visits: 0, linked: 0 }
            } else {
              fetchedDomain = JSON.parse(fetchedDomain[domain])
            }
            var storageObj = {}
            storageObj[domain] = fetchedDomain
            storageObj[domain].linked += 1
            storageObj[domain] = JSON.stringify(storageObj[domain])
            chrome.storage.sync.set(storageObj)
          })
        }
      })
    })
    const pageRating = denominator == 0 ? 0 : (numerator / denominator)
    if (gDebug) console.log("Page rating: ", pageRating)
    const totalScore = items.averageLinkScore * items.totalLinksSeen
    const linksSeen = items.totalLinksSeen + 1
    const score = (totalScore + pageRating) / linksSeen
    chrome.storage.sync.set({
      averageLinkScore: score,
      totalLinksSeen: linksSeen
    })
    if (gDebug) console.log("averageLinkScore: ",
      score, ", totalLinksSeen: ", linksSeen)
  })
}

/**
 * 
 * @param {String} siteBiasString, bias rating of current site, one of: 
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

/**
 * Initializes the following global variables:
 * * gBiasRatings.allData: full rating json object
 * * gBiasRatings.domains: array of domains (keys of allData)
 * * gBiasRatings.set: set of domains
 * * gBiasRatings.expandedSet: array expansion of the set of domains
 * @param {function} callback, a callback function to be called with the bias 
 * ratings json object as the argument, i.e. callback(gBiasRatings.allData)
 */
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
 * @param {bool} storeVisit, if true, stores the visit in associated chrome storage 
 * to calculate 'read articles' score, else doesn't
 */
function tabUpdateIcon(tab, storeVisit = false) {
  getBiasRatings(function (ratings) {
    chrome.storage.sync.get({
      averageVisitScore: 0
    }, function (items) {
      const score = items.averageVisitScore
      let domain = url2Domain(tab.url)
      // if (gDebug) console.log('Received HTML from:', tab.url)
      if (storeVisit) storeSiteVisit(domain)
      siteBiasString = gNoRating
      if (ratings.allData[domain] != null && domain != "") {
        siteBiasString = ratings.allData[domain].rating
        if (gDebug) console.log("Bias rating is: ", siteBiasString);
        updateIcon(siteBiasString, score)
      } else {
        updateIcon(siteBiasString, score)
      }
      // if (gDebug) console.log("Average visit score: ", score)
    });
  });
}


// Run each time the active tab is changed to change the icon
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    tabUpdateIcon(tab);
  });
});


// Run the background script any time a new page is loaded and becomes the focus to run
// the feed and story bias calculations, and change the icon
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url) {
    tabUpdateIcon(tab)
  }
  if (changeInfo.status == 'complete' && tab.active) {
    chrome.tabs.executeScript(tab.id, {
      file: "scripts/getUrlsScript.js"
    }, function () {
      const lastErr = chrome.runtime.lastError;
      if (lastErr) {
        console.log('tab: ' + tab.id + ' lastError: ' + JSON.stringify(lastErr));
      }
      tabUpdateIcon(tab, true);
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
      storeLinkVisit(intersection)
    });
  });
