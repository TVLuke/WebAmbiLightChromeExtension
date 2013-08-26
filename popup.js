function myFunction()
{
	//document.getElementById("test").innerHTML = "olol";
	var bridgeip = document.forms["form1"]["BridgeIP"].value;
	chrome.runtime.sendMessage({greeting: "ip", content: bridgeip}, function(response) 
		{
			document.getElementById("top").innerHTML = response.top;
			document.getElementById("center").innerHTML = response.center;
			document.forms["form1"]["BridgeIP"].value = response.bridgeip;
			document.getElementById("send").onclick = myFunction;
		});
	//chrome.extension.getBackgroundPage().updatePopup();
}

window.onload = function() 
{ 
		topdiv = document.getElementById('top');
		topdiv.style.width = "400px";
    	chrome.runtime.sendMessage({greeting: "popup", content: "onload"}, function(response) 
		{
			document.getElementById("top").innerHTML = response.top;
			document.getElementById("center").innerHTML = response.center;
			document.forms["form1"]["BridgeIP"].value = response.bridgeip;
			document.getElementById("send").onclick = myFunction;
			
		});
}
