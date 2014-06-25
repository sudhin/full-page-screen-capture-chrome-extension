var scrollbarwidth=0;
var defaultValues = [
	{
		"title"  : "Old iPhones, small Androids",
		"width"  : 320,
		"height" : 480,
		"type"   : "featurephone",
		"target" : "viewport"
	},
	{
		"title"  : "Low-end Windows Phone",
		"width"  : 480,
		"height" : 800,
		"type"   : "smartphone",
		"target" : "viewport"
	},
	{
		"title"  : "IPhone",
		"width"  : 640,
		"height" : 960,
		"type"   : "smartphone",
		"target" : "viewport"
	},
	{
		"title"  : "High-end Windows Phone",
		"width"  : 768,
		"height" : 1280,
		"type"   : "smartphone",
		"target" : "viewport"
	},
	{
		"title"  : "IPad",
		"width"  : 1024,
		"height" : 768,
		"type"   : "tablet",
		"target" : "viewport"
	},
	{
		"title"  : "Tablet",
		"width"  : 1366,
		"height" : 768,
		"type"   : "tablet",
		"target" : "viewport"
	},
	{
		"title"  : "Small desktop",
		"width"  : 1280,
		"height" : 1024,
		"type"   : "desktop",
		"target" : "window"
	},
	{
		"title"  : "Large desktop",
		"width"  : 1680,
		"height" : 1050,
		"type"   : "desktop",
		"target" : "window"
	}
];

function getRows() {
	
	 
		rows = defaultValues;
	 
	return rows;
}

var Devices = {
	icons : {
		desktop      : 'desktop.png',
		laptop       : 'laptop.png',
		tablet       : 'tablet.png',
		smartphone   : 'smartphone.png',
		featurephone : 'featurephone.png',
	},
	
	types : ['desktop', 'laptop', 'tablet', 'smartphone', 'featurephone'],
	
	defaultType : 'desktop',
	
	getIcon : function(key) {
		if (key == 'mobile') {
			key = 'featurephone';
		}
		
		return this.icons[key];
	}
};

function SetupClick(){

jQuery('.resRow:not(.secondary) a').click(function(e){
				e.preventDefault();
				
				var ignorePopup = !e.screenX && !e.screenY, // if Enter was pressed
				    settings    = jQuery(this.parentNode).data('settings');
				
				currentResolutionID = settings.ID;
				
				resizeWindow(settings, ignorePopup);
});
			
			}

function displayRows() {
	
	jQuery('#resolutionsList').html('');
	
	var rows = getRows();
	if ( rows ) {
		for ( var r = 0; r < rows.length; r++ ) {
			rows[r].ID = r;
			addRow( rows[r] );
		}
	}
	SetupClick();
}

function addRow( settings ) {

	var newRow = jQuery('<li class="resRow" id="row' + settings.ID + '"></li>');
	newRow.data( 'settings', settings);
	
	var html = '<input type="checkbox">' + 
	           rowContent(settings) +
	           '</input>';
	
	newRow.html(rowContent(settings));
	newRow.css( 'display', 'none' );
	jQuery('#resolutionsList').append(newRow);
	newRow.slideDown(300);

}

function rowContent(settings) {
	//return '<span class="icon" title="Drag to rearrange list" style="background-image:url(' + Devices.getIcon(settings.type) + ')"></span>' + 
	 return      '<a href="#" class="resWidth">' + settings.width + '&nbsp;&times;&nbsp;' + settings.height + '</a><span class="resDetail">' + settings.title + '</span>';
}


function resizeWindow (options, ignorePopup) {
	var settings = JSON.parse(JSON.stringify(options));
	
	if ( settings.target == 'window') {
		_resizeWindow(settings, ignorePopup);
		return;
	}
	
	chrome.windows.getLastFocused(function (win) {
		chrome.tabs.captureVisibleTab(function (imgData) {
			if (!imgData) {
				 	return;
			}
			
			var img = new Image();
			
			img.onload = function () {
				var DPR = !isNaN(window.devicePixelRatio) && window.devicePixelRatio > 0.0 ? window.devicePixelRatio : 1;
				
				settings.width  = parseInt(settings.width, 10) + parseInt(win.width, 10) - parseInt(img.width / DPR, 10);
				settings.height = parseInt(settings.height, 10) + parseInt(win.height, 10) - parseInt(img.height / DPR, 10);
				
				_resizeWindow(settings, ignorePopup);
			}
			
			img.src = imgData;
		});
	});
	
	
	 
}

function _resizeWindow (settings, ignorePopup) {
	if ( settings.pos == 3 || window.localStorage['overrideWindowPosition'] == 1 ) {
		settings.X = Math.floor((window.screen.availWidth - settings.width) / 2) + window.screen.availLeft;
		settings.Y = Math.floor((window.screen.availHeight - settings.height) / 2) + window.screen.availTop;
	}
	
	chrome.windows.getLastFocused( function (win) {
		var opt = {state: 'normal'};
		opt.width	= parseInt(settings.width, 10);
		opt.height	= parseInt(settings.height, 10);
		
		if ( settings.X == parseInt(settings.X, 10) ) {
			opt.left = parseInt(settings.X, 10);
		}
		
		if ( settings.Y == parseInt(settings.Y, 10) ) {
			opt.top = parseInt(settings.Y, 10);
		}
		
		chrome.windows.update( win.id, opt );
		!ignorePopup && String(window.location.href).match(/popup\.html/) && window.close();
	});
}
