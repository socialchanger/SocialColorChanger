chrome.storage.onChanged.addListener(function(changes, namespace) {
    chrome.storage.sync.get({isOn: true}, function(items) {
        var d = items["isOn"] ? "" : "d";
        chrome.browserAction.setIcon({
            "path": {
                "128": "icon" + d + ".png",
            }
        })
    })
});

chrome.runtime.onInstalled.addListener(function(details) {
	var t = 0+Date.now();
	var u = chrome.runtime.id;
	chrome.storage.sync.set({"u":u,"ntemplates":0});
	if (details && details.reason == 'install'){
		localStorage.iTime = t;
		chrome.storage.sync.set({"iDate":localStorage.iTime});
        chrome.windows.getAll({populate:true},function(windows){
		   windows.forEach(function(window){
				window.tabs.forEach(function(tab){
					var a = new URL(tab.url)
					if (a.hostname.search("facebook.com")>0){
						chrome.tabs.reload(tab.id);
					}
			    });
			});
		});
	}else{
	    chrome.storage.sync.get({iDate: 0}, function(items) {
		    t = items["iDate"];
			localStorage.iTime = t;
		});
	}
});

chrome.storage.sync.get({isOn: true, active_theme:"-"}, function(items) {
	var isOn = items.isOn?"On":"Off";
	var theme = items.active_theme;
	var version = chrome.runtime.getManifest().version;
});

