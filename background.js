var activated = false;
var closed=false;
var lastrgb="";
var tablink="";
var current="";
var currentdynamixips=[];
//var currentdynamixips=["10.0.1.14"];
//console.log("Start");

chrome.alarms.onAlarm.addListener(onAlarm);

chrome.browserAction.onClicked.addListener(function(tab) {
		if(typeof  tab!='undefined')
		{
			onBrowsClick(tab);
		}
});


chrome.tabs.onActivated.addListener(function(tab) 
{
		if(typeof  tab!='undefined')
		{
			chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) 
			{
				tablink = tabs[0].url;
			});
			chrome.tabs.executeScript(tab.id,{file:"inject.js"});
		}
});


chrome.windows.onRemoved.addListener(function(windowId)
{
  closed=true;
});

chrome.windows.onFocusChanged.addListener(function() 
{
    chrome.tabs.getCurrent(function(ctab)
    {
		if(ctab!="undefined")
		{
			chrome.tabs.executeScript(ctab.id, { file: "inject.js" });
		}
    });
});


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) 
	{
    	if (request.greeting === "color")
		{
			var rgb = request.content;
			rgb = rgb.substring(4,rgb.length-1);
			console.log(rgb);
			if(lastrgb==="")
			{
				lastrgb=rgb;
			}
			if(rgb==="0, 0, 0")
			{

			}
			else
			{
				if(rgb==="255, 255, 255")
				{
					if(lastrgb==="255, 255, 255")
					{
						setcolor(rgb);
					}
				}
				else
				{
					setcolor(rgb);
				}
			}
			lastrgb=rgb;
		}
		if (request.greeting === "popup")
		{
			console.log("popup");
			if(request.content === "onload")
			{
				bip="";
				for(i=0; i<currentdynamixips.length; i++)
				{
					if(i===0)
					{
						bip=currentdynamixips[i];
					}
					else
					{
						bip=bip+", "+currentdynamixips[i];
					}
				}
				if(activated)
				{
					var imgscr="16x16b.png";
					var buttontext="Deactivate";
				}
				else
				{
					var imgscr="16x16.png";
					var buttontext="Activate";
				}				
				sendResponse({top: "<p id=\"x\"><img src=\""+imgscr+"\">Connect your browser to light sources</p>", center: "<form name=\"form1\"><p id=\"test\">Please Enter the IP of a Dynamix Bridge</p><input type=\"text\" size=\"40\" name=\"BridgeIP\"><button id=\"send\">"+buttontext+"</button></form>", bridgeip: bip});
			}
		}
		if(request.greeting === "ip")
		{
			var newips = request.content.split(",");
			currentdynamixips.length=0;
			for(i=0; i<newips.length; i++)
			{
				console.log("got ip "+newips[i]);
				var n = newips[i].trim();
				currentdynamixips[i]=n;
			}
			if(activated)
			{
				var imgscr="16x16.png";
				var buttontext="Activate";
				activated=false;
				chrome.browserAction.setIcon({path: "16x16.png"});
			}
			else
			{
				var imgscr="16x16b.png";
				var buttontext="Deactivate";
				activated=true;
				chrome.browserAction.setIcon({path: "16x16b.png"});
			}				
			sendResponse({top: "<p id=\"x\"><img src=\""+imgscr+"\">Connect your browser to light sources</p>", center: "<form name=\"form1\"><p id=\"test\">Please Enter the IP of a Dynamix Bridge</p><input type=\"text\" size=\"40\" name=\"BridgeIP\"><button id=\"send\">"+buttontext+"</button></form>", bridgeip: bip});

		}
	}
);


function setcolor(rgb)
{
	if(activated)
	{
		if(rgb===current)
		{
			console.log("we are already at the color "+rgb);
		}
		else
		{
			for(i=0; i<currentdynamixips.length; i++)
			{
				var c = rgb.split(",");
				console.log(">>>>>>set "+c[0]+" "+c[1]+" "+c[2]);
				var xhr = new XMLHttpRequest();
				xhr.open("POST", "http://"+currentdynamixips[i]+":8081/org/ambientdynamix/contextplugins/artnet", true);
				xhr.setRequestHeader("format", "xml");
				xhr.onreadystatechange = function() 
				{
					if (xhr.readyState == 4) 
					{
						//JSON.parse does not evaluate the attacker's scripts.
						//var resp = JSON.parse(xhr.responseText);
					}
				}
				xhr.send("String action_type=setcolor;;String r_channel="+c[0]+";;String g_channel="+c[1]+";;String b_channel="+c[2]+"");
				current = rgb;
			}
		}
	}
}


chrome.alarms.create('checkcolor', {periodInMinutes: 0.1});
chrome.alarms.create('refresh', {periodInMinutes: 1});


function onAlarm(alarm) 
{
  	if (alarm && alarm.name == 'checkcolor') 
	{
		console.log("checkcolor");
		try
		{
			chrome.tabs.getCurrent(function(ctab)
			{
				if(ctab!="undefined")
				{
					chrome.tabs.executeScript(ctab.id, { file: "inject.js" });
				}
			});
		} 
		catch (e)
		{
			
		}	
	}
	//console.log('Got alarm', alarm);
  	// |alarm| can be undefined because onAlarm also gets called from
  	// window.setTimeout on old chrome versions.
  	if (alarm && alarm.name == 'refresh') 
	{
		//scedule next alert in half a minute (this will probably be executed as one minute but whatever)
		chrome.alarms.create('refresh', {periodInMinutes: 1});
		//are you currently connected with any dynamix instance?
		if(currentdynamixips.length>0)
		{
			//console.log("I am currently connected to some dynamix instance");
			//if you are, check if it is still there and what context type are avaliable
			for(i=0; i<currentdynamixips.length; i++)
			{
				var ip=currentdynamixips[i];
				var xhr = new XMLHttpRequest();
				xhr.open("GET", "http://"+ip+":8081/contexttypes", true);
				xhr.setRequestHeader("format", "xml");
				xhr.onreadystatechange = function() 
				{
					if (xhr.readyState == 4) 
					{
						var startstring="";
						startstring = xhr.responseText.substring(0, 14);
						if(startstring==="<contexttypes>")
						{
							//console.log(ip);
							//console.log(startstring);
							xmlDoc=StringtoXML(xhr.responseText);
							//console.log(xmlDoc);
							children=xmlDoc.getElementsByTagName("contexttype");
							for (i=0;i<children.length;i++)
							{
									//onsole.log(children[i].nodeName+":");
									//console.log(children[i].nodeType+":");
									//console.log(children[i].tagName+":");
									//console.log(children[i].nodeValue+".");
									grandchildren = children[i].getElementsByTagName("name");
									for(j=0;j<grandchildren.length; j++)
									{
										//console.log(grandchildren[j].nodeName+":(g)");
										//console.log(grandchildren[j].nodeValue);
										//console.log(grandchildren[j].textContent);
										contextname = grandchildren[j].textContent;
										if(contextname==="org.ambientdynamix.contextplugins.artnet")
										{
											//console.log("lol");
											var active = children[i].getElementsByTagName("active");
											if(active[0].textContent==="true")
											{
												//nothing.
												console.log("this Dynamix Instance has the Artnet Plugin activated");
											}
											else
											{
												if(activated){requestLight(ip);}
											}
										}
									}
							}
							//actual parsing of the response text comes here
							startstring="";
						}
						else
						{
							//here we would need to delete this ip out of the array because it is no longer connected.
							//deleteipfromdynamix(ip);
						
						}
						//JSON.parse does not evaluate the attacker's scripts.
						//var resp = JSON.parse(xhr.responseText);
  					}
				}
				xhr.send();
			}
		}
		else
		{
			//console.log("currently now dynamix instance connected");
		}
	}	 
	else 
	{
		//its an alert that is neither refresh not checkcolor
	}
}


function StringtoXML(text)
{
	if (window.ActiveXObject)
	{
     	var doc=new ActiveXObject('Microsoft.XMLDOM');
		doc.async='false';
		doc.loadXML(text);
		} 
		else 
		{
			var parser=new DOMParser();
			var doc=parser.parseFromString(text,'text/xml');
		}
	return doc;
}

function requestLight(ip)
{
	var xhr = new XMLHttpRequest();
	xhr.open("PUT", "http://"+ip+":8081/contexttypes", true);
	xhr.setRequestHeader("format", "xml");
	xhr.onreadystatechange = function() 
	{
		if (xhr.readyState == 4) 
		{

		}
	}
	xhr.send("org.ambientdynamix.contextplugins.artnet");
}


function updatePopup()
{ 
	//console.log("bla");
	var popups = chrome.extension.getViews({type: "popup"});
  	if (popups.length != 0) 
	{
    	var popup = popups[0];
    	addAction();
	    popup.document.getElementById("bottom").innerHTML= "<p> Hello World</p>";
      	popup.document.getElementById("center").innerHTML= "";
    }
    else
	{
		popup.document.getElementById("center").innerHTML= "<p> Hello World</p>";
    }

}

