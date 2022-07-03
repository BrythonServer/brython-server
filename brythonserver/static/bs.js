/*
 * Brython-server default javascript
 * Author: E Dennison
 */

/* eslint-env jquery */
/* global ace */
/* global brython */
/* global gapi */
/* global google */
/* global XMLHttpRequest */
/* global Blob */
/* global alert */
/* global __EXECUTE__BRYTHON__ */
/* eslint-disable no-unused-vars, no-var */

/*
 * bsConsole
 *
 * Console Proxy routes alert and prompt calls to our own handler.
 */
var bsConsole = (function () {
  // var consolequeue = [];
  let consolecontext = ''
  const CONSOLEID = '#console'
  const OLDPROMPT = window.prompt
  const CONSOLECONTEXTSIZE = 24 // size of a typical old school CRT (VT100)

  // handle console printing
  function PrintConsole (text) {
    const textarea = $(CONSOLEID)
    textarea.val(textarea.val() + text)
    textarea.scrollTop(textarea[0].scrollHeight)
    consolecontext += text
  }

  function Initialize () {
    // take over the prompt dialog so we can display prompt text in the console
    window.prompt = function (text, defvalue) {
      PrintConsole(text) // put prompt
      const truncatedcontext = consolecontext.split('\n').slice(-CONSOLECONTEXTSIZE).join('\n')
      const returnedValue = OLDPROMPT(truncatedcontext, defvalue)
      consolecontext = truncatedcontext
      PrintConsole(returnedValue + '\n')
      return returnedValue
    }
    // now seize the output
    takeOverConsole()
  }

  // Console hijacker - http://tobyho.com/2012/07/27/taking-over-console-log/
  // target is ID of alternate destination
  function takeOverConsole () {
    const console = window.console
    if (!console) return

    function intercept (method) {
      const original = console[method]
      console[method] = function () {
        for (let i = 0; i < arguments.length; i++) {
          if (typeof arguments[i] === 'string' &&
                        arguments[i].indexOf('Error 404 means that Python module') === -1 &&
                        arguments[i].indexOf('using indexedDB for stdlib modules cache') === -1) {
            PrintConsole(arguments[i])
          }
        }
        if (original.apply) {
          // Do this for normal browsers
          original.apply(console, arguments)
        } else {
          // Do this for IE
          const message = Array.prototype.slice.apply(arguments).join(' ')
          original(message)
        }
      }
    }
    const methods = ['log', 'warn', 'error']
    for (let i = 0; i < methods.length; i++) { intercept(methods[i]) }
  }

  // clear the console output
  function clearConsole () {
    $(CONSOLEID).val('')
    consolecontext = ''
  }

  // public API
  return {
    init: Initialize,
    clear: clearConsole
  }
}())

/* END bsConsole */

/*
 * bsUI
 *
 * User Interface Functionality
 */
var bsUI = (function () {
  const GOOGLE_AUTHORIZE = '#googleloginbutton'
  const GOOGLE_LOAD = '#googleloadbutton'
  const GOOGLE_LOGOUT = '#googlelogoutbutton'
  const GOOGLE_SAVE = '#googlesavebutton'
  const FILE_NAME = '#source_filename'
  const GITHUB_URL = '#github_url'
  const SHARE_URL = '#share_url'
  const URL_SUBMIT = '#url_submit'
  const URL_INPUT = '#url_input'
  const RUN_EDIT = '#run_edit'
  const RUN_EDIT_FORM = '#run_edit_form'
  const GRAPHICS_COL_NAME = '#graphics-column' // graphics-column
  const CANVAS_NAME = '#ggame-canvas' // ggame-canvas
  const TURTLE_CANVAS_NAME = '#turtle-canvas'
  const TEXT_COLUMNS = ['col-md-8', 'col-md-4', 'col-md-0']
  const CONSOLE_COLUMNS = ['col-md-0', 'col-md-12', 'col-md-0']
  const GRAPHICS_COLUMNS = ['col-md-0', 'col-md-4', 'col-md-8']

  let editor = null
  let ingraphics = false
  let hidedepth = 0

  // hide buttons and show the working indicator
  function showWorking () {
    hidedepth += 1
    $('#loading').show()
    $('#navigation').hide()
  }

  // show buttons and hide working indicator
  function hideWorking () {
    if (hidedepth > 0) {
      hidedepth -= 1
    }
    if (hidedepth === 0) {
      $('#loading').hide()
      $('#navigation').show()
    }
  }

  function Initialize () {
    // Github link is not visible by default
    $(GITHUB_URL).hide()
    // Share link is not visible by default
    const shareLink = $(SHARE_URL)
    if (shareLink) {
      shareLink.hide()
    }
    // Capture <enter> key on GITHUB_URL and direct to URL_SUBMIT
    $(URL_INPUT).keyup(function (event) {
      if (event.keyCode === 13) {
        event.preventDefault()
        $(URL_SUBMIT).click()
      }
    })
    // showWorking()
  }

  function setConsoleMode () {
    $('#editor-column').attr('class', CONSOLE_COLUMNS[0])
    $('#output-column').attr('class', CONSOLE_COLUMNS[1])
    $(GRAPHICS_COL_NAME).attr('class', CONSOLE_COLUMNS[2])
    $(GRAPHICS_COL_NAME).hide()
    $('#editor-column').hide()
    $('#haltbutton').prop('disabled', true)
    if (ingraphics && (typeof window.ggame_quit === 'function')) {
      window.ggame_quit()
    }
  }

  function setEditMode () {
    $('#editor-column').attr('class', TEXT_COLUMNS[0])
    $('#output-column').attr('class', TEXT_COLUMNS[1])
    $(GRAPHICS_COL_NAME).attr('class', TEXT_COLUMNS[2])
    $(GRAPHICS_COL_NAME).attr('hidden', true)
    $(TURTLE_CANVAS_NAME).empty()
    $('#editor-column').show()
    $('#haltbutton').prop('disabled', true)
    $('#gobutton').prop('disabled', false)
    if (ingraphics && (typeof window.ggame_quit === 'function')) {
      window.ggame_quit()
    }
    ingraphics = false
  }

  function setTurtleMode () {
    $('#editor-column').attr('class', GRAPHICS_COLUMNS[0])
    $('#output-column').attr('class', GRAPHICS_COLUMNS[1])
    $(GRAPHICS_COL_NAME).attr('class', GRAPHICS_COLUMNS[2])
    $(GRAPHICS_COL_NAME).attr('hidden', false)
    $(CANVAS_NAME).hide()
    $(TURTLE_CANVAS_NAME).remove()
    $('#haltbutton').prop('disabled', false)
    $('#gobutton').prop('disabled', true)
    $('#editor-column').hide()
  }

  function setGraphicsMode () {
    $('#editor-column').attr('class', GRAPHICS_COLUMNS[0])
    $('#output-column').attr('class', GRAPHICS_COLUMNS[1])
    $(GRAPHICS_COL_NAME).attr('class', GRAPHICS_COLUMNS[2])
    $(CANVAS_NAME).show()
    $(TURTLE_CANVAS_NAME).remove()
    $(CANVAS_NAME).height($(GRAPHICS_COL_NAME).clientHeight)
    $(CANVAS_NAME).width($(GRAPHICS_COL_NAME).clientWidth)
    $('#haltbutton').prop('disabled', false)
    $('#gobutton').prop('disabled', true)
    $('#editor-column').hide()
    $(GRAPHICS_COL_NAME).attr('hidden', false)
    ingraphics = true
  }

  // Show github or google link
  function showLink (path) {
    const element = $(GITHUB_URL)
    element.attr('href', path)
    element.show()
  }

  // Show share link
  function showShareURL (data) {
    const element = $(SHARE_URL)
    if (data.user === '' && data.repo === '') {
      element.attr('href', '?gist=' + data.name)
    } else {
      const baseargs = '?user=' + data.user + '&repo=' + data.repo + '&branch=' + data.branch + '&name=' + data.name
      if (data.path === '') {
        element.attr('href', baseargs)
      } else {
        element.attr('href', baseargs + '&path=' + data.path)
      }
    }
    element.show()
  }

  // show GOOGLE share link
  function showGoogleShareURL (fileId) {
    const element = $(SHARE_URL)
    if (element) {
      element.attr('href', '?fileid=' + fileId)
      element.show()
    }
  }

  // Execute the EDIT button
  function runEdit () {
    $(RUN_EDIT).val($(GITHUB_URL).attr('href'))
    $(RUN_EDIT_FORM).submit()
  }

  // Create editor
  function startEditor () {
    editor = ace.edit('editorace')
    // editor.setTheme("ace/theme/eclipse");
    editor.setShowPrintMargin(true)
    editor.setDisplayIndentGuides(true)
    editor.getSession().setMode('ace/mode/python')
    editor.$blockScrolling = Infinity
    const textarea = $('textarea[name="editorcache"]').hide()
    if (textarea.val().length !== 0) {
      editor.getSession().setValue(textarea.val())
    }
    editor.getSession().on('change', function () {
      textarea.val(editor.getSession().getValue())
    })
  }

  // Get editor content
  function getEditor () {
    if (editor) {
      return editor.getValue()
    }
  }

  // Set editor content
  function setEditor (text) {
    if (editor) {
      editor.setValue(text)
    }
  }

  // Clear editor selection
  function clearEditorSelection () {
    if (editor) {
      editor.selection.clearSelection()
    }
  }

  // Show controls appropriate when signed in to Google
  function showGoogle () {
    $(GOOGLE_LOGOUT).show()
    $(GOOGLE_AUTHORIZE).hide()
    $(GOOGLE_LOAD).show()
    $(GOOGLE_SAVE).show()
  }

  // Hide controls appropriate when not signed in to Google
  function hideGoogle () {
    $(GOOGLE_AUTHORIZE).show()
    $(GOOGLE_LOAD).hide()
    $(GOOGLE_LOGOUT).hide()
    $(GOOGLE_SAVE).hide()
  }

  // Public API
  return {
    URL_INPUT,
    FILE_NAME,
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
    executemode: setTurtleMode, // setExecMode
    showgoogle: showGoogle,
    hidegoogle: hideGoogle,
    showworking: showWorking,
    hideworking: hideWorking
  }
}())
/* END bsUI */

/*
 * bsGithubUtil
 *
 * Github Utilities
 */
var bsGithubUtil = (function () {
  // create a Github file path
  function createGithubPath (data) {
    let path = data.path
    if (path.length > 0 && path.substr(path.length - 1) !== '/') {
      path += '/'
    }
    path += data.name
    return path
  }

  // create a Github URL text for specific file
  function createGithubURL (data) {
    let url = 'not found...'
    if (data.user !== '' && data.repo !== '') {
      url = 'https://github.com/' + data.user + '/' + data.repo
      url += '/blob/' + data.branch + '/' + createGithubPath(data)
    } else if (data.name !== '') {
      url = 'https://gist.github.com/' + data.name
    }
    return url
  }

  // parse Github URL text
  function parseGithubURL (urlInput) {
    let data = {
      user: '',
      repo: '',
      branch: '',
      path: '',
      name: ''
    }
    if (urlInput == null) {
      return data
    }
    // attempt a single file match
    // example: https://github.com/tiggerntatie/brython-student-test/blob/master/hello.py
    // example: https://github.com/tiggerntatie/hhs-cp-site/blob/master/hhscp/static/exemplars/c02hello.py
    // example subtree: https://github.com/tiggerntatie/hhs-cp-site/tree/master/hhscp/static/exemplars
    const gittreematch = urlInput.match(/.*github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/)
    const gitfilematch = urlInput.match(/.*github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^/]+)/)
    const gittreefilematch = urlInput.match(/.*github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)\/([^/]+)/)
    const gitrepomatch = urlInput.match(/.*github\.com\/([^/]+)\/([^/]+).*/)
    const gisturlmatch = urlInput.match(/.*gist\.github\.com(\/[^/]+)?\/([0-9,a-f]+)/)
    const gistmatch = urlInput.match(/^[0-9,a-f]+$/)
    if (gisturlmatch || gistmatch) {
      const gist = gisturlmatch ? gisturlmatch[2] : gistmatch[0]
      data = {
        user: '',
        repo: '',
        branch: '',
        path: '',
        name: gist
      }
    } else if (gitrepomatch) {
      data = {
        user: gitrepomatch[1],
        repo: gitrepomatch[2],
        branch: '',
        path: '',
        name: ''
      }
      if (gittreematch) {
        data.branch = gittreematch[3]
        data.path = gittreematch[4]
      }
      if (gittreefilematch) {
        data.path = gittreefilematch[4]
        data.name = gittreefilematch[5]
      } else if (gitfilematch) {
        data.branch = gitfilematch[3]
        data.name = gitfilematch[4]
      }
    }
    return data
  }

  // parse the urlInput and return structure with user, repo, path, name
  function parseGithub (UI) {
    return parseGithubURL($(UI.URL_INPUT).val())
  }

  return {
    parse: parseGithub,
    parseurl: parseGithubURL,
    createurl: createGithubURL
  }
}())
/* END bsGithubUtil */

/*
 * bsGoogleUtil
 *
 * Google Utilities
 */
const bsGoogleUtil = (function () {
  // create a Google URL text for specific file
  function createGoogleURL (id) {
    return 'https://drive.google.com/file/d/' + id + '/view'
  }

  // parse Google URL text
  // e.g. https://drive.google.com/a/hanovernorwichschools.org/file/d/1OGC1fguuXR_-PKraS9vYbYVunVYjKNFY/view?usp=drive_web
  function parseGoogleURL (urlInput) {
    if (urlInput == null) {
      return null
    }
    // rule out an obvious github url
    if (urlInput.match(/github/)) {
      return false
    } else {
      return urlInput.match(/[-_\w]{25,}/)
    }
  }

  // parse the urlInput and return id
  function parseGoogle (UI) {
    return parseGoogleURL($(UI.URL_INPUT).val())
  }

  return {
    parse: parseGoogle,
    parseurl: parseGoogleURL,
    createurl: createGoogleURL
  }
}())
/* END bsGoogleUtil */

/*
 * bsController
 *
 * Miscellaneous actions and network transactions
 */
var bsController = (function () {
  let maincontent = ''
  let mainscript = null
  const __MAIN__ = '__main__'
  let initialized = false
  let gdriveFileidLoaded = null

  // Initialize the brython interpreter
  function initBrython () {
    if (!initialized) {
      brython(1)
      initialized = true
    }
  }

  // Execute the brython interpreter
  function runBrython (console) {
    console.clear()
    __EXECUTE__BRYTHON__()
  }

  function removeMainScript () {
    if (mainscript) {
      document.head.removeChild(mainscript)
    }
  }

  function initMainScript () {
    removeMainScript()
    mainscript = document.createElement('script')
    mainscript.type = 'text/python'
    mainscript.async = false
    mainscript.id = __MAIN__
  }

  // Set main python script as inline
  function setMainValue (txt) {
    initMainScript()
    mainscript.innerHTML = txt
    document.head.appendChild(mainscript)
  }

  // load script from github, embed in html and execute
  // data dictionary input includes user, repo, name and path (fragment)
  function runGithub (Console, UI, data) {
    initBrython()
    loadGithubtoScript(UI, data, function (result) {
      setMainValue(maincontent)
      if (mainscript) {
        UI.hideworking()
        runBrython(Console)
      }
    })
  }

  // load script from google and execute
  function runGoogle (Console, UI, fileId) {
    initBrython()
    loadGoogletoScript(UI, fileId, function () {
      setMainValue(maincontent)
      if (mainscript) {
        runBrython(Console)
      }
    })
  }

  // re-execute current mainscript
  function runCurrent (Console) {
    if (mainscript) {
      runBrython(Console)
    }
  }

  // execute contents of editor and update server with new content
  function runEditor (UI, Console) {
    setMainValue(UI.geteditor())
    runCurrent(Console)
  }

  // send request to login to github
  function loginGithub (UI) {
    $('#run_auth_request').submit()
  }

  // send request to logout of github
  // only FORGETS out github authorization - does not log out of github, per se
  function logoutGithub () {
    $('#run_auth_forget').submit()
  }

  // send request to commit/save to github
  function commitGithub (GH, UI) {
    const d = new Date()
    const ds = d.toLocaleDateString()
    const ts = d.toLocaleTimeString()
    const data = GH.parse(UI)
    data.editcontent = UI.geteditor()
    data.commitmsg = 'Updated from Brython Server: ' + ds + ' ' + ts
    UI.showworking()
    $.ajax({
      url: 'api/v1/commit',
      contentType: 'application/json; charset=UTF-8',
      dataType: 'json',
      data: JSON.stringify(data),
      type: 'PUT',
      complete: function () {
        UI.hideworking()
      },
      success: function (data) {},
      error: function (err) {
        window.alert(err.responseJSON.message)
      }
    })
  }

  // read main github script name and content
  // return file name
  function loadGithubtoScript (UI, data, callback) {
    if (data) {
      UI.showworking()
      $.ajax({
        url: 'api/v1/load',
        contentType: 'application/json; charset=UTF-8',
        dataType: 'json',
        data: JSON.stringify(data),
        type: 'PUT',
        complete: function () {
          UI.hideworking()
        },
        success: function (data) {
          maincontent = data.content
          UI.showlink(data.path)
          callback(data)
        },
        error: function (err) {
          window.alert(err.responseJSON.message)
        }

      })
    }
  }

  // Handling Google Drive and Oauth2

  // Required for Google OAuth2
  const googleScope = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.install'
  let googleApiKey
  let googleAppId

  // GAPI init with callback https://developers.google.com/identity/oauth2/web/guides/migration-to-gis#gapi-callback
  let tokenClient
  let gapiInited
  let gisInited

  function checkBeforeStart () {
    if (gapiInited && gisInited) {
      // Start only when both gapi and gis are initialized
      const UI = bsUI
      UI.hideworking()
      UI.showgoogle()
    }
  }

  function gapiInit () {
    gapi.client.init({
      // NOTE: OAuth2 'scope' and 'client_id' parameters have moved to initTokenClient().
    })
      .then(function () { // Load the API discovery document
        gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest')
        gapiInited = true
        checkBeforeStart()
      })
  }

  function gapiLoad () {
    gapi.load('client', gapiInit)
  }

  function gisInit (clientid) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientid,
      scope: googleScope,
      callback: '' // defined at request time
    })
    gisInited = true
    checkBeforeStart()
  }

  // Google OAuth2 handleClientLoad
  // also record whether exec or index
  function handleClientLoad (apikey, appid) {
    googleApiKey = apikey
    googleAppId = appid
  }

  // read script from google
  function loadGoogletoScript (UI, fileId, callback) {
    tokenClient.callback = (resp) => {
      if (resp.error !== undefined) {
        throw (resp)
      }

      const GU = bsGoogleUtil
      UI.showworking()
      const request = gapi.client.drive.files.get({
        fileId
      })
      request.then(function (response) {
        // first, get the filename
        $(UI.FILE_NAME).val(response.result.name)
        // set up for another "get" for the data
        const request = gapi.client.drive.files.get({
          fileId,
          alt: 'media'
        })
        request.then(
          function (response) {
            $(UI.URL_INPUT).val(GU.createurl(fileId))
            maincontent = response.body
            UI.showlink(GU.createurl(fileId))
            UI.seteditor(maincontent)
            UI.clearselect()
            UI.showgoogleshareurl(fileId)
            gdriveFileidLoaded = fileId
            UI.hideworking()
            callback()
          },
          function (error) {
            UI.hideworking()
            gdriveFileidLoaded = null
            window.alert('Something went wrong loading your file from Google Drive!')
            console.error(error)
          })
      },
      function (error) {
        UI.hideworking()
        gdriveFileidLoaded = null
        window.alert('Not Found')
        console.error(error)
      })
    }
    // Conditionally ask users to select the Google Account they'd like to use,
    // and explicitly obtrain their consent to open the file picker.
    // NOTE: To request an access token a user gesture is necessary.
    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for for consent to access their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' })
    }
  }

  // from https://stackoverflow.com/questions/39381563/get-file-content-of-google-docs-using-google-drive-api-v3
  function pickerLoadFile (data) {
    if (data.action === google.picker.Action.PICKED) {
      const file = data.docs[0]
      const fileId = file.id
      const fileName = file.name
      const fileUrl = file.url
      const UI = bsUI
      const request = gapi.client.drive.files.get({
        fields: ['url', 'title'],
        fileId,
        alt: 'media'
      })
      UI.showworking()
      request.then(function (response) {
        UI.seteditor(response.body)
        UI.clearselect()
        $(UI.FILE_NAME).val(fileName)
        $(UI.URL_INPUT).val(fileUrl)
        gdriveFileidLoaded = fileId
        UI.hideworking()
        UI.showgoogleshareurl(fileId)
      }, function (error) {
        UI.hideworking()
        console.error(error)
        alert(error.result.error.message)
      })
      return request
    }
  }

  // Create and render a Picker object for finding python sources.
  function loadPicker () {
    tokenClient.callback = (resp) => {
      if (resp.error !== undefined) {
        throw (resp)
      }

      const oauthToken = gapi.auth.getToken().access_token
      gapi.load('picker', {
        callback: function () {
          if (oauthToken) {
            const view = new google.picker.DocsView()
            view.setParent('root')
            view.setIncludeFolders(true)
            view.setMimeTypes('text/plain,text/x-python')
            const picker = new google.picker.PickerBuilder()
              .enableFeature(google.picker.Feature.NAV_HIDDEN)
              .enableFeature(google.picker.Feature.MULTISELECT_DISABLED)
              .setAppId(googleAppId)
              .setOAuthToken(oauthToken)
              .addView(view)
              .addView(new google.picker.DocsUploadView())
              .setDeveloperKey(googleApiKey)
              .setCallback(pickerLoadFile)
              .build()

            picker.setVisible(true)
          }
        }
      })
    }
    // Conditionally ask users to select the Google Account they'd like to use,
    // and explicitly obtrain their consent to open the file picker.
    // NOTE: To request an access token a user gesture is necessary.
    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for for consent to access their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' })
    }
  }

  // Save content to Google Drive with ID (already authenticated)
  // File ID must be in gdriveFileidLoaded
  function gdriveSaveFile () {
    const UI = bsUI
    const fileId = gdriveFileidLoaded
    const content = UI.geteditor()
    const blob = new Blob([content], {
      type: 'text/x-python;charset=utf8'
    })
    UI.showworking()
    const xhr = new XMLHttpRequest()
    xhr.responseType = 'json'
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        return
      }
      bsUI.hideworking() // why didn't it know about UI here?
      switch (xhr.status) {
        case 200:
          $(bsUI.URL_INPUT).val(bsGoogleUtil.createurl(gdriveFileidLoaded))
          break
        default:
          window.alert('Unable to save code to Google Drive.')
          break
      }
    }
    xhr.open('PATCH', 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=media')
    xhr.setRequestHeader('Authorization', 'Bearer ' + gapi.auth.getToken().access_token)
    xhr.send(blob)
  }

  // Handle the Google Drive "save" button
  function saveGoogle () {
    tokenClient.callback = (resp) => {
      if (resp.error !== undefined) {
        throw (resp)
      }
      const oauthToken = gapi.auth.getToken().access_token
      if (oauthToken) {
        if (gdriveFileidLoaded) {
          gdriveSaveFile()
        } else {
          $('#newfileModal').modal()
        }
      }
    }
    // Conditionally ask users to select the Google Account they'd like to use,
    // and explicitly obtrain their consent to open the file picker.
    // NOTE: To request an access token a user gesture is necessary.
    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for for consent to access their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: 'consent' })
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: '' })
    }
  }

  // select a newfile directory from google drive
  function directoryPicker (newfile) {
    const oauthToken = gapi.auth.getToken().access_token
    gapi.load('picker', {
      callback: function () {
        if (oauthToken) {
          const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
            .setParent('root')
            .setIncludeFolders(true)
            .setMimeTypes('application/vnd.google-apps.folder')
            .setSelectFolderEnabled(true)
          const picker = new google.picker.PickerBuilder()
            .enableFeature(google.picker.Feature.NAV_HIDDEN)
            .enableFeature(google.picker.Feature.MULTISELECT_DISABLED)
            .setAppId(googleAppId)
            .setOAuthToken(oauthToken)
            .addView(view)
            .setTitle('Select Destination Folder')
            .setDeveloperKey(googleApiKey)
            .setCallback(function (data) {
              if (data.action === google.picker.Action.PICKED) {
                const dir = data.docs[0]
                if (dir.id) {
                  saveGoogleWithName(newfile, dir.id)
                }
              }
            })
            .build()
          picker.setVisible(true)
        }
      }
    })
  }

  // function called following successful processing of new file modal
  function saveGoogleWithName (newfilename, folderid) {
    if (newfilename != null) {
      // if folderid is empty, user must pick one
      if (!folderid) {
        directoryPicker(newfilename)
      }
      const fileMetadata = {
        name: newfilename,
        mimeType: 'text/x-python',
        alt: 'media',
        parents: [folderid],
        useContentAsIndexableText: true
      }
      gapi.client.drive.files.create({
        resource: fileMetadata
      }).then(function (response) {
        switch (response.status) {
          case 200:
            $(bsUI.FILE_NAME).val(response.result.name)
            gdriveFileidLoaded = response.result.id
            gdriveSaveFile()
            break
          default:
            window.alert('Unable to create file in Google Drive')
            break
        }
      })
    }
  }

  // revoke google authorization
  function revokeAccess () {
    const GoogleAuth = gapi.auth2.getAuthInstance()
    GoogleAuth.disconnect()
    setSigninStatus()
    gdriveFileidLoaded = null
  }

  // update display according to whether user is logged in to google
  function setSigninStatus () {
    const UI = bsUI
    const GoogleAuth = gapi.auth2.getAuthInstance()
    const user = GoogleAuth.currentUser.get()
    const isAuthorized = user.hasGrantedScopes(googleScope)
    if (isAuthorized) {
      UI.showgoogle()
    } else {
      UI.hidegoogle()
    }
  }

  // examine the Url and attempt to parse as Google (1st) or Github (2nd)
  function loadCloud (GH, GU, UI) {
    const fileId = GU.parse(UI)
    if (fileId) {
      loadGoogletoScript(UI, fileId, function () {})
    } else {
      let data = GH.parse(UI)
      loadGithubtoScript(UI, data,
        function (result) {
          data = GH.parseurl(result.path)
          $(UI.URL_INPUT).val(GH.createurl(data))
          $(UI.FILE_NAME).val(data.name)
          UI.showshareurl(data)
          UI.seteditor(maincontent)
          UI.clearselect()
          UI.hideworking()
        })
    }
  }

  // log in to Google and grant basic permissions
  function loginGoogle () {
    const GoogleAuth = gapi.auth2.getAuthInstance()
    if (!GoogleAuth.isSignedIn.get()) {
      // User is not signed in. Start Google auth flow.
      GoogleAuth.signIn()
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
    googleloadclick: loadPicker,
    googlesaveclick: saveGoogle,
    googlerevoke: revokeAccess,
    googlesetstatus: setSigninStatus,
    googlelogout: revokeAccess,
    googlelogin: loginGoogle,
    googlesavename: saveGoogleWithName,
    googleapiload: gapiLoad,
    googlegisinit: gisInit,
    rungoogle: runGoogle
  }
}())
/* END bsController */
