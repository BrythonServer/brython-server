// Brython-server defualt javascript

var mainscript = null;
var maincontent = "";

// Github link is not visible by default
document.getElementById("github_url").style.visibility = "hidden";
// Share link is not visible by default
var share_link = document.getElementById("share_url");
if (share_link) {
    share_link.style.visibility = "hidden";
}

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

// Show github link
function showGithub(path) {
    var element = document.getElementById("github_url");
    element.href = path;
    element.style.visibility = "visible";
}

// Show share link
function showShareURL(data) {
    var element = document.getElementById("share_url");
    element.href = "?user=" + data['user'] + "&repo=" + data['repo'] + "&name=" + data['name'];
    if (data['path'] != '') {
        element.href +=  "&path=" + data['path'];
    }
    element.style.visibility = "visible";
}

// Execute the EDIT button
function runEdit(path) {
    var element = document.getElementById("github_url");
    var editelement = document.getElementById("run_edit");
    editelement.value = element.href;
    $('#run_edit_form').submit();
}

// create a Github file path
function createGithubPath(data) {
    var path = data['path'];
    if (path.length > 0 && path.substr(path.length-1) != "/") {
        path += "/";
    }
    path += data['name'];
    return path
}

// create a Github URL text for speciic file
function createGithubURL(data) {
    var url = "https://github.com/" + data['user'] + "/" + data['repo'] 
    url += "/blob/master/" + createGithubPath(data);
    return url
}

// parse Github URL text
function parseGithubURL(url_input) {
    var data = null;
    // attempt a single file match
    // example: https://github.com/tiggerntatie/brython-student-test/blob/master/hello.py
    // example: https://github.com/tiggerntatie/hhs-cp-site/blob/master/hhscp/static/exemplars/c02hello.py
    // example subtree: https://github.com/tiggerntatie/hhs-cp-site/tree/master/hhscp/static/exemplars
    var gittreematch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+)\/tree\/master\/(.+)/);
    var gitfilematch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+)\/blob\/master\/([^/]+)/);
    var gittreefilematch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+)\/blob\/master\/(.+)\/([^/]+)/);
    var gitrepomatch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+).*/);
    if (gitrepomatch) {
        data = {'user':gitrepomatch[1], 'repo':gitrepomatch[2], 'path':'', 'name':''};
        if (gittreematch) {
            data['path'] = gittreematch[3];
        }
        if (gittreefilematch) {
            data['path'] = gittreefilematch[3];
            data['name'] = gittreefilematch[4];
        }
        else if (gitfilematch) {
            data['name'] = gitfilematch[3];
        }
    }
    return data;
}

// parse the url_input and return structure with user, repo, path, name
function parseGithub() {
    return parseGithubURL(document.getElementById('url_input').value);
}

// read main github script name and content
// return file name
function loadGithubtoScript(data) {
    if (data) {
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', '/api/v1/load', false);  // synchronous
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
        // send the collected data as JSON
        xhr.send(JSON.stringify(data));
        var result = JSON.parse(xhr.responseText);
        if (xhr.status == 200 && result['success'] && result['name']) {
            maincontent = result['content'];
            showGithub(result['path']);
            return result;
        }
        else {
            return false;
        }
    }
    else {
        return false;
    }
}

// load script from github, embed in html and execute
// data dictionary input includes user, repo, name and path (fragment)
function runGithub(data) {
    var result = loadGithubtoScript(data);
    if (result) {
        setMainValue(maincontent);
        if (mainscript) {
            brython({debug:1, ipy_id:['pythonenvironment', 'mainscript']});
        }
    }
}

// re-execute current mainscript
function runCurrent() {
    if (mainscript) {
            brython({debug:1, ipy_id:['pythonenvironment', 'mainscript']});
    }
}

// load main github script name, insert content in editor
function loadGithub() {
    var data = parseGithub();
    var result = loadGithubtoScript(data);
    if (result) {
        // now that we have a full URL for the file, parse again
        data = parseGithubURL(result['path']);
        document.getElementById('url_input').value = createGithubURL(data);
        showShareURL(data);
        editor.setValue(maincontent);
        editor.selection.clearSelection();
        sendEditorChange();
    }
}

// execute contents of editor and update server with new content
function runEditor() {
    sendEditorChange();
    setMainValue(editor.getValue());
    if (mainscript) {
        brython({debug:1, ipy_id:['pythonenvironment', 'mainscript']});
    }
}


// update server with new editor content (all the time!)
function sendEditorChange() {
    var data = {'editcontent':editor.getValue(), 
        'url_input':document.getElementById('url_input').value};
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/v1/update', false);  // synchronous
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    // send the collected data as JSON
    xhr.send(JSON.stringify(data));
    var result = JSON.parse(xhr.responseText);
}

// send request to login to github
function loginGithub() {
    sendEditorChange()
    $('#run_auth_request').submit();
}

// send request to logout of github
// only FORGETS out github authorization - does not log out of github, per se
function logoutGithub() {
    $('#run_auth_forget').submit();
}

// send request to commit/save to github
function commitGithub() {
    var d = new Date()
    var ds = d.toLocaleDateString()
    var ts = d.toLocaleTimeString()
    var data = parseGithub();
    data['editcontent'] = editor.getValue();
    data['commitmsg'] = "Updated from Brython Server: "+ds+" "+ts;
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', '/api/v1/commit', false);  // synchronous
    xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    // send the collected data as JSON
    xhr.send(JSON.stringify(data));
    var result = JSON.parse(xhr.responseText);
}