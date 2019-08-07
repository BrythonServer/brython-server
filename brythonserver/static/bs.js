/*
 * Brython-server default javascript
 * Author: E Dennison
 */

/*eslint-env jquery*/
/*global ace*/
/*global brython*/
/*global __EXECUTE__BRYTHON__*/
/*eslint-disable no-unused-vars*/
 

/*
 * bsConsole
 * 
 * Console Proxy routes alert and prompt calls to our own handler.
 */
var bsConsole = function() {
    //var consolequeue = [];
    var consolecontext = "";
    const CONSOLETIMEOUT = 10;
    const CONSOLEID = "#console";
    const OLDPROMPT = window.prompt;
    const CONSOLECONTEXTSIZE = 24; // size of a typical old school CRT (VT100)

    // handle console printing
    function PrintConsole(text) {
        var textarea = $(CONSOLEID);
        textarea.val(textarea.val() + text);
        textarea.scrollTop(textarea[0].scrollHeight);
        consolecontext += text;
    }

    function Initialize() {
        // take over the prompt dialog so we can display prompt text in the console
        window.prompt = function(text, defvalue) {
            PrintConsole(text); // put prompt 
            var truncatedcontext = consolecontext.split('\n').slice(-CONSOLECONTEXTSIZE).join('\n');
            var returnedValue = OLDPROMPT(truncatedcontext, defvalue);
            consolecontext = truncatedcontext;
            PrintConsole(returnedValue + "\n");
            return returnedValue;
        };
        // now seize the output
        takeOverConsole();
    }

    // Console hijacker - http://tobyho.com/2012/07/27/taking-over-console-log/
    // target is ID of alternate destination
    function takeOverConsole() {
        var console = window.console;
        if (!console) return;

        function intercept(method) {
            var original = console[method];
            console[method] = function() {
                for (i = 0; i < arguments.length; i++) {
                    if (typeof arguments[i] == "string" && 
                        arguments[i].indexOf("Error 404 means that Python module") == -1 &&
                        arguments[i].indexOf("using indexedDB for stdlib modules cache") == -1) {
                        PrintConsole(arguments[i]);
                    }
                }
                if (original.apply) {
                    // Do this for normal browsers
                    original.apply(console, arguments);
                }
                else {
                    // Do this for IE
                    var message = Array.prototype.slice.apply(arguments).join(' ');
                    original(message);
                }
            };
        }
        var methods = ['log', 'warn', 'error'];
        for (var i = 0; i < methods.length; i++)
            intercept(methods[i]);
    }

    // clear the console output
    function clearConsole() {
        $(CONSOLEID).val('');
        consolecontext = "";
    }

    // public API
    return {
        init: Initialize,
        clear: clearConsole
    };
}();

/* END bsConsole */


/*
 * bsUI
 * 
 * User Interface Functionality
 */
var bsUI = function() {

    const GOOGLE_AUTHORIZE = '#googleloginbutton';
    const GOOGLE_LOAD = '#googleloadbutton';
    const GOOGLE_LOGOUT = '#googlelogoutbutton';
    const GOOGLE_SAVE = '#googlesavebutton';
    const FILE_NAME = '#source_filename';
    const GITHUB_URL = '#github_url';
    const SHARE_URL = '#share_url';
    const URL_SUBMIT = '#url_submit';
    const URL_INPUT = '#url_input';
    const RUN_EDIT = '#run_edit';
    const RUN_EDIT_FORM = '#run_edit_form';
    const GRAPHICS_COL_NAME = '#graphics-column'; // graphics-column
    const CANVAS_NAME = '#ggame-canvas'; // ggame-canvas
    const TURTLE_CANVAS_NAME = "#turtle-canvas";
    const TEXT_COLUMNS = ["col-md-8", "col-md-4", "col-md-0"];
    const CONSOLE_COLUMNS = ["col-md-0", "col-md-12", "col-md-0"];
    const GRAPHICS_COLUMNS = ["col-md-0", "col-md-4", "col-md-8"];

    var editor = null;
    var ingraphics = false;
    var hidedepth = 0;
    
    // hide buttons and show the working indicator
    function showWorking() {
        hidedepth += 1;
        $("#loading").show();
        $("#navigation").hide();
    }
    
    // show buttons and hide working indicator
    function hideWorking() {
        if (hidedepth > 0) {
            hidedepth -= 1;
        }
        if (hidedepth == 0) {
            $("#loading").hide();
            $("#navigation").show();
        }
    }

    function Initialize() {
        // Github link is not visible by default
        $(GITHUB_URL).hide();
        // Share link is not visible by default
        var share_link = $(SHARE_URL);
        if (share_link) {
            share_link.hide();
        }
        // Capture <enter> key on GITHUB_URL and direct to URL_SUBMIT
        $(URL_INPUT).keyup(function(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                $(URL_SUBMIT).click();
            }
        });
        showWorking();
    }



    function setConsoleMode() {
        $("#editor-column").attr("class", CONSOLE_COLUMNS[0]);
        $("#output-column").attr("class", CONSOLE_COLUMNS[1]);
        $(GRAPHICS_COL_NAME).attr("class", CONSOLE_COLUMNS[2]);
        $(GRAPHICS_COL_NAME).hide();
        $("#editor-column").hide();
        $("#haltbutton").prop('disabled', true);
        if (ingraphics && (typeof window.ggame_quit == 'function')) {
            window.ggame_quit();
        }
    }


    function setEditMode() {
        $("#editor-column").attr("class", TEXT_COLUMNS[0]);
        $("#output-column").attr("class", TEXT_COLUMNS[1]);
        $(GRAPHICS_COL_NAME).attr("class", TEXT_COLUMNS[2]);
        $(GRAPHICS_COL_NAME).attr("hidden", true);
        $(TURTLE_CANVAS_NAME).empty();
        $("#editor-column").show();
        $("#haltbutton").prop('disabled', true);
        $("#gobutton").prop('disabled', false);
        if (ingraphics && (typeof window.ggame_quit == 'function')) {
            window.ggame_quit();
        }
        ingraphics = false;
    }

    function setTurtleMode() {
        $("#editor-column").attr("class", GRAPHICS_COLUMNS[0]);
        $("#output-column").attr("class", GRAPHICS_COLUMNS[1]);
        $(GRAPHICS_COL_NAME).attr("class", GRAPHICS_COLUMNS[2]);
        $(GRAPHICS_COL_NAME).attr("hidden", false);
        $(CANVAS_NAME).hide();
        $(TURTLE_CANVAS_NAME).remove();
        $("#haltbutton").prop('disabled', false);
        $("#gobutton").prop('disabled', true);
        $("#editor-column").hide();
    }

    function setGraphicsMode() {
        $("#editor-column").attr("class", GRAPHICS_COLUMNS[0]);
        $("#output-column").attr("class", GRAPHICS_COLUMNS[1]);
        $(GRAPHICS_COL_NAME).attr("class", GRAPHICS_COLUMNS[2]);
        $(CANVAS_NAME).show();
        $(TURTLE_CANVAS_NAME).remove();
        $(CANVAS_NAME).height($(GRAPHICS_COL_NAME).clientHeight);
        $(CANVAS_NAME).width($(GRAPHICS_COL_NAME).clientWidth);
        $("#haltbutton").prop('disabled', false);
        $("#gobutton").prop('disabled', true);
        $("#editor-column").hide();
        $(GRAPHICS_COL_NAME).attr("hidden", false);
        ingraphics = true;
    }

    function setExecMode() {
        $("#editor-column").attr("class", GRAPHICS_COLUMNS[0]);
        $("#output-column").attr("class", GRAPHICS_COLUMNS[1]);
        $(GRAPHICS_COL_NAME).attr("class", GRAPHICS_COLUMNS[2]);
        $(CANVAS_NAME).height($(GRAPHICS_COL_NAME).clientHeight);
        $(CANVAS_NAME).width($(GRAPHICS_COL_NAME).clientWidth);
        $(GRAPHICS_COL_NAME).attr("hidden", true);
        $("#editor-column").attr("class", CONSOLE_COLUMNS[0]);
        $("#output-column").attr("class", CONSOLE_COLUMNS[1]);
        $(GRAPHICS_COL_NAME).attr("class", CONSOLE_COLUMNS[2]);
        $(GRAPHICS_COL_NAME).attr("hidden", true);
        $("#editor-column").hide();

    }


    // Show github or google link
    function showLink(path) {
        var element = $(GITHUB_URL);
        element.attr('href', path);
        element.show();
    }

    // Show share link
    function showShareURL(data) {
        var element = $(SHARE_URL);
        if (data['user'] == '' && data['repo'] == '') {
            element.attr('href', "?gist=" + data['name']);
        }
        else {
            var baseargs = "?user=" + data['user'] + "&repo=" + data['repo'] + "&name=" + data['name'];
            if (data['path'] == '') {
                element.attr('href', baseargs);
            }
            else {
                element.attr('href', baseargs + "&path=" + data['path']);
            }
        }
        element.show();
    }
    
    // show GOOGLE share link
    function showGoogleShareURL(fileId) {
        var element = $(SHARE_URL);
        if (element) {
            element.attr('href', "?fileid=" + fileId);
            element.show();
        }
    }

    // Execute the EDIT button
    function runEdit() {
        $(RUN_EDIT).val($(GITHUB_URL).attr('href'));
        $(RUN_EDIT_FORM).submit();
    }

    // Create editor
    function startEditor() {
        editor = ace.edit("editorace");
        //editor.setTheme("ace/theme/eclipse");
        editor.setShowPrintMargin(true);
        editor.setDisplayIndentGuides(true);
        editor.getSession().setMode("ace/mode/python");
        editor.$blockScrolling = Infinity;
        var textarea = $('textarea[name="editorcache"]').hide();
        if (textarea.val().length != 0) {
            editor.getSession().setValue(textarea.val());
        }
        editor.getSession().on('change', function() {
            textarea.val(editor.getSession().getValue());
        });
    }

    // Get editor content
    function getEditor() {
        if (editor) {
            return editor.getValue();
        }
    }

    // Set editor content
    function setEditor(text) {
        if (editor) {
            editor.setValue(text);
        }
    }

    // Clear editor selection
    function clearEditorSelection() {
        if (editor) {
            editor.selection.clearSelection();
        }
    }
    
    // Show controls appropriate when signed in to Google
    function showGoogle() {
        $(GOOGLE_LOGOUT).show();
        $(GOOGLE_AUTHORIZE).hide();
        $(GOOGLE_LOAD).show();
        $(GOOGLE_SAVE).show();
    }
    
    // Hide controls appropriate when not signed in to Google
    function hideGoogle() {
        $(GOOGLE_AUTHORIZE).show();
        $(GOOGLE_LOAD).hide();
        $(GOOGLE_LOGOUT).hide();
        $(GOOGLE_SAVE).hide();
    }

    // Public API
    return {
        URL_INPUT: URL_INPUT,
        FILE_NAME: FILE_NAME,
        init: Initialize,
        showlink: showLink,
        showshareurl: showShareURL,
        showgoogleshareurl: showGoogleShareURL,
        runedit: runEdit,
        starteditor: startEditor,
        geteditor: getEditor,
        seteditor: setEditor,
        clearselect: clearEditorSelection,
        editmode: setEditMode,
        turtlemode: setTurtleMode,
        graphicsmode: setGraphicsMode,
        consolemode: setConsoleMode,
        executemode: setTurtleMode,  //setExecMode
        showgoogle: showGoogle,
        hidegoogle: hideGoogle,
        showworking: showWorking,
        hideworking: hideWorking,
    };

}();
/* END bsUI */


/*
 * bsGithubUtil
 * 
 * Github Utilities
 */
var bsGithubUtil = function() {

    // create a Github file path
    function createGithubPath(data) {
        var path = data['path'];
        if (path.length > 0 && path.substr(path.length - 1) != "/") {
            path += "/";
        }
        path += data['name'];
        return path;
    }

    // create a Github URL text for specific file
    function createGithubURL(data) {
        var url = 'not found...';
        if (data['user'] != '' && data['repo'] != '') {
            url = "https://github.com/" + data['user'] + "/" + data['repo'];
            url += "/blob/master/" + createGithubPath(data);
        }
        else if (data['name'] != '') {
            url = "https://gist.github.com/" + data['name'];
        }
        return url;
    }

    // parse Github URL text
    function parseGithubURL(url_input) {
        var data = { 'user': '', 'repo': '', 'path': '', 'name': '' };
        if (url_input == null) {
            return data;
        }
        // attempt a single file match
        // example: https://github.com/tiggerntatie/brython-student-test/blob/master/hello.py
        // example: https://github.com/tiggerntatie/hhs-cp-site/blob/master/hhscp/static/exemplars/c02hello.py
        // example subtree: https://github.com/tiggerntatie/hhs-cp-site/tree/master/hhscp/static/exemplars
        var gittreematch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+)\/tree\/master\/(.+)/);
        var gitfilematch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+)\/blob\/master\/([^/]+)/);
        var gittreefilematch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+)\/blob\/master\/(.+)\/([^/]+)/);
        var gitrepomatch = url_input.match(/.*github\.com\/([^/]+)\/([^/]+).*/);
        var gisturlmatch = url_input.match(/.*gist\.github\.com(\/[^/]+)?\/([0-9,a-f]+)/);
        var gistmatch = url_input.match(/^[0-9,a-f]+$/);
        if (gisturlmatch || gistmatch) {
            var gist = gisturlmatch ? gisturlmatch[2] : gistmatch[0];
            data = { 'user': '', 'repo': '', 'path': '', 'name': gist };
        }
        else if (gitrepomatch) {
            data = { 'user': gitrepomatch[1], 'repo': gitrepomatch[2], 'path': '', 'name': '' };
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
    function parseGithub(UI) {
        return parseGithubURL($(UI.URL_INPUT).val());
    }



    return {
        parse: parseGithub,
        parseurl: parseGithubURL,
        createurl: createGithubURL
    };

}();
/* END bsGithubUtil */


/*
 * bsGoogleUtil
 * 
 * Google Utilities
 */
var bsGoogleUtil = function() {

    // create a Google URL text for specific file
    function createGoogleURL(id){ 
        return "https://drive.google.com/file/d/" + id + "/view";
    }

    // parse Google URL text
    // e.g. https://drive.google.com/a/hanovernorwichschools.org/file/d/1OGC1fguuXR_-PKraS9vYbYVunVYjKNFY/view?usp=drive_web
    function parseGoogleURL(url_input) {
        if (url_input == null) {
            return null;
        }
        return url_input.match(/[-_\w]{25,}/);
    }

    // parse the url_input and return id
    function parseGoogle(UI) {
        return parseGoogleURL($(UI.URL_INPUT).val());
    }



    return {
        parse: parseGoogle,
        parseurl: parseGoogleURL,
        createurl: createGoogleURL
    };

}();
/* END bsGoogleUtil */


/*
 * bsController
 * 
 * Miscellaneous actions and network transactions
 */
var bsController = function() {

    var maincontent = '';
    var mainscript = null;
    const __MAIN__ = "__main__";
    var initialized = false;
    var gdrive_fileid_loaded = null;

    // Initialize the brython interpreter
    function initBrython() {
        if (!initialized) {
            brython(1);
            initialized = true;
        }
    }

    // Execute the brython interpreter
    function runBrython(console) {
        console.clear();
        __EXECUTE__BRYTHON__();
    }

    function removeMainScript() {
        if (mainscript) {
            document.head.removeChild(mainscript);
        }
    }

    function initMainScript() {
        removeMainScript();
        mainscript = document.createElement('script');
        mainscript.type = "text/python";
        mainscript.async = false;
        mainscript.id = __MAIN__;
    }

    // Set main python script as inline
    function setMainValue(txt) {
        initMainScript();
        mainscript.innerHTML = txt;
        document.head.appendChild(mainscript);
    }

    // load script from github, embed in html and execute
    // data dictionary input includes user, repo, name and path (fragment)
    function runGithub(Console, UI, data) {
        initBrython();
        loadGithubtoScript(UI, data, function(result) {
            setMainValue(maincontent);
            if (mainscript) {
                UI.hideworking();
                runBrython(Console);
            }
        });
    }
    
    
    // load script from google and execute
    function runGoogle(Console, UI, fileId) {
        initBrython();
        loadGoogletoScript(UI, fileId, function() {
            setMainValue(maincontent);
            if (mainscript) {
                runBrython(Console);
            }
        });
    }
    

    // re-execute current mainscript
    function runCurrent(Console) {
        if (mainscript) {
            runBrython(Console);
        }
    }

    // execute contents of editor and update server with new content
    function runEditor(UI, Console) {
        setMainValue(UI.geteditor());
        runCurrent(Console);
    }

    // send request to login to github
    function loginGithub(UI) {
        $('#run_auth_request').submit();
    }

    // send request to logout of github
    // only FORGETS out github authorization - does not log out of github, per se
    function logoutGithub() {
        $('#run_auth_forget').submit();
    }

    // send request to commit/save to github
    function commitGithub(GH, UI) {
        var d = new Date();
        var ds = d.toLocaleDateString();
        var ts = d.toLocaleTimeString();
        var data = GH.parse(UI);
        data['editcontent'] = UI.geteditor();
        data['commitmsg'] = "Updated from Brython Server: " + ds + " " + ts;
        UI.showworking();
        $.ajax({
            url: 'api/v1/commit',
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json',
            data: JSON.stringify(data),
            type: 'PUT',
            complete: function() {UI.hideworking();},
            success: function(data) {},
            error: function(err) {
                alert(err.responseJSON.message);
            }
        });
    }

    // read main github script name and content
    // return file name
    function loadGithubtoScript(UI, data, callback) {
        if (data) {
            UI.showworking();
            $.ajax({
                url: 'api/v1/load',
                contentType: 'application/json; charset=UTF-8',
                dataType: 'json',
                data: JSON.stringify(data),
                type: 'PUT',
                complete: function() {UI.hideworking();},
                success: function(data) {
                    maincontent = data['content'];
                    UI.showlink(data['path']);
                    callback(data);
                },
                error: function(err) {
                    alert(err.responseJSON.message);
                }

            });
        }
    }

    // load main github script name, insert content in editor
    function loadGithub(GH, UI) {
        var data = GH.parse(UI);
        loadGithubtoScript(UI, data,
            function(result) {
                data = GH.parseurl(result['path']);
                $(UI.URL_INPUT).val(GH.createurl(data));
                UI.showshareurl(data);
                UI.seteditor(maincontent);
                UI.clearselect();
            });

    }

    // Handling Google Drive and Oauth2
    // See: https://developers.google.com/identity/protocols/OAuth2UserAgent#example

    // Required for Google OAuth2
    //var GoogleAuth;
    var google_scope = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.install";
    var google_apikey = false;
    var google_clientid = false;
    var google_appid = false;
    var post_google_init = function() {}
    
    // Google OAuth2 handleClientLoad
    // also record whether exec or index
    function handleClientLoad(clientid, apikey, appid, callback) {
        post_google_init = callback;
        // Load the API's client and auth2 modules.
        // Call the initClient function after the modules load.
        google_clientid = clientid;
        google_apikey = apikey;
        google_appid = appid;
        gapi.load('client:auth2', initClient);
    }
    
    function initClient() {
        var UI = bsUI;
        var Console = bsConsole;

        // Retrieve the discovery document for version 3 of Google Drive API.
        // In practice, your app can retrieve one or more discovery documents.
        var discoveryUrl = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

        // Initialize the gapi.client object, which app uses to make API requests.
        // Get API key and client ID from API Console.
        // 'scope' field specifies space-delimited list of access scopes.
        gapi.client.init({
            'apiKey': google_apikey,
            'discoveryDocs': [discoveryUrl],
            'clientId': google_clientid,
            'scope': google_scope
        }).then(function () {
            var GoogleAuth = gapi.auth2.getAuthInstance();
            // Handle initial sign-in state. (Determine if user is already signed in.)
            var user = GoogleAuth.currentUser.get();
            // Listen for sign-in state changes.
            GoogleAuth.isSignedIn.listen(setSigninStatus);
            // get the google buttons visible
            setSigninStatus();
            // now show all of the buttons
            UI.hideworking();
            $("span#navigation").removeClass("hidden");
            // post execute something
            post_google_init();
        }, function () {
            UI.hideworking();
            $("span#navigation").removeClass("hidden");
        });
    }
    
    
    // read script from google
    function loadGoogletoScript(UI, fileId, callback) {
        var UI = bsUI;
        var GU = bsGoogleUtil;
        UI.showworking();
        var request = gapi.client.drive.files.get({
            fileId: fileId,
        });
        request.then(function(response){
            // first, get the filename
            $(UI.FILE_NAME).val(response.result.name);
            // set up for another "get" for the data
            var request = gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media'
            });
            request.then(
                function(response) {
                    $(UI.URL_INPUT).val(GU.createurl(fileId));
                    maincontent = response.body;
                    UI.showlink(GU.createurl(fileId));
                    UI.seteditor(maincontent);
                    UI.clearselect();
                    UI.showgoogleshareurl(fileId);
                    gdrive_fileid_loaded = fileId;
                    UI.hideworking();
                    callback();
                }, 
                function(error) {
                    UI.hideworking();
                    gdrive_fileid_loaded = null;
                    alert("Something went wrong loading your file from Google Drive!")
                    console.error(error);
            });
        },
            function(error) {
            UI.hideworking();
            gdrive_fileid_loaded = null;
            alert("Not Found")
            console.error(error);
        })
    }

    // from https://stackoverflow.com/questions/39381563/get-file-content-of-google-docs-using-google-drive-api-v3
    function pickerLoadFile(data) {
        if (data.action == google.picker.Action.PICKED) {
            var file = data.docs[0];
            var fileId = file.id;
            var fileName = file.name;
            var fileUrl = file.url;
            var UI = bsUI;
            var request = gapi.client.drive.files.get({
                'fields': ['url','title'],
                fileId: fileId,
                alt: 'media'
            })
            UI.showworking();
            request.then(function(response) {
                UI.seteditor(response.body);
                UI.clearselect();
                $(UI.FILE_NAME).val(fileName);
                $(UI.URL_INPUT).val(fileUrl);
                gdrive_fileid_loaded = fileId;
                UI.hideworking();
                UI.showgoogleshareurl(fileId);
            }, function(error) {
                UI.hideworking();
                console.error(error);
            })
            return request;
        }
    }
    
  
    
    // Create and render a Picker object for searching images.
    function loadPicker() {
        var GoogleAuth = gapi.auth2.getAuthInstance();
        if (!GoogleAuth.isSignedIn.get()) {
            // User is not signed in. Start Google auth flow.
            GoogleAuth.signIn();
        }
        var oauthToken = gapi.auth.getToken().access_token;
        gapi.load('picker', {'callback': function(){
            if (oauthToken) {
            //var view = new google.picker.View(google.picker.ViewId.DOCS);
            var view = new google.picker.DocsView();
                view.setParent('root');
                view.setIncludeFolders(true);
            view.setMimeTypes("text/plain,text/x-python");
            var picker = new google.picker.PickerBuilder()
                .enableFeature(google.picker.Feature.NAV_HIDDEN)
                .enableFeature(google.picker.Feature.MULTISELECT_DISABLED)
                .setAppId(google_appid)
                .setOAuthToken(oauthToken)
                .addView(view)
                .addView(new google.picker.DocsUploadView())
                .setDeveloperKey(google_apikey)
                .setCallback(pickerLoadFile)
                .build();

             picker.setVisible(true);
            }
        }});
    }
    
    // Save content to Google Drive with ID (already authenticated)
    // File ID must be in gdrive_fileid_loaded
    function gdriveSaveFile() {
        var UI = bsUI;
        var fileId = gdrive_fileid_loaded;
        var content = UI.geteditor();
        var contentArray = new Array(content.length);
        for (var i = 0; i < contentArray.length; i++) 
        {
            contentArray[i] = content.charCodeAt(i);
        }
        var byteArray = new Uint8Array(contentArray);
        var blob = new Blob([byteArray], {type: 'text/x-python'});  
        UI.showworking();
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.onreadystatechange = function() {
            if (xhr.readyState != XMLHttpRequest.DONE) {
                return;
            }
            bsUI.hideworking();  // why didn't it know about UI here?
            switch (xhr.status) {
                case 200:
                    var UI = bsUI;
                    $(UI.URL_INPUT).val(bsGoogleUtil.createurl(gdrive_fileid_loaded));
                    break;
                default:
                    alert("Unable to save code to Google Drive.")
                    break;
                    
            }
        };
        xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media');
        xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token);
        xhr.send(blob);
    }
    
    
    // Handle the Google Drive "save" button
    function saveGoogle() {
        var GoogleAuth = gapi.auth2.getAuthInstance();
        if (!GoogleAuth.isSignedIn.get()) {
            // User is not signed in. Start Google auth flow.
            GoogleAuth.signIn();
        }
        var oauthToken = gapi.auth.getToken().access_token;
        if (oauthToken) {
            if (gdrive_fileid_loaded) {
                gdriveSaveFile();
            }
            else {
                $("#newfileModal").modal();
            }
        }
    }
    
    // function called following successful processing of new file modal
    function saveGoogleWithName(newfilename, folderid) {
        if (newfilename != null) {
            var fileMetadata = {
              'name' : newfilename,
              'mimeType' : 'text/x-python',
              'alt' : 'media',
              'parents' : [(folderid ? folderid : "root"),],
              'useContentAsIndexableText' : true
            };
            gapi.client.drive.files.create({
              resource: fileMetadata,
            }).then(function(response) {
              switch(response.status){
                case 200:
                    var file = response.result;
                    var UI = bsUI;
                    $(UI.FILE_NAME).val(file.name);
                    gdrive_fileid_loaded = file.id;
                    gdriveSaveFile();
                    break;
                default:
                  alert("Unable to create file in Google Drive");
                  break;
                }
            });
        }
    }

    
    // revoke google authorization
    function revokeAccess() {
        var GoogleAuth = gapi.auth2.getAuthInstance();
        GoogleAuth.disconnect();
        setSigninStatus();
        gdrive_fileid_loaded = null;
    }
    
    // update display according to whether user is logged in to google
    function setSigninStatus() {
        var UI = bsUI;
        var GoogleAuth = gapi.auth2.getAuthInstance();
        var user = GoogleAuth.currentUser.get();
        var isAuthorized = user.hasGrantedScopes(google_scope);
        if (isAuthorized) {
            UI.showgoogle();
        } else {
            UI.hidegoogle();
        }
    }
    
    // examine the Url and attempt to parse as Google (1st) or Github (2nd)
    function loadCloud(GH, GU, UI) {
        var fileId = GU.parse(UI);
        if (fileId) {
            loadGoogletoScript(UI, fileId, function() {});
        }
        else {
            var data = GH.parse(UI);
            loadGithubtoScript(UI, data,
                function(result) {
                    data = GH.parseurl(result['path']);
                    $(UI.URL_INPUT).val(GH.createurl(data));
                    $(UI.FILE_NAME).val(data['name']);
                    UI.showshareurl(data);
                    UI.seteditor(maincontent);
                    UI.clearselect();
                    UI.hideworking();
                });
        }
    }
    
    
    // log in to Google and grant basic permissions
    function loginGoogle() {
        var GoogleAuth = gapi.auth2.getAuthInstance();
        if (!GoogleAuth.isSignedIn.get()) {
            // User is not signed in. Start Google auth flow.
            GoogleAuth.signIn();
        }
    }
    
    
    return {
        rungithub: runGithub,
        run: runCurrent,
        login: loginGithub,
        logout: logoutGithub,
        commit: commitGithub,
        load: loadCloud,
        runeditor: runEditor,
        init: initBrython,
        googleclientload: handleClientLoad,
        googleclientinit: initClient,
        googleloadclick: loadPicker,
        googlesaveclick: saveGoogle,
        googlerevoke: revokeAccess,
        googlesetstatus: setSigninStatus,
        googlelogout: revokeAccess,
        googlelogin: loginGoogle,
        googlesavename: saveGoogleWithName,
        rungoogle: runGoogle,
    };
}();
/* END bsController */
