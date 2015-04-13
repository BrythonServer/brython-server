// Brython-server defualt javascript

var mainscript = null;
var maincontent = "";

function setMainScript(src) {
    if (mainscript) {
        document.head.removeChild(mainscript);
    }
    mainscript = document.createElement('script');
    mainscript.src = src;
    mainscript.type = "text/python";
    mainscript.async = false;
    mainscript.id = "mainscript";
    document.head.appendChild(mainscript);
}

function setMainValue(txt) {
    if (mainscript) {
        document.head.removeChild(mainscript);
    }
    mainscript = document.createElement('script');
    mainscript.innerHTML = txt;
    mainscript.type = "text/python";
    mainscript.id = "mainscript";
    document.head.appendChild(mainscript);
}

$("#url_input").keyup(function(event){
    if(event.keyCode == 13){
        event.preventDefault();
        $("#url_submit").click();
    }
});

// read main github script name and content
// return file name
function loadGithubtoScriptName() {
  var url_input = document.getElementById('url_input').value;
  var gitmatch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+).*/);
  if (gitmatch) {
    var data = {'user':gitmatch[1], 'repo':gitmatch[2]};
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', 'api/v1/load', false);  // synchronous
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    // send the collected data as JSON
    xhr.send(JSON.stringify(data));
    var result = JSON.parse(xhr.responseText);
    if (xhr.status == 200 && result['success'] && result['name']) {
        maincontent = result['content'];
        return result['name'];
    }
    else {
        return false;
    }
  }
  return false;
}

function runGithub() {
    var mainfile = loadGithub();
    if (mainfile) {
        setMainScript(mainfile);
        brython({debug:1, ipy_id:['pythonenvironment', 'mainscript']});
    }
}

// load main github script name, insert content in editor
function loadGithub() {
    if (loadGithubtoScriptName()) {
        editor.setValue(maincontent);
        editor.selection.clearSelection();
    }
}

// execute contents of editor
function runCurrent() {
    setMainValue(editor.getValue())
    if (mainscript) {
        brython({debug:1, ipy_id:['pythonenvironment', 'mainscript']});
    }
}

window.onload = function(){
  brython(1);
}


/************************* 
Ace Editor 
*************************/

var editor = ace.edit("editor");
editor.setTheme("ace/theme/eclipse");
editor.setShowPrintMargin(true);
editor.setDisplayIndentGuides(true);
editor.getSession().setMode("ace/mode/python");

