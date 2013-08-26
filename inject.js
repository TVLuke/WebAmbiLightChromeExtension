//document.body.style.backgroundColor='yellow'

//var c = document.body.innerHTML;
var x = getComputedStyle(document.body,null).getPropertyValue('background-color');

chrome.runtime.sendMessage({greeting: "color", content: x}, function(response) {
  //console.log(response.farewell);
});
