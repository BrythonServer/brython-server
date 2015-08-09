/*
 * Brython-server default javascript
 */
 
 
/*
 * bsConsole
 * 
 * Console Proxy routes alert and prompt calls to our own handler.
 */
var bsConsole = function(){
    var consolequeue = [];
    var consoletimer = null;
    const CONSOLETIMEOUT = 10;
    const CONSOLEID = "#console";
    const OLDPROMPT = window.prompt;
    
    // periodically update the console control
    function Timeout() {
        var textarea = $(CONSOLEID)
        textarea.append(consolequeue.join(""))
        textarea.scrollTop(textarea[0].scrollHeight);
        consolequeue = [];
        consoletimer = null;
    }    

    function Initialize() {
        // take over the prompt dialog so we can display prompt text in the console
        window.prompt = function(text, defvalue) {
            // flush any pending console writes
            if (consoletimer) {
                window.clearTimeout(consoletimer);
                Timeout(); // flush the queue
            }
            consolequeue.push(text);  // put prompt 
            Timeout(); // onto console
            var returnedValue = OLDPROMPT(text, defvalue);
            consolequeue.push(returnedValue);  // and the response...
            consolequeue.push('\n');
            Timeout();
            return returnedValue;
        }
        // now seize the output
        takeOverConsole();
    }

    // Console hijacker - http://tobyho.com/2012/07/27/taking-over-console-log/
    // target is ID of alternate destination
    function takeOverConsole(){
        var console = window.console;
        if (!console) return;
        function intercept(method){
            var original = console[method]
            console[method] = function(){
                for (i = 0; i < arguments.length; i++) {
                    if (arguments[i].indexOf("Error 404 means that Python module") != 0) {
                        if (!consoletimer) {
                            consoletimer = window.setTimeout(Timeout, CONSOLETIMEOUT);
                        }
                        consolequeue.push(arguments[i]);
                    }
                }            
                if (original.apply){
                    // Do this for normal browsers
                    original.apply(console, arguments)
                }else{
                    // Do this for IE
                    var message = Array.prototype.slice.apply(arguments).join(' ')
                    original(message)
                }
            }
        }
        var methods = ['log', 'warn', 'error']
        for (var i = 0; i < methods.length; i++)
            intercept(methods[i])
    }

    // clear the console output
    function clearConsole() {
        $(CONSOLEID).html('');
    }

    // public API
    return{
        timeout:Timeout,
        init:Initialize,
        clear:clearConsole
    }
}();

/* END bsConsole */


/*
 * bsUI
 * 
 * User Interface Functionality
 */
var bsUI = function(){

    const GITHUB_URL = '#github_url'
    const SHARE_URL = '#share_url'
    const URL_SUBMIT = '#url_submit'
    const URL_INPUT = '#url_input'
    const RUN_EDIT = '#run_edit'
    const RUN_EDIT_FORM = '#run_edit_form'
    
    var editor = null;
    
    function Initialize() {
        // Github link is not visible by default
        $(GITHUB_URL).hide();
        // Share link is not visible by default
        var share_link = $(SHARE_URL);
        if (share_link) {
            share_link.hide();
        }
        // Capture <enter> key on GITHUB_URL and direct to URL_SUBMIT
        $(URL_INPUT).keyup(function(event){
            if(event.keyCode == 13){
                event.preventDefault();
                $(URL_SUBMIT).click();
            }
        });
        // loading image
        $( "#loading").hide();
        $("#navigation").show();
        $( document ).ajaxStart(function() {
            $( "#loading" ).show();
            $("#navigation").hide();
        });
        $( document ).ajaxComplete(function() {
            $( "#loading" ).hide();
            $("#navigation").show();
        });
    }

    // Show github link
    function showGithub(path) {
        var element = $(GITHUB_URL);
        element.attr('href', path);
        element.show();
    }

    // Show share link
    function showShareURL(data) {
        var element = $(SHARE_URL)
        var baseargs = "?user=" + data['user'] + "&repo=" + data['repo'] + "&name=" + data['name'];
        if (data['path'] == '') {
            element.attr('href', baseargs)
        }
        else {
            element.attr('href', baseargs +  "&path=" + data['path'])
        }
        element.show()
    }

    // Execute the EDIT button
    function runEdit() {
        $(RUN_EDIT).val($(GITHUB_URL).attr('href'))
        $(RUN_EDIT_FORM).submit();
    }
    
    // Create editor
    function startEditor() {
        editor = ace.edit("editor");
        //editor.setTheme("ace/theme/eclipse");
        editor.setShowPrintMargin(true);
        editor.setDisplayIndentGuides(true);
        editor.getSession().setMode("ace/mode/python");
        editor.$blockScrolling = Infinity;
        var textarea = $('textarea[name="editor"]').hide();
        if (textarea.val().length != 0) {
            editor.getSession().setValue(textarea.val());
        }
        editor.getSession().on('change', function(){
          textarea.val(editor.getSession().getValue());
        });
    }

    // Get editor content
    function getEditor() {
        if (editor) {
            return editor.getValue()
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
    
    // Public API
    return {
        URL_INPUT:URL_INPUT,
        init:Initialize,
        showgithub:showGithub,
        showshareurl:showShareURL,
        runedit:runEdit,
        starteditor:startEditor,
        geteditor:getEditor,
        seteditor:setEditor,
        clearselect:clearEditorSelection
    }
    
}();
/* END bsUI */


/*
 * bsGithubUtil
 * 
 * Github Utilities
 */
var bsGithubUtil = function(){
    
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
        var url = 'not found...';
        if (data['user'] != '' && data['repo'] != '') {
            url = "https://github.com/" + data['user'] + "/" + data['repo'] 
            url += "/blob/master/" + createGithubPath(data);
        }
        return url
    }
    
    // parse Github URL text
    function parseGithubURL(url_input) {
        var data = {'user':'', 'repo':'', 'path':'', 'name':''};
        if (url_input == null){
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
    function parseGithub(UI) {
        return parseGithubURL($(UI.URL_INPUT).val())
    }


    
    return {
        parse:parseGithub,
        parseurl:parseGithubURL,
        createurl:createGithubURL
    }
    
}();
/* END bsGithubUtil */


/*
 * bsController
 * 
 * Miscellaneous actions and network transactions
 */
var bsController = function(){

    var maincontent = ''
    var mainscript = null;
    const __MAIN__ = "__main__";

    // Execute the brython interpreter
    function runBrython(console, argdict) {
        console.clear();
        brython(argdict);
    }
    
    function removeMainScript() {
        if (mainscript) {
            document.head.removeChild(mainscript);
        }
    }
    
    function initMainScript() {
        removeMainScript()
        mainscript = document.createElement('script');
        mainscript.type = "text/python";
        mainscript.async = false;
        mainscript.id = __MAIN__;
    }
    
    // Set main python script as inline
    function setMainValue(txt) {
        initMainScript()
        mainscript.innerHTML = txt;
        document.head.appendChild(mainscript);
    }

    // load script from github, embed in html and execute
    // data dictionary input includes user, repo, name and path (fragment)
    function runGithub(Console, UI, data) {
        loadGithubtoScript(UI, data, function(result){
            setMainValue(maincontent);
            if (mainscript) {
                $( "#loading" ).hide();
                $("#navigation").show();
                runBrython(Console, {debug:1, ipy_id:[__MAIN__]});
            }
        });
    }
    
    // re-execute current mainscript
    function runCurrent(Console) {
        if (mainscript) {
                runBrython(Console, {debug:1, ipy_id:[__MAIN__]});
        }
    }
    
    // execute contents of editor and update server with new content
    function runEditor(UI, Console) {
        setMainValue(UI.geteditor());
        runCurrent(Console)
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
        var d = new Date()
        var ds = d.toLocaleDateString()
        var ts = d.toLocaleTimeString()
        var data = GH.parse(UI);
        data['editcontent'] = UI.geteditor();
        data['commitmsg'] = "Updated from Brython Server: "+ds+" "+ts;
        $.ajax({
            url        : 'api/v1/commit',
            contentType: 'application/json; charset=UTF-8', 
            dataType   : 'json',
            data       : JSON.stringify(data),
            type       : 'PUT',
            complete   : function() {
            },
            success    : function(data){
            },
            error      : function(err){
                alert(err.responseJSON.message)
            }
        });            
    }

    // read main github script name and content
    // return file name
    function loadGithubtoScript(UI, data, callback) {
        if (data) {
            $.ajax({
                url        : 'api/v1/load',
                contentType: 'application/json; charset=UTF-8', 
                dataType   : 'json',
                data       : JSON.stringify(data),
                type       : 'PUT',
                complete   : function() {
                },
                success    : function(data){
                    maincontent = data['content'];
                    UI.showgithub(data['path']);
                    callback(data);
                },
                error      : function(){
                }
            
            });        
        }
    }

    // load main github script name, insert content in editor
    function loadGithub(GH, UI) {
        var data = GH.parse(UI);
        loadGithubtoScript(UI, data,
            function(result){
                data = GH.parseurl(result['path']);
                $(UI.URL_INPUT).val(GH.createurl(data))
                UI.showshareurl(data);
                UI.seteditor(maincontent);
                UI.clearselect();
            });
        
    }


    return {
        rungithub:runGithub,
        run:runCurrent,
        login:loginGithub,
        logout:logoutGithub,
        commit:commitGithub,
        load:loadGithub,
        runeditor:runEditor,
    }
}()
/* END bsController */

// Execute from here
bsConsole.init();
bsUI.init();