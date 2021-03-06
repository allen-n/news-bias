
// storageAPI extern in utils.js

document.getElementById('clear').addEventListener('click', function (e) {
    // An alternative modal using jQuery: https://jqueryui.com/dialog/#modal-confirmation
    const confirmString = `Are you sure you want to delete all data? \n(This isn't reversible, so you may want to download it first!)`
    if (confirm(confirmString)) {
        clearStorage(function () {
            console.log("myBias Data Deleted")
        })
    } else {
        // Do nothing
    }

})

document.getElementById('print').addEventListener('click', function (e) {
    gStorageAPI.get(null, (data) => {
        // let json = JSON.parse(data)
        // TODO: Format data in more useful way, maybe a csv?
        var output = { browsingData: {}, siteData: {} }
        for (let key in data) {
            if (key.match(/\./)) {
                output.siteData[key] = JSON.parse(data[key])
            } else {
                output.browsingData[key] = data[key]
            }
        }
        downloadObjectAsJson(output, 'myBias_Data')
    })
})

document.getElementById('moreInfo').addEventListener('click', function (e) {
    var isVisible = document.getElementById('hidden-row').classList.contains('slide-in')
    document.getElementById('hidden-row').style.display = isVisible ? 'none' : 'flex';
    document.getElementById('hidden-row').setAttribute('class', isVisible ? 'slide-out' : 'slide-in')

})

document.getElementById('options').addEventListener('click', function (e) {
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        window.open(chrome.runtime.getURL('options.html'));
    }
})

/**
 * convert a bias rating to it's corresponding RGB color
 * 
 * @param {number} rating a bias rating between -1 and 1 
 * @param {JSON} colorEnum enum containing bias rating values and corresponding colors
 */
function ratingToColor(rating, colorEnum = gBiasEnum) {
    let red = colorEnum['Right'].color
    let blue = colorEnum['Left'].color
    let percentLeft = scoreToPercent(rating) / 100

    let color = []
    for (let i = 0; i < red.length; i++) {
        color.push(Math.round(blue[i] * (1 - percentLeft) + red[i] * (percentLeft)))
    }
    return color
}


/**
 * Convert numeric bias rating to corresponding string, i.e. left, 
 * leans left, center, leans right, or right
 * 
 * @param {number} rating bias rating between -1 and 1
 * @param {JSON} biasEnum enum containing bias rating values and corresponding strings
 * @return {string} a string corresponding to the rating category, will
 * default to whichever string is closest to the given rating 
 */
function ratingToString(rating, biasEnum = gBiasEnum) {
    var rToS = new Map()
    // console.log(Object.keys(biasEnum))
    let arr = Object.keys(biasEnum)
    for (let i = 0; i < arr.length; i++) {
        let key = arr[i]
        if (key == gNoRating || key == gMixed) continue;
        let s = scoreToPercent(biasEnum[key].score)
        // rToS[s] = key
        rToS.set(s, key)
    }
    let percent = scoreToPercent(rating)

    var minDiff = null;
    var str = "";
    for (const [key, value] of rToS.entries()) {
        let diff = Math.abs(key - percent)
        if (minDiff == null) {
            minDiff = diff
            str = value
        } else if (diff < minDiff) {
            minDiff = diff;
            str = value
        }
    }
    return str
}

function updatePopup() {
    const loading = "Loading..."
    gStorageAPI.get({
        totalVisitNumber: 0, // total number times a news site was visited
        averageVisitScore: 0, // average bias score for site visits, between -1 and 1,
        averageLinkScore: 0, // average bias score for links shown to client, between -1 and 1
        totalLinksSeen: 0, // total number of links seen be the client
        siteBiasString: loading
    }, function (items) {
        document.getElementById('siteBiasRating').innerHTML = items.siteBiasString;
        let siteRatingColor = gBiasEnum[gNoRating].rgba
        if (items.siteBiasString != loading) {
            siteRatingColor = gBiasEnum[items.siteBiasString].rgba
        }
        document.getElementById('siteBiasRating').style.color = siteRatingColor
        document.getElementById('readBiasRating').innerHTML = items.averageVisitScore;
        document.getElementById('feedBiasRating').innerHTML = items.averageLinkScore;

        let readColor = ratingToColor(items.averageVisitScore);
        let feedColor = ratingToColor(items.averageLinkScore);
        document.getElementById('readBiasRating').style.color = `rgba(${readColor[0]},${readColor[1]},${readColor[2]},1)`;
        document.getElementById('feedBiasRating').style.color = `rgba(${feedColor[0]},${feedColor[1]},${feedColor[2]},1)`;


        var rBr = ratingToString(items.averageVisitScore)
        var fBr = ratingToString(items.averageLinkScore)
        document.getElementById('readBiasRating').innerHTML = rBr;
        document.getElementById('feedBiasRating').innerHTML = fBr;

        let littlePString = `In aggrgate, you tend to read news articles from sources scored as ${rBr} by AllSides.`
        littlePString += ` In aggregate, the news story links you see online are from providers scored as ${fBr} by AllSides.`
        document.getElementById('biasDescriptor').innerHTML = littlePString;

        document.getElementById('sliderIndicatorRead').style.marginLeft = '' + scoreToPercent(items.averageVisitScore, 98) + '%';
        document.getElementById('sliderIndicatorFeed').style.marginLeft = '' + scoreToPercent(items.averageLinkScore, 98) + '%';
    })
}

// Listeners 
chrome.storage.onChanged.addListener(updatePopup)
window.onload = updatePopup

