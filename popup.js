// Copyright (c) Sudhin Devarachetty- All rights reserved.
// via Peter Coles 
// Use of this source code is governed by the MIT License found in LICENSE

//
// console object for debugging
//
 
var isGoldImage = false;
var folder = 'filesystem:chrome-extension://' + chrome.i18n.getMessage('@@extension_id') + '/temporary/';
var isMultiMode = false;
var settingID = "" ;
var log = (function() {
    var parElt = document.getElementById('wrap'),
        logElt = document.createElement('div');
    logElt.id = 'log';
    logElt.style.display = 'block';
    parElt.appendChild(logElt);

    return function() {
        var a, p, results = [];
        for (var i=0, len=arguments.length; i<len; i++) {
            a = arguments[i];
            try {
                a = JSON.stringify(a, null, 2);
            } catch(e) {}
            results.push(a);
        }
        p = document.createElement('p');
        p.innerText = results.join(' ');
        p.innerHTML = p.innerHTML.replace(/ /g, '&nbsp;');
        logElt.appendChild(p);
    };
})();

//
// utility methods
//
function $(id) { return document.getElementById(id); }
function show(id) { $(id).style.display = 'block'; }
function hide(id) { $(id).style.display = 'none'; }

//
// URL Matching test - to verify we can talk to this URL
//
var matches = ['http://*/*', 'https://*/*', 'ftp://*/*', 'file://*/*'],
    noMatches = [/^https?:\/\/chrome.google.com\/.*$/];
function testURLMatches(url) {
    // couldn't find a better way to tell if executeScript
    // wouldn't work -- so just testing against known urls
    // for now...
    var r, i;
    for (i=noMatches.length-1; i>=0; i--) {
        if (noMatches[i].test(url)) {
            return false;
        }
    }
    for (i=matches.length-1; i>=0; i--) {
        r = new RegExp('^' + matches[i].replace(/\*/g, '.*') + '$');
        if (r.test(url)) {
            return true;
        }
    }
    return false;
}

//
// Events
//
var screenshot, contentURL = '';

function sendScrollMessage(tab) {
    contentURL = tab.url;
    screenshot = {};
    chrome.tabs.sendRequest(tab.id, {msg: 'scrollPage'}, function() {
        // We're done taking snapshots of all parts of the window. Display
        // the resulting full screenshot image in a new browser tab.
        openPage();
    });
}

chrome.extension.onRequest.addListener(function(request, sender, callback) {
    if (request.msg === 'capturePage') {
        capturePage(request, sender, callback);
    } else {
        console.error('Unknown message received from content script: ' + request.msg);
    }
});


function capturePage(data, sender, callback) {
    var canvas;
    scrollbarwidth = scrollbarwidth;
    $('bar').style.width = parseInt(data.complete * 100, 10) + '%';

    // Get window.devicePixelRatio from the page, not the popup
    var scale = data.devicePixelRatio && data.devicePixelRatio !== 1 ?
        1 / data.devicePixelRatio : 1;

    if (!screenshot.canvas) {
        canvas = document.createElement('canvas');
        canvas.width = data.totalWidth;
        canvas.height = data.totalHeight;
        screenshot.canvas = canvas;
        screenshot.ctx = canvas.getContext('2d');

        // Scale to account for device pixel ratios greater than one. (On a
        // MacBook Pro with Retina display, window.devicePixelRatio = 2.)
        if (scale !== 1) {
            // TODO - create option to not scale? It's not clear if it's
            // better to scale down the image or to just draw it twice
            // as large.
            screenshot.ctx.scale(scale, scale);
        }
    }

    // if the canvas is scaled, then x- and y-positions have to make
    // up for it in the opposite direction
    if (scale !== 1) {
        data.x = data.x / scale;
        data.y = data.y / scale;
    }

    chrome.tabs.captureVisibleTab(
        null, {format: 'png', quality: 100}, function(dataURI) {
            if (dataURI) {
                var image = new Image();
                image.onload = function() {
                    screenshot.ctx.drawImage(image, data.x, data.y);
                    callback(true);
                };
                image.src = dataURI;
            }
        });
}

function getBlob(dataURI){
      // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // create a blob for writing to a file
    var blob = new Blob([ab], {type: mimeString});

    return blob;
}

function openPage() {
    // standard dataURI can be too big, let's blob instead
    // http://code.google.com/p/chromium/issues/detail?id=69227#c27

    var dataURI = screenshot.canvas.toDataURL();
    var blob = getBlob(dataURI);
  

    if(isGoldImage) 
        {name = settingID+'screencaptureGold.png'}
    else
        {name = settingID+'screencaptureOther.png'}

    function onwriteend() {
      
        // open the file that now contains the blob
         if(isGoldImage){
             if(!isMultiMode) window.open(folder +name);
         }
         else{
            var diff = resemble(folder+settingID+'screencaptureGold.png').compareTo(folder + name).ignoreColors().onComplete(function(data){
                window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
                    fs.root.getFile(settingID+"compareResult.png", {create:true}, function(fileEntry) {
                        fileEntry.createWriter(function(fileWriter) {
                            fileWriter.onwriteend = function(){ 
                               if(!isMultiMode) window.open(folder +settingID+"compareResult.png");
                            };
                            fileWriter.write(getBlob(data.getImageDataUrl()));
                        }, errorHandler);
                    }, errorHandler);
                }, errorHandler);    

               
             });
         }
        
       
    }

    function errorHandler() {
        show('uh-oh');
    }

    
    window.webkitRequestFileSystem(TEMPORARY, 1024*1024, function(fs){
        fs.root.getFile(name, {create:true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                fileWriter.onwriteend = onwriteend;
                fileWriter.write(blob);
            }, errorHandler);
        }, errorHandler);
    }, errorHandler);
}

function InitializeComparison(isGold){

    isGoldImage = isGold;

    chrome.tabs.getSelected(null, function(tab) {

        if (testURLMatches(tab.url)) {
            var loaded = false;

            chrome.tabs.executeScript(tab.id, {file: 'page.js'}, function() {
                loaded = true;
                show('loading');
                sendScrollMessage(tab);
            });

            window.setTimeout(function() {
                if (!loaded) {
                    show('uh-oh');
                }
            }, 1000);
        } else {
            show('invalid');
        }
    });
}

resemble.outputSettings({
  errorColor: {
    red: 255,
    green: 102,
    blue: 102
  },
  errorType: 'flat',
  transparency: 0.5
});

jQuery('#Goldbtn').click(function(){
     isMultiMode = false;
    InitializeComparison(true);
});

jQuery('#Comparebtn').click(function(){
      isMultiMode = false;
    InitializeComparison(false);
});


jQuery('#ViewGoldbtn').click(function(){
    window.open(folder+"screencaptureGold.png");
});
jQuery('#ViewComparebtn').click(function(){
    window.open(folder+"screencaptureOther.png");
});

jQuery('#ViewResultbtn').click(function(){
    window.open(folder+"compareResult.png");
});
jQuery('#ViewAllFilesbtn').click(function(){
    window.open(folder);
});



jQuery('#GoldMultibtn').click(function(){
    isMultiMode = true;
    jQuery('.resRow input:checked').each(function(index,item){
        var settings = jQuery(item).parent().data('settings');
         resizeWindow(settings);
         settingID = settings.ID;
         InitializeComparison(true);
    });
   
});
jQuery('#CompareMultibtn').click(function(){
     isMultiMode = true;
    jQuery('.resRow input:checked').each(function(index,item){
        var settings = jQuery(item).parent().data('settings');
         resizeWindow(settings);
         settingID = settings.ID;
         InitializeComparison(false);
    });
});


displayRows();