
// storageAPI extern in utils.js

document.getElementById('clear').addEventListener('click', function (e) {
    // An alternative modal using jQuery: https://jqueryui.com/dialog/#modal-confirmation
    const confirmString = `Are you sure you want to delete all data? \n(This isn't reversable, so you may want to download it first!)`
    if(confirm(confirmString)) {
        clearStorage(function () {
            console.log("All data deleted")
            document.getElementById('data-length').innerHTML = "All data deleted."
        })
    } else {
        // Do nothing
    }
    
})

document.getElementById('print').addEventListener('click', function (e) {
    storageAPI.get(null, (data) => {
        // let length = JSON.stringify(data).length
        let length = jsonLength(data)
        document.getElementById('data-length').innerHTML = length + " b"
    })
})

document.getElementById('moreInfo').addEventListener('click', function (e) {
    document.getElementById('hidden-row').style.display = 'flex';
})

window.onload = function () {
    // storageAPI.get(null, function (data) { console.log(data) })
    storageAPI.get({
        totalVisitNumber: 0, // total number times a news site was visited
        averageVisitScore: 0, // average bias score for site visits, between -1 and 1,
        averageLinkScore: 0, // average bias score for links shown to client, between -1 and 1
        totalLinksSeen: 0, // total number of links seen be the client
        siteBiasString: "Loading..."
    }, function (items) {
        console.log(items)
        document.getElementById('siteBiasRating').innerHTML = items.siteBiasString;
        document.getElementById('siteBiasRating').style.color = gBiasEnum[items.siteBiasString].rgba
        document.getElementById('readBiasRating').innerHTML = items.averageVisitScore;
        document.getElementById('feedBiasRating').innerHTML = items.averageLinkScore;

        document.getElementById('sliderIndicatorRead').style.marginLeft = '' + Math.round(50 * (items.averageVisitScore + 1)) + '%';
        document.getElementById('sliderIndicatorFeed').style.marginLeft = '' + Math.round(50 * (items.averageLinkScore + 1)) + '%';
    })
}



// FIXME: popup code ref
// document.addEventListener('DOMContentLoaded', function () {
//   const statusElement = document.getElementById('status');
//   const iconNotChargingElement = document.getElementById('i-notCharging');
//   const iconChargingElement = document.getElementById('i-charging');
//   let batteryInfo = {
//     level: '',
//     levelText: '',
//     time: '',
//     timeText: ''
//   }

//   // Launch Options Page
//   document.querySelector('#go-to-options').addEventListener('click', function () {
//     if (chrome.runtime.openOptionsPage) {
//       chrome.runtime.openOptionsPage();
//     } else {
//       window.open(chrome.runtime.getURL('options.html'));
//     }
//   });

//   // Use on/off button
//   document.querySelector('#on-off-switch').addEventListener('click', function (e) {
//     var onOff = document.querySelector('#myonoffswitch')
//     chrome.storage.sync.set({
//       isActive: onOff.checked
//     });
//   })
//   chrome.storage.sync.get({
//     isActive: true,
//     apiIsConnected: false
//   }, function (items) {
//     document.querySelector('#myonoffswitch').checked = items.isActive
//     if (!items.apiIsConnected && items.isActive) {
//       document.getElementById('error-status').innerHTML += "<p>Error: API not connected. Check Options.</p>"
//     }
//   })

//   navigator.getBattery().then(battery => {
//     let date = new Date(null);

//     batteryInfo.level = (battery.level * 100).toFixed();

//     chrome.browserAction.setBadgeText({
//       text: battery.level !== 1 ? batteryInfo.level.toString() : ''
//     });

//     chrome.browserAction.setBadgeBackgroundColor({
//       color: [94, 97, 106, 255]
//     });

//     if (battery.charging) {
//       iconChargingElement.style.display = 'block';

//       batteryInfo.levelText = 'Charged';

//       if (isFinite(battery.chargingTime) && battery.level !== 1) {
//         date.setSeconds(battery.chargingTime);

//         batteryInfo.time = date.toISOString().substr(11, 5);
//         batteryInfo.timeText = 'Until Full';
//       } else if (isFinite(battery.chargingTime) && battery.level === 1) {
//         batteryInfo.levelText += ' ⚡️';
//       } else {
//         batteryInfo.timeText = '';
//       }
//     } else {
//       iconNotChargingElement.style.display = 'block';

//       batteryInfo.levelText = 'Power Left';

//       if (isFinite(battery.dischargingTime)) {
//         date.setSeconds(battery.dischargingTime);

//         batteryInfo.time = date.toISOString().substr(11, 5);
//         batteryInfo.timeText = 'Remaining';
//       } else {
//         batteryInfo.timeText = '';
//       }
//     }

//     let markup = `
//       <p><b>${batteryInfo.level}</b>% ${batteryInfo.levelText}</p>
//       <p><b>${batteryInfo.time}</b> ${batteryInfo.timeText}</p>
//     `;

//     statusElement.innerHTML = markup;
//   });
// });

