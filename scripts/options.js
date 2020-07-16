
// FIXME: Options page reference code
// Saves options to chrome.storage
// function save_options() {
//   var maxCharge = document.getElementById('max-charge-percent').value
//   var minCharge = document.getElementById('min-charge-percent').value
//   var apiKey = document.getElementById('api-key').value
//   var onEventName = document.getElementById('on-event-name').value
//   var offEventName = document.getElementById('off-event-name').value

//   chrome.storage.sync.set({
//     maxCharge: maxCharge,
//     minCharge: minCharge,
//     apiKey: apiKey,
//     onEventName: onEventName,
//     offEventName: offEventName
//   }, function () {
//     // Update status to let user know options were saved.
//     var status = document.getElementById('status');
//     status.textContent = 'Options saved!';
//     setTimeout(function () {
//       status.textContent = '';
//     }, 1500);
//   });
// }

// /**
//  * 
//  * @param {Number} statusNum - 200 if req good, else other
//  */
// function reqTestCallback(statusNum) {
//   // Update status to let user know options were saved.
//   var status = document.getElementById('status');
//   status.textContent = statusNum == 200 ? "Request Successful (but check your switch state)!" : "Request unsuccessful, check event names and api key"
//   setTimeout(function () {
//     status.textContent = '';
//   }, 4000);
// }

// // Restores select box and checkbox state using the preferences
// // stored in chrome.storage.
// function restore_options() {
//   // Use default value color = 'red' and likesColor = true.
//   chrome.storage.sync.get({
//     maxCharge: 80,
//     minCharge: 20,
//     apiKey: "",
//     onEventName: "",
//     offEventName: ""
//   }, function (items) {
//     document.getElementById('max-charge-percent').value = items.maxCharge
//     document.getElementById('min-charge-percent').value = items.minCharge
//     document.getElementById('api-key').value = items.apiKey
//     document.getElementById('on-event-name').value = items.onEventName
//     document.getElementById('off-event-name').value = items.offEventName
//   });
//   console.log("Options restored")
// }

// /**
//  * COPIED FROM eventPage.js. TODO: Figure out how to do imports!
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
//       var status = document.getElementById('status');
//       status.textContent = `Couldn't control your power supply. 
//       The apiKey, Turn On, and Turn Off event names all must be set 
//       in settings`
//       setTimeout(function () {
//         status.textContent = '';
//       }, 4000);
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
// document.addEventListener('DOMContentLoaded', restore_options);
// document.getElementById('save').addEventListener('click',
//   save_options);
// document.getElementById('test-on').addEventListener('click', () => { makeReq(true, reqTestCallback) })
// document.getElementById('test-off').addEventListener('click', () => { makeReq(false, reqTestCallback) })
// document.getElementById('close').addEventListener('click', () => {
//   window.close();
// });
// document.getElementById('show-api-key').addEventListener('click', () => {
//   var x = document.getElementById("api-key");
//   if (x.type === "password") {
//     x.type = "text";
//   } else {
//     x.type = "password";
//   }
// });