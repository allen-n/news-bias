
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

document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('close').addEventListener('click', function (e) {
    window.close()
});
loadOptions();