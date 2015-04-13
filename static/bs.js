// Brython-server defualt javascript

var mainscript = null;

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

$("#url_input").keyup(function(event){
    if(event.keyCode == 13){
        event.preventDefault();
        $("#url_submit").click();
    }
});

function loadGithub() {
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
    if (xhr.status == 200 && result['success'] && result['main']) {
        return result['main'];
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
        runCurrent();
    }
}

function runCurrent() {
    if (mainscript) {
        brython({debug:1, ipy_id:['pythonenvironment', 'mainscript']});
    }
}

window.onload = function(){
  brython(1);
}
