
// Saves options to chrome.storage
function saveOptions() {
    var followDeepLinks = document.getElementById('deep-links').checked

    gStorageAPI.set({
        followDeepLinks: followDeepLinks, // true or false
    }, function () {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved!';
        setTimeout(function () {
            status.textContent = '';
        }, 1500);
    });
}

function loadOptions() {
    gStorageAPI.get({
        followDeepLinks: false
    }, function (items) {
        console.log(items)
        document.getElementById('deep-links').checked = items.followDeepLinks
    })
}

function loadVisitTable() {
    allDataToJson(function (data) {
        Ratings.getRatings(function (ratings) {
            var table = document.getElementById('ratings-table');
            for (let key in data.siteData) {
                let row = table.insertRow(-1)
                var siteName = row.insertCell(0);
                var visits = row.insertCell(1);
                var linked = row.insertCell(2);
                var rating = row.insertCell(3);
                siteName.innerHTML = key
                visits.innerHTML = data.siteData[key].visits
                linked.innerHTML = data.siteData[key].linked
                rating.innerHTML = ratings.allData[key].rating

            }
        })
    })
}

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('close').addEventListener('click', function (e) {
    window.close()
});

var Ratings = new BiasRatings('biasRatings.json', $);
loadOptions();
loadVisitTable();