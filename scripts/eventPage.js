// Global cache
var gBiasRatings = {
  allData: null,
  domains: null, // array of domains (keys of allData)
  set: null, // set of domains
  expandedSet: null // array expansion of the set of domains
};
// Flags: 
// TODO: Deep URL crawl causes 10x performance hit, set true only on FB
const gDeepURLs = false;
const gDebug = true;
// Enums:
const gNoRating = "Not Rated";
const gBiasEnum = { // Enum mapping bias rating strings to folder names
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

// Class Defs
/**
 * Manages the bias ratings json and async loads it as necessary
 */
class BiasRatings {
  /**
   * @param {string} jsonName, the name of the bias ratings JSON object (located in ./, else include path)
   * @param {*} $, a reference to the jquery library 
   */
  constructor(jsonName, $) {
    this._biasRatingsObj = {
      allData: null,
      domains: null,
      set: null,
      expandedSet: null
    };
    this._$ = $
    this._jsonName = jsonName
  }

  /**
   * 
   * @param {function} callback callback function to be called after data is loaded
   * as callback(data)
   */
  _loadData(callback = null) {
    var obj = this // this is no longer accessible in closure capture scope, this refers to closure function object
    this._$.getJSON(chrome.extension.getURL(this._jsonName), function (biasRatings) {
      obj._biasRatingsObj.allData = biasRatings;
      obj._biasRatingsObj.domains = Object.keys(biasRatings)
      obj._biasRatingsObj.set = new Set(obj._biasRatingsObj.domains);
      obj._biasRatingsObj.expandedSet = [...obj._biasRatingsObj.set]
      if (callback != null) callback(obj._biasRatingsObj);
    })
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
  getRatings(callback) {
    if (this._biasRatingsObj.allData == null) {
      this._loadData(callback)
    } else {
      callback(this._biasRatingsObj);
    }
  }
}

/**
 * Manages saving data to chrome.storage
 */
class DataStore {
  /**
   * 
   * @param {BiasRatings} Ratings a BiasRatings object that stores the bias ratings
   * of the news site domains being stored
   * @param {chrome.storage} storageAPI either _chrome.storage.sync_ or _chrome.storage.local_. 
   * The chrome storage API to be used for data storage. sync will sync across browsers but 
   * has a 100 kb limit, local is only on the local browser but has a 5 mb limit 
   */
  constructor(Ratings, biasEnum, storageAPI = chrome.storage.sync) {
    this._Ratings = Ratings;
    this._storageAPI = storageAPI
    this._biasEnum = biasEnum;
  }

  /**
   * Wrapper for the chrome.storage.sync (or local) get api. 
   * @param {JSON} json object to get from chrome storage, in the format {key: default_value}
   * @param {Function} callback the callback function to be called after the desired object is loaded, i.e. callback(result_json)
   */
  get(json, callback) {
    this._storageAPI.get(json, callback)
  }

  /**
   * 
   * @param {String} domain, a string corresponding to the domain to be stored, i.e. it has been visited 
   */
  storeSiteVisit(domain) {
    var self = this;
    this._Ratings.getRatings(function (ratings) {
      // number of times this domain was visited or link was seen
      if (ratings.allData[domain] != null && domain != "") {
        self._storageAPI.get(domain, function (fetchedDomain) {
          self._storageAPI.get({
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
            score += self._biasEnum[siteBiasString].score


            var storageObj = {}
            const domainVisits = fetchedDomain.visits + 1
            const domainLinks = fetchedDomain.linked
            const json = JSON.stringify({ 'visits': domainVisits, 'linked': domainLinks })
            const newScore = score / (visits + 1);
            storageObj[domain] = json
            self._storageAPI.set(storageObj)
            self._storageAPI.set({
              totalVisitNumber: visits + 1, // one more visit
              averageVisitScore: newScore // updated score
            })
            if (gDebug) console.log("Average Read article score: ", newScore)
          })
        })
      }
    })
  }

  /**
   * 
   * @param {Set<String>} domains, a set of domains corresponding to all news sites linked from the loaded page 
   * @param {bool} storeLinksSeen, if true, the number of times each individual link is seen is stored in chrome 
   * storage, this is slower
   */
  storeLinkVisit(domains, storeLinksSeen = true) {
    // TODO: We should ignore links from the domain we are currently on from the count
    // TODO: Fix this function, it hashes domains together so it only counts unique domains on the page
    // TODO: Do not update link score for non-news websites (it currently treats them as neutral)
    var numerator = 0;
    var denominator = 0;
    var Ratings = this._Ratings
    var self = this;
    self._storageAPI.get({
      averageLinkScore: 0, // average bias score for links shown to client, between -1 and 1
      totalLinksSeen: 0 // total number of links seen be the client
    }, function (items) {
      Ratings.getRatings(function (ratings) {
        domains.forEach(function (domain) {
          const ratingString = ratings.allData[domain].rating
          const score = self._biasEnum[ratingString].score
          if (score != null && domain != "") {
            numerator += score
            denominator += 1
          }
          if (storeLinksSeen) {
            self._storageAPI.get(domain, function (fetchedDomain) {
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
              self._storageAPI.set(storageObj)
            })
          }
        })
      })
      const pageRating = denominator == 0 ? 0 : (numerator / denominator)
      if (gDebug) console.log("Page rating: ", pageRating)
      const totalScore = items.averageLinkScore * items.totalLinksSeen
      const linksSeen = items.totalLinksSeen + 1
      const score = (totalScore + pageRating) / linksSeen
      self._storageAPI.set({
        averageLinkScore: score,
        totalLinksSeen: linksSeen
      })
      if (gDebug) console.log("averageLinkScore: ",
        score, ", totalLinksSeen: ", linksSeen)
    })
  }
}

/**
 * Manages all icon updating logic
 */
class IconUpdater {

  /**
   * 
   * @param {BiasRatings} Ratings bias ratings object
   * @param {DataStore} ChromeStorage chrome storage wrapper
   * @param {JSON} biasEnum bias enum in the format {"Left/Leans Left/.../Right": 
   * {"str": "l/ll/.../r","color": [24, 85, 249, 100],"score": -1/-0.5/.../1}} from Left to Right
   * @param {string} noRatingString the long string for a non-rated object, defaults to 
   * "Not Rated"
   */
  constructor(Ratings, ChromeStorage, biasEnum, noRatingString = "Not Rated") {
    this._biasEnum = biasEnum;
    this._Ratings = Ratings;
    this._ChromeStorage = ChromeStorage;
    this._noRatingString = noRatingString;
  }

  /**
 * 
 * @param {String} siteBiasString, bias rating of current site, one of: 
 * @param {Number} feedBiasRating, current feed bias from -1 to 1, where -1 = L, 1 = R, 0 = C 
 */
  _updateIcon(siteBiasString, feedBiasRating) {
    var siteBiasShortString = this._biasEnum[siteBiasString].str // For letter/color in icon
    const badgeText = siteBiasString == this._noRatingString ? '' : siteBiasShortString.toUpperCase()
    const feedBiasValue = Math.round(((feedBiasRating + 1) * 8) + 1)
    var self = this;
    siteBiasShortString = 'w' // For no letter/color in icon
    chrome.browserAction.setIcon({
      path: `./images/ext-images/${siteBiasShortString}-icons/${feedBiasValue}-icon.png`
    }, self._printErrorCallback);

    chrome.browserAction.setBadgeText({
      text: badgeText
    });

    chrome.browserAction.setBadgeBackgroundColor({
      color: this._biasEnum[siteBiasString].color
    });
  }

  _printErrorCallback() {
    if (chrome.runtime.lastError) {
      console.warn("There was a (handled) error: ", chrome.runtime.lastError.message);
    } else {
      // Tab exists
    }
  }

  /**
   * 
   * @param {chrome.tabs.tab} tab, the tab to use to update the icon (i.e. url to use)
   * @param {bool} storeVisit, if true, stores the visit in associated chrome storage 
   * to calculate 'read articles' score, else doesn't
   */
  tabUpdateIcon(tab, storeVisit = false) { // TODO: Upate tab to url
    var self = this
    this._Ratings.getRatings(function (ratings) {
      ChromeStorage.get({
        averageVisitScore: 0
      }, function (items) {
        const score = items.averageVisitScore
        let domain = url2Domain(tab.url)
        // if (gDebug) console.log("ratings:", ratings)
        if (storeVisit) ChromeStorage.storeSiteVisit(domain)
        var siteBiasString = self._noRatingString
        if (ratings.allData[domain] != null && domain != "") {
          siteBiasString = ratings.allData[domain].rating
          if (gDebug) console.log("Bias rating is: ", siteBiasString);
          self._updateIcon(siteBiasString, score)
        } else {
          self._updateIcon(siteBiasString, score)
        }
        // if (gDebug) console.log("Average visit score: ", score)
      });
    });
  }

}
// Class Inits:

var Ratings = new BiasRatings('biasRatings.json', $);
var ChromeStorage = new DataStore(Ratings, gBiasEnum, chrome.storage.sync);
var IconManager = new IconUpdater(Ratings, ChromeStorage, gBiasEnum, gNoRating)

/**
 * Function to crawl links through redirects to find the original site they appear on. 
 * Makes HEAD requests (rather than GETs) to reduce overhead
 * @param {string} url the url to send a head request to the
 * @param {function} callback the function to be called after the final url of
 * the link with the redirect is found
 */
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

// Event Listeners

// Run each time the active tab is changed to change the icon
chrome.tabs.onActivated.addListener(function (activeInfo) {
  chrome.tabs.get(activeInfo.tabId, function (tab) {
    IconManager.tabUpdateIcon(tab);
  });
});


// Run the background script any time a new page is loaded and becomes the focus to run
// the feed and story bias calculations, and change the icon
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (tab.url) {
    IconManager.tabUpdateIcon(tab)
  }
  if (changeInfo.status == 'complete' && tab.active) {
    chrome.tabs.executeScript(tab.id, {
      file: "scripts/getUrlsScript.js"
    }, function () {
      const lastErr = chrome.runtime.lastError;
      if (lastErr) {
        console.log('tab: ' + tab.id + ' lastError: ' + JSON.stringify(lastErr));
      }
      IconManager.tabUpdateIcon(tab, true);
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
    Ratings.getRatings(function (ratings) {
      let domainSet = new Set(domainList);
      let intersection = new Set(ratings.expandedSet.filter(x => domainSet.has(x)));
      if (gDebug) console.log(intersection)
      ChromeStorage.storeLinkVisit(intersection)
    });
  });
