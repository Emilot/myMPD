"use strict";
// SPDX-License-Identifier: GPL-3.0-or-later
// myMPD (c) 2018-2021 Juergen Mang <mail@jcgames.de>
// https://github.com/jcorporation/mympd

/* eslint-enable no-unused-vars */
function appPrepare(scrollPos) {
    if (app.current.app !== app.last.app || app.current.tab !== app.last.tab || app.current.view !== app.last.view) {
        //Hide all cards + nav
        for (let i = 0; i < domCache.navbarBtnsLen; i++) {
            domCache.navbarBtns[i].classList.remove('active');
        }
        const cards = ['cardHome', 'cardPlayback', 'cardSearch',
            'cardQueue', 'tabQueueCurrent', 'tabQueueLastPlayed', 'tabQueueJukebox', 
            'cardBrowse', 'tabBrowseFilesystem', 
            'tabBrowsePlaylists', 'viewBrowsePlaylistsDetail', 'viewBrowsePlaylistsList', 
            'tabBrowseDatabase', 'viewBrowseDatabaseDetail', 'viewBrowseDatabaseList'];
        for (const card of cards) {
            elHideId(card);
        }
        //show active card
        elShowId('card' + app.current.app);
        //show active tab
        if (app.current.tab !== undefined) {
            elShowId('tab' + app.current.app + app.current.tab);
        }
        //show active view
        if (app.current.view !== undefined) {
            elShowId('view' + app.current.app + app.current.tab + app.current.view);
        }
        //show active navbar icon
        let nav = document.getElementById('nav' + app.current.app + app.current.tab);
        if (nav) {
            nav.classList.add('active');
        }
        else {
            nav = document.getElementById('nav' + app.current.app);
            if (nav) {
                document.getElementById('nav' + app.current.app).classList.add('active');
            }
        }
    }
    if (isMobile === true) {
        scrollToPosY(scrollPos);
    }
    const list = document.getElementById(app.id + 'List');
    if (list) {
        list.classList.add('opacity05');
    }
}

function appGoto(card, tab, view, offset, limit, filter, sort, tag, search, newScrollPos) {
    //old app
    const oldptr = app.apps[app.current.app].offset !== undefined ? app.apps[app.current.app] :
        app.apps[app.current.app].tabs[app.current.tab].offset !== undefined ? app.apps[app.current.app].tabs[app.current.tab] :
            app.apps[app.current.app].tabs[app.current.tab].views[app.current.view];

    //get default active tab or view from state
    if (app.apps[card].tabs) {
        if (tab === undefined) {
            tab = app.apps[card].active;
        }
        if (app.apps[card].tabs[tab].views) {
            if (view === undefined) {
                view = app.apps[card].tabs[tab].active;
            }
        }
    }

    //get ptr to new app
    const ptr = app.apps[card].offset !== undefined ? app.apps[card] :
                app.apps[card].tabs[tab].offset !== undefined ? app.apps[card].tabs[tab] :
                app.apps[card].tabs[tab].views[view];
                
    //save scrollPos of old app
    if (oldptr !== ptr) {
        oldptr.scrollPos = document.body.scrollTop ? document.body.scrollTop : document.documentElement.scrollTop;
    }
    
    //set options to default, if not defined
    if (offset === null || offset === undefined) { offset = ptr.offset; }
    if (limit === null || limit === undefined)   { limit = ptr.limit; }
    if (filter === null || filter === undefined) { filter = ptr.filter; }
    if (sort === null || sort === undefined)     { sort = ptr.sort; }
    if (tag === null || tag === undefined)       { tag = ptr.tag; }
    if (search === null || search === undefined) { search = ptr.search; }
    //set new scrollpos
    if (newScrollPos !== undefined) {
        ptr.scrollPos = newScrollPos;
    }
    //build hash
    location.hash = '/' + myEncodeURIComponent(card) + 
        (tab === undefined ? '' : '/' + myEncodeURIComponent(tab) + 
        (view === undefined ? '' : '/' + myEncodeURIComponent(view))) + '!' + 
        myEncodeURIComponent(offset) + '/' + myEncodeURIComponent(limit) + '/' + 
        myEncodeURIComponent(filter) + '/' + myEncodeURIComponent(sort) + '/' + 
        myEncodeURIComponent(tag) + '/' + myEncodeURIComponent(search);
}

function appRoute() {
    //called on hash change
    if (settingsParsed === false) {
        appInitStart();
        return;
    }
    const params = location.hash.match(/^#\/(\w+)\/?(\w+)?\/?(\w+)?!(\d+)\/(\d+)\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/);
    if (params) {
        app.current.app = myDecodeURIComponent(params[1]);
        app.current.tab = params[2] !== undefined ? myDecodeURIComponent(params[2]) : undefined;
        app.current.view = params[3] !== undefined ? myDecodeURIComponent(params[3]) : undefined;
        app.current.offset = Number(myDecodeURIComponent(params[4]));
        app.current.limit = Number(myDecodeURIComponent(params[5]));
        app.current.filter = myDecodeURIComponent(params[6]);
        app.current.sort = myDecodeURIComponent(params[7]);
        app.current.tag = myDecodeURIComponent(params[8]);
        app.current.search = myDecodeURIComponent(params[9]);

        app.id = app.current.app + (app.current.tab === undefined ? '' : app.current.tab) + (app.current.view === undefined ? '' : app.current.view);

        //get ptr to app options and set active tab/view        
        let ptr;
        if (app.apps[app.current.app].offset !== undefined) {
            ptr = app.apps[app.current.app];
        }
        else if (app.apps[app.current.app].tabs[app.current.tab].offset !== undefined) {
            ptr = app.apps[app.current.app].tabs[app.current.tab];
            app.apps[app.current.app].active = app.current.tab;
        }
        else if (app.apps[app.current.app].tabs[app.current.tab].views[app.current.view].offset !== undefined) {
            ptr = app.apps[app.current.app].tabs[app.current.tab].views[app.current.view];
            app.apps[app.current.app].active = app.current.tab;
            app.apps[app.current.app].tabs[app.current.tab].active = app.current.view;
        }
        //set app options
        ptr.offset = app.current.offset;
        ptr.limit = app.current.limit;
        ptr.filter = app.current.filter;
        ptr.sort = app.current.sort;
        ptr.tag = app.current.tag;
        ptr.search = app.current.search;
        app.current.scrollPos = ptr.scrollPos;
    }
    else {
        appPrepare(0);
        if (features.featHome === true) {
            appGoto('Home');
        }
        else {
            appGoto('Playback');
        }
        return;
    }
    appPrepare(app.current.scrollPos);

    if (app.current.app === 'Home') {
        const list = document.getElementById('HomeList');
        list.classList.remove('opacity05');
        setScrollViewHeight(list);
        sendAPI("MYMPD_API_HOME_LIST", {}, parseHome);
    }
    else if (app.current.app === 'Playback') {
        const list = document.getElementById('PlaybackList');
        list.classList.remove('opacity05');
        setScrollViewHeight(list);
        sendAPI("MYMPD_API_PLAYER_CURRENT_SONG", {}, songChange);
    }    
    else if (app.current.app === 'Queue' && app.current.tab === 'Current' ) {
        selectTag('searchqueuetags', 'searchqueuetagsdesc', app.current.filter);
        getQueue();
    }
    else if (app.current.app === 'Queue' && app.current.tab === 'LastPlayed') {
        sendAPI("MYMPD_API_QUEUE_LAST_PLAYED", {
            "offset": app.current.offset,
            "limit": app.current.limit,
            "cols": settings.colsQueueLastPlayedFetch,
            "searchstr": app.current.search
        }, parseLastPlayed, true);
        const searchQueueLastPlayedStrEl = document.getElementById('searchQueueLastPlayedStr');
        if (searchQueueLastPlayedStrEl.value === '' && app.current.search !== '') {
            searchQueueLastPlayedStrEl.value = app.current.search;
        }
    }
    else if (app.current.app === 'Queue' && app.current.tab === 'Jukebox') {
        sendAPI("MYMPD_API_JUKEBOX_LIST", {
            "offset": app.current.offset,
            "limit": app.current.limit,
            "cols": settings.colsQueueJukeboxFetch,
            "searchstr": app.current.search
        }, parseJukeboxList, true);
        const searchQueueJukeboxStrEl = document.getElementById('searchQueueJukeboxStr');
        if (searchQueueJukeboxStrEl.value === '' && app.current.search !== '') {
            searchQueueJukeboxStrEl.value = app.current.search;
        }
    }
    else if (app.current.app === 'Browse' && app.current.tab === 'Playlists' && app.current.view === 'List') {
        sendAPI("MYMPD_API_PLAYLIST_LIST", {
            "offset": app.current.offset,
            "limit": app.current.limit,
            "searchstr": app.current.search,
            "type": 0
        }, parsePlaylistsList, true);
        const searchPlaylistsStrEl = document.getElementById('searchPlaylistsListStr');
        if (searchPlaylistsStrEl.value === '' && app.current.search !== '') {
            searchPlaylistsStrEl.value = app.current.search;
        }
    }
    else if (app.current.app === 'Browse' && app.current.tab === 'Playlists' && app.current.view === 'Detail') {
        sendAPI("MYMPD_API_PLAYLIST_CONTENT_LIST", {
            "offset": app.current.offset,
            "limit": app.current.limit,
            "searchstr": app.current.search,
            "plist": app.current.filter,
            "cols": settings.colsBrowsePlaylistsDetail
        }, parsePlaylistsDetail, true);
        const searchPlaylistsStrEl = document.getElementById('searchPlaylistsDetailStr');
        if (searchPlaylistsStrEl.value === '' && app.current.search !== '') {
            searchPlaylistsStrEl.value = app.current.search;
        }
    }    
    else if (app.current.app === 'Browse' && app.current.tab === 'Filesystem') {
        sendAPI("MYMPD_API_DATABASE_FILESYSTEM_LIST", {
            "offset": app.current.offset,
            "limit": app.current.limit,
            "path": (app.current.search ? app.current.search : "/"), 
            "searchstr": (app.current.filter !== '-' ? app.current.filter : ''),
            "cols": settings.colsBrowseFilesystemFetch
        }, parseFilesystem, true);
        //Don't add all songs from root
        if (app.current.search) {
            elEnableId('BrowseFilesystemAddAllSongs');
            elEnableId('BrowseFilesystemAddAllSongsBtn');
        }
        else {
            elDisableId('BrowseFilesystemAddAllSongs');
            elDisableId('BrowseFilesystemAddAllSongsBtn');
        }
        //Create breadcrumb
        const crumbEl = document.getElementById('BrowseBreadcrumb');
        elClear(crumbEl);
        const home = elCreateText('a', {"class": ["mi"]}, 'home');
        setData(home, 'data-uri', '');
        crumbEl.appendChild(elCreateNode('li', {"class": ["breadcrumb-item"]}, home));

        const pathArray = app.current.search.split('/');
        const pathArrayLen = pathArray.length;
        let fullPath = '';
        for (let i = 0; i < pathArrayLen; i++) {
            if (pathArrayLen - 1 === i) {
                crumbEl.appendChild(elCreateText('li', {"class": ["breadcrumb-item", "active"]}, pathArray[i]));
                break;
            }
            fullPath += pathArray[i];
            const a = elCreateText('a', {"href": "#"}, pathArray[i]);
            setData(a, 'data-uri', fullPath);
            crumbEl.appendChild(elCreateNode('li', {"class": ["breadcrumb-item"]}, a));
            fullPath += '/';
        }
        const searchFilesystemStrEl = document.getElementById('searchFilesystemStr');
        searchFilesystemStrEl.value = app.current.filter === '-' ? '' :  app.current.filter;
    }
    else if (app.current.app === 'Browse' && app.current.tab === 'Database' && app.current.view === 'List') {
        selectTag('searchDatabaseTags', 'searchDatabaseTagsDesc', app.current.filter);
        selectTag('BrowseDatabaseByTagDropdown', 'btnBrowseDatabaseByTagDesc', app.current.tag);
        let sort = app.current.sort;
        let sortdesc = false;
        if (app.current.sort.charAt(0) === '-') {
            sortdesc = true;
            sort = app.current.sort.substr(1);
            toggleBtnChkId('databaseSortDesc', true);
        }
        else {
            toggleBtnChkId('databaseSortDesc', false);
        }
        selectTag('databaseSortTags', undefined, sort);
        if (app.current.tag === 'Album') {
            createSearchCrumbs(app.current.search, document.getElementById('searchDatabaseStr'), document.getElementById('searchDatabaseCrumb'));
            if (app.current.search === '') {
                document.getElementById('searchDatabaseStr').value = '';
            }
            elShowId('searchDatabaseMatch');
            elEnableId('btnDatabaseSortDropdown');
            elEnableId('btnDatabaseSearchDropdown');
            sendAPI("MYMPD_API_DATABASE_ALBUMS_GET", {
                "offset": app.current.offset,
                "limit": app.current.limit,
                "expression": app.current.search, 
                "sort": sort,
                "sortdesc": sortdesc
            }, parseDatabase, true);
        }
        else {
            elHideId('searchDatabaseCrumb');
            elHideId('searchDatabaseMatch');
            elDisableId('btnDatabaseSortDropdown');
            elDisableId('btnDatabaseSearchDropdown');
            document.getElementById('searchDatabaseStr').value = app.current.search;
            sendAPI("MYMPD_API_DATABASE_TAG_LIST", {
                "offset": app.current.offset,
                "limit": app.current.limit,
                "searchstr": app.current.search, 
                "tag": app.current.tag
            }, parseDatabase, true);
        }
    }
    else if (app.current.app === 'Browse' && app.current.tab === 'Database' && app.current.view === 'Detail') {
        if (app.current.filter === 'Album') {
            sendAPI("MYMPD_API_DATABASE_TAG_ALBUM_TITLE_LIST", {
                "album": app.current.tag,
                "albumartist": app.current.search,
                "cols": settings.colsBrowseDatabaseDetailFetch
            }, parseAlbumDetails, true);
        }    
    }
    else if (app.current.app === 'Search') {
        document.getElementById('searchstr').focus();
        if (features.featAdvsearch) {
            createSearchCrumbs(app.current.search, document.getElementById('searchstr'), document.getElementById('searchCrumb'));
        }
        else if (document.getElementById('searchstr').value === '' && app.current.search !== '') {
            document.getElementById('searchstr').value = app.current.search;
        }
        if (app.current.search === '') {
            document.getElementById('searchstr').value = '';
        }
        if (document.getElementById('searchstr').value.length >= 2 || document.getElementById('searchCrumb').children.length > 0) {
            if (features.featAdvsearch) {
                let sort = app.current.sort;
                let sortdesc = false;
                if (sort === '-') {
                    sort = settings.tagList.includes('Title') ? 'Title' : '-';
                    setDataId('SearchList', 'data-sort', sort);
                }
                else if (sort.indexOf('-') === 0) {
                    sortdesc = true;
                    sort = sort.substring(1);
                }
                sendAPI("MYMPD_API_DATABASE_SEARCH_ADV", {
                    "plist": "",
                    "offset": app.current.offset,
                    "limit": app.current.limit,
                    "sort": sort,
                    "sortdesc": sortdesc,
                    "expression": app.current.search,
                    "cols": settings.colsSearchFetch,
                    "replace": false
                }, parseSearch, true);
            }
            else {
                sendAPI("MYMPD_API_DATABASE_SEARCH", {
                    "plist": "",
                    "offset": app.current.offset,
                    "limit": app.current.limit,
                    "filter": app.current.filter,
                    "searchstr": app.current.search,
                    "cols": settings.colsSearchFetch,
                    "replace": false
                }, parseSearch, true);
            }
        }
        else {
            elClear(document.getElementById('SearchList').getElementsByTagName('tbody')[0]);
            elDisableId('searchAddAllSongs');
            elDisableId('searchAddAllSongsBtn');
            document.getElementById('SearchList').classList.remove('opacity05');
            setPagination(0, 0);
        }
        selectTag('searchtags', 'searchtagsdesc', app.current.filter);
    }
    else {
        appGoto("Home");
    }

    app.last.app = app.current.app;
    app.last.tab = app.current.tab;
    app.last.view = app.current.view;
}

function showAppInitAlert(text) {
    const spa = document.getElementById('splashScreenAlert');
    elClear(spa);
    spa.appendChild(elCreateText('p', {"class": ["text-danger"]}, tn(text)));
    const btn = elCreateText('button', {"class": ["btn", "btn-danger"]}, tn('Reload'));
    btn.addEventListener('click', function() {
        clearAndReload();
    }, false);
    spa.appendChild(elCreateNode('p', {}, btn));    
}

function clearAndReload() {
    if ('serviceWorker' in navigator) {
        caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
            });
        });
    }
    location.reload();
}

function a2hsInit() {
    window.addEventListener('beforeinstallprompt', function(event) {
        logDebug('Event: beforeinstallprompt');
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        event.preventDefault();
        // Stash the event so it can be triggered later
        deferredA2HSprompt = event;
        // Update UI notify the user they can add to home screen
        elShowId('nav-add2homescreen');
    });

    document.getElementById('nav-add2homescreen').addEventListener('click', function(event) {
        // Hide our user interface that shows our A2HS button
        elHide(event.target);
        // Show the prompt
        deferredA2HSprompt.prompt();
        // Wait for the user to respond to the prompt
        deferredA2HSprompt.userChoice.then((choiceResult) => {
            logDebug(choiceResult.outcome === 'accepted' ? 'User accepted the A2HS prompt' : 'User dismissed the A2HS prompt');
            deferredA2HSprompt = null;
        });
    });
    
    window.addEventListener('appinstalled', function() {
        showNotification(tn('myMPD installed as app'), '', 'general', 'info');
    });
}

function appInitStart() {
    //webapp manifest shortcuts
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action === 'clickPlay') {
        clickPlay();
    }
    else if (action === 'clickStop') {
        clickStop();
    }
    else if (action === 'clickNext') {
        clickNext();
    }

    //add app routing event handler
    window.addEventListener('hashchange', appRoute, false);

    //update table height on window resize
    window.addEventListener('resize', function() {
        const list = document.getElementById(app.id + 'List');
        if (list) {
            setScrollViewHeight(list);
        }
    }, false);

    //set initial scale
    if (isMobile === true) {
        scale = localStorage.getItem('scale-ratio');
        if (scale === null) {
            scale = '1.0';
        }
        setViewport(false);
        domCache.body.classList.add('mobile');
    }
    else {
        const ms = document.getElementsByClassName('featMobile');
        for (const m of ms) {
            elHide(m);
        }
        domCache.body.classList.add('not-mobile');
    }

    subdir = window.location.pathname.replace('/index.html', '').replace(/\/$/, '');
    i18nHtml(document.getElementById('splashScreenAlert'));
    
    //set loglevel
    const script = document.getElementsByTagName("script")[0].src.replace(/^.*[/]/, '');
    if (script !== 'combined.js') {
        settings.loglevel = 4;
    }
    //register serviceworker
    if ('serviceWorker' in navigator &&
        window.location.protocol === 'https:' && 
        script === 'combined.js')
    {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js', {scope: '/'}).then(function(registration) {
                //Registration was successful
                logInfo('ServiceWorker registration successful.');
                registration.update();
            }, function(err) {
                //Registration failed
                logError('ServiceWorker registration failed: ' + err);
            });
        });
    }

    //show splash screen
    elShowId('splashScreen');
    domCache.body.classList.add('overflow-hidden');
    document.getElementById('splashScreenAlert').textContent = tn('Fetch myMPD settings');
    
    //init add to home screen feature
    a2hsInit();

    //initialize app
    appInited = false;
    settingsParsed = 'no';
    sendAPI("MYMPD_API_SETTINGS_GET", {}, function(obj) {
        parseSettings(obj, true);
        if (settingsParsed === 'parsed') {
            //connect to websocket in background
            setTimeout(function() {
                webSocketConnect();
            }, 0);
            //app initialized
            document.getElementById('splashScreenAlert').textContent = tn('Applying settings');
            document.getElementById('splashScreen').classList.add('hide-fade');
            setTimeout(function() {
                elHideId('splashScreen');
                document.getElementById('splashScreen').classList.remove('hide-fade');
                domCache.body.classList.remove('overflow-hidden');
            }, 500);
            appInit();
            appInited = true;
            appRoute();
            logDebug('Startup duration: ' + (Date.now() - startTime) + 'ms');
        }
    }, true);
}

function appInit() {
    //collaps arrows for submenus
    const collapseArrows = document.querySelectorAll('.subMenu');
    for (const collapseArrow of collapseArrows) {
        collapseArrow.addEventListener('click', function(event) {
            event.stopPropagation();
            event.preventDefault();
            toggleCollapseArrow(this);
        }, false);
    }    
    //align dropdowns
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    for (const dropdown of dropdowns) {
        dropdown.parentNode.addEventListener('show.bs.dropdown', function () {
            alignDropdown(this);
        });
    }
    //init links
    const hrefs = document.querySelectorAll('[data-href]');
    for (const href of hrefs) {
        if (href.classList.contains('notclickable') === false) {
            href.classList.add('clickable');
        }
        let parentInit = href.parentNode.classList.contains('noInitChilds') ? true : false;
        if (parentInit === false) {
            parentInit = href.parentNode.parentNode.classList.contains('noInitChilds') ? true : false;
        }
        if (parentInit === true) {
            //handler on parentnode
            continue;
        }
        href.addEventListener('click', function(event) {
            parseCmd(event, getData(this, 'data-href'));
        }, false);
    }
    //hide popover
    domCache.body.addEventListener('click', function() {
        hidePopover();
    }, false);
    //init moduls
    initGlobalModals();
    initSong();
    initHome();
    initBrowse();
    initQueue();
    initJukebox();
    initSearch();
    initScripts();
    initTrigger();
    initTimer();
    initPartitions();
    initMounts();
    initLocalplayer();
    initSettings();
    initPlayback();
    initNavs();
    initPlaylists();
    initOutputs();
    //init drag and drop
    dragAndDropTable('QueueCurrentList');
    dragAndDropTable('BrowsePlaylistsDetailList');
    dragAndDropTableHeader('QueueCurrent');
    dragAndDropTableHeader('QueueLastPlayed');
    dragAndDropTableHeader('QueueJukebox');
    dragAndDropTableHeader('Search');
    dragAndDropTableHeader('BrowseFilesystem');
    dragAndDropTableHeader('BrowsePlaylistsDetail');
    dragAndDropTableHeader('BrowseDatabaseDetail');
  
    //update state on window focus - browser pauses javascript
    window.addEventListener('focus', function() {
        logDebug('Browser tab gots the focus -> update player state');
        sendAPI("MYMPD_API_PLAYER_STATE", {}, parseState);
    }, false);
    //global keymap
    document.addEventListener('keydown', function(event) {
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT' ||
            event.target.tagName === 'TEXTAREA' || event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        const cmd = keymap[event.key];
        if (cmd && typeof window[cmd.cmd] === 'function') {
            if (keymap[event.key].req === undefined || settings[keymap[event.key].req] === true) {
                parseCmd(event, cmd);
            }
            event.stopPropagation();
        }        
        
    }, false);
    //contextmenu for tables
    const tables = ['BrowseFilesystemList', 'BrowseDatabaseDetailList', 'QueueCurrentList', 'QueueLastPlayedList', 
        'QueueJukeboxList', 'SearchList', 'BrowsePlaylistsListList', 'BrowsePlaylistsDetailList'];
    for (const tableName of tables) {
        document.getElementById(tableName).getElementsByTagName('tbody')[0].addEventListener('long-press', function(event) {
            if (event.target.parentNode.classList.contains('not-clickable') ||
                event.target.parentNode.parentNode.classList.contains('not-clickable') ||
                getData(event.target.parentNode, 'data-type') === 'parentDir')
            {
                return;
            }
            showPopover(event);
            event.preventDefault();
            event.stopPropagation();
        }, false);
    
        document.getElementById(tableName).getElementsByTagName('tbody')[0].addEventListener('contextmenu', function(event) {
            if (event.target.parentNode.classList.contains('not-clickable') ||
                event.target.parentNode.parentNode.classList.contains('not-clickable') ||
                getData(event.target.parentNode, 'data-type') === 'parentDir')
            {
                return;
            }
            showPopover(event);
            event.preventDefault();
            event.stopPropagation();
        }, false);
    }

    //websocket
    window.addEventListener('beforeunload', function() {
        webSocketClose();
    });
}

function initGlobalModals() {
    const tab = document.getElementById('tabShortcuts');
    elClear(tab);
    const keys = Object.keys(keymap).sort((a, b) => { 
        return keymap[a].order - keymap[b].order
    });
    for (const key of keys) {
        if (keymap[key].cmd === undefined) {
            tab.appendChild(
                elCreateNode('div', {"class": ["row", "mb-2", "mt-3"]}, 
                    elCreateNode('div', {"class": ["col-12"]}, 
                        elCreateText('h5', {}, tn(keymap[key].desc))
                    )
                )
            );
            tab.appendChild(elCreateEmpty('div', {"class": ["row"]}));
            continue;
        }
        const col = elCreateEmpty('div', {"class": ["col", "col-6", "mb-3", "align-items-center"]});
        const k = elCreateText('div', {"class": ["key", "float-start"]}, (keymap[key].key !== undefined ? keymap[key].key : key));
        if (keymap[key].key && keymap[key].key.length > 1) {
            k.classList.add('mi', 'mi-small');
        }
        col.appendChild(k);
        col.appendChild(elCreateText('div', {}, tn(keymap[key].desc)));
        tab.lastChild.appendChild(col);
    }    

    document.getElementById('modalAbout').addEventListener('shown.bs.modal', function () {
        sendAPI("MYMPD_API_DATABASE_STATS", {}, parseStats);
        getServerinfo();
    }, false);
    
    document.getElementById('modalUpdateDB').addEventListener('hidden.bs.modal', function() {
        document.getElementById('updateDBprogress').classList.remove('updateDBprogressAnimate');
    }, false);

    document.getElementById('modalEnterPin').addEventListener('shown.bs.modal', function() {
        document.getElementById('inputPinModal').focus();
    }, false);
    
    document.getElementById('inputPinModal').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            document.getElementById('modalEnterPinEnterBtn').click();        
        }
    }, false);
}

function initPlayback() {
    document.getElementById('PlaybackColsDropdown').addEventListener('click', function(event) {
        if (event.target.nodeName === 'BUTTON' && event.target.classList.contains('mi')) {
            event.stopPropagation();
            event.preventDefault();
            toggleBtnChk(event.target);
        }
    }, false);

    document.getElementById('cardPlaybackTags').addEventListener('click', function(event) {
        if (event.target.nodeName === 'P') {
            gotoBrowse(event);
        }
    }, false); 
}

function initNavs() {
    document.getElementById('volumeBar').addEventListener('change', function() {
        sendAPI("MYMPD_API_PLAYER_VOLUME_SET", {"volume": Number(document.getElementById('volumeBar').value)});
    }, false);

    domCache.progress.addEventListener('click', function(event) {
        if (currentSong && currentSong.currentSongId >= 0 && currentSong.totalTime > 0) {
            const seekVal = Math.ceil((currentSong.totalTime * event.clientX) / domCache.progress.offsetWidth);
            sendAPI("MYMPD_API_PLAYER_SEEK_CURRENT", {"seek": seekVal, "relative": false});
            domCache.progressBar.style.transition = 'none';
            domCache.progressBar.offsetHeight;
            domCache.progressBar.style.width = event.clientX + 'px';
            setTimeout(function() {
                domCache.progressBar.style.transition = progressBarTransition;
                domCache.progressBar.offsetHeight;
            }, 1000);
        }
    }, false);

    domCache.progress.addEventListener('mousemove', function(event) {
        if ((playstate === 'pause' || playstate === 'play') && currentSong.totalTime > 0) {
            domCache.progressPos.textContent = beautifySongDuration(Math.ceil((currentSong.totalTime / event.target.offsetWidth) * event.clientX));
            domCache.progressPos.style.display = 'block';
            const w = domCache.progressPos.offsetWidth / 2;
            const posX = event.clientX < w ? event.clientX : (event.clientX < window.innerWidth - w ? event.clientX - w : event.clientX - (w * 2));
            domCache.progressPos.style.left = posX + 'px';
        }
    }, false);

    domCache.progress.addEventListener('mouseout', function() {
        domCache.progressPos.style.display = 'none';
    }, false);

    domCache.progressBar.style.transition = progressBarTransition;

    document.getElementById('navbar-main').addEventListener('click', function(event) {
        event.preventDefault();
        if (event.target.nodeName === 'DIV') {
            return;
        }
        const target = event.target.nodeName === 'A' ? event.target : event.target.parentNode;
        const href = getData(target, 'data-href');
        parseCmd(event, href);
    }, false);
    
    document.getElementById('scripts').addEventListener('click', function(event) {
        event.preventDefault();
        if (event.target.nodeName === 'A') {
            execScript(getData(event.target, 'data-href'));
        }
    }, false);
}

//Handle javascript errors
window.onerror = function(msg, url, line) {
    logError('JavaScript error: ' + msg + ' (' + url + ': ' + line + ')');
    if (settings.loglevel >= 4) {
        if (appInited === true) {
            showNotification(tn('JavaScript error'), msg + ' (' + url + ': ' + line + ')', 'general', 'error');
        }
        else {
            showAppInitAlert(tn('JavaScript error') + ': ' + msg + ' (' + url + ': ' + line + ')');
        }
    }
    return true;
};

//Start app
appInitStart();
