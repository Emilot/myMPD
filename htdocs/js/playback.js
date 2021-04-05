"use strict";

function setGridPlayback() {
    const list = ['col-md-6', 'd-none', 'd-md-block'];
    if (app.current.app === 'Playback') {
        document.getElementById('row1').classList.add('row');
        document.getElementById('col1').classList.add('col-md-6');
        document.getElementById('col2').classList.add(...list);
        document.getElementById('cardQueueMini').classList.remove('hide');
        document.getElementById('cardBrowse').classList.remove('hide');
        document.getElementById('tabBrowseDatabase').classList.remove('hide');
        if (app.current.view !== undefined) {
            document.getElementById('viewBrowseDatabase' + app.current.view).classList.remove('hide');
        }
        document.getElementById('searchDatabaseTagsDesc').classList.add('hide');
        calcBoxHeight();
    }
    else {
        document.getElementById('row1').classList.remove('row');
        document.getElementById('col1').classList.remove('col-md-6');
        document.getElementById('col2').classList.remove(...list);
        document.getElementById('cardQueueMini').classList.add('hide');
        document.getElementById('searchDatabaseTagsDesc').classList.remove('hide');
        document.getElementById('viewListDatabaseBox').style.height = '';
        document.getElementById('viewDetailDatabaseBox').style.height = '';
    }
}

// Sync playback and browse cards
function setAppState(offset, limit, filter, sort, tag, search) {
    const card = app.current.app === 'Browse' ? 'Playback' : 'Browse';
    const state = { "offset": offset, "limit": limit, "filter": filter, "sort": sort, "tag": tag, "search": search };
    state.scrollPos = app.apps[card].tabs.Database.views[app.current.view].scrollPos;
    app.apps[card].tabs.Database.active = app.current.view;
    app.apps[card].tabs.Database.views[app.current.view] = state;
}

function playbackRoute() {
    if (app.current.app === 'Playback' && app.last.app !== 'Playback') {
        sendAPI("MPD_API_PLAYER_CURRENT_SONG", {}, songChange);
    }
}

function getQueueMini(pos) {
    const colsQueueMini = ["Pos", "Title", "Artist", "Album", "Duration"];
    // list
    if (pos !== undefined && pos !== -1) {
        sendAPI("MPD_API_QUEUE_MINI", { "pos": pos, "cols": colsQueueMini }, parseQueueMini);
    }
    else if (pos === undefined) {
        const table = document.getElementById('QueueMiniList');
        const tbody = table.getElementsByTagName('tbody')[0];
        for (let i = tbody.rows.length - 1; i >= 0; i--) {
            tbody.deleteRow(i);
        }
        table.classList.add('opacity05');
    }
    // footer
    sendAPI("MPD_API_QUEUE_LIST", {"offset": app.apps.Queue.tabs.Current.offset, "limit": app.apps.Queue.tabs.Current.limit, "cols": settings.colsQueueCurrent}, parseQueueList, false);
}

function parseQueueMini(obj) {
    const colsQueueMini = ["Pos", "Title", "Artist", "Album", "Duration"];
    const nrItems = obj.result.returnedEntities;
    const table = document.getElementById('QueueMiniList');
    let activeRow = 0;
    table.setAttribute('data-version', obj.result.queueVersion);
    const tbody = table.getElementsByTagName('tbody')[0];
    const tr = tbody.getElementsByTagName('tr');
    for (let i = 0; i < nrItems; i++) {
        obj.result.data[i].Duration = beautifySongDuration(obj.result.data[i].Duration);
        obj.result.data[i].Pos++;
        const row = document.createElement('tr');
        row.setAttribute('data-trackid', obj.result.data[i].id);
        row.setAttribute('id', 'queueMiniTrackId' + obj.result.data[i].id);
        row.setAttribute('data-songpos', obj.result.data[i].Pos);
        row.setAttribute('data-duration', obj.result.data[i].Duration);
        row.setAttribute('data-uri', obj.result.data[i].uri);
        row.setAttribute('tabindex', 0);
        let tds = '';
        for (let c = 0; c < colsQueueMini.length; c++) {
            tds += '<td data-col="' + colsQueueMini[c] + '">' + e(obj.result.data[i][colsQueueMini[c]]) + '</td>';
        }
        row.innerHTML = tds;
        if (i < tr.length) {
            activeRow = replaceTblRow(tr[i], row) === true ? i : activeRow;
        }
        else {
            tbody.append(row);
        }
    }
    const trLen = tr.length - 1;
    for (let i = trLen; i >= nrItems; i--) {
        tr[i].remove();
    }

    table.classList.remove('opacity05');
}

function parseQueueList(obj) {
    if (obj.result.totalTime && obj.result.totalTime > 0 && obj.result.totalEntities <= settings.maxElementsPerPage) {
        document.getElementById('cardFooterQueueMini').innerText = t('Num songs', obj.result.totalEntities) + ' – ' + beautifyDuration(obj.result.totalTime);
    }
    else if (obj.result.totalEntities > 0) {
        document.getElementById('cardFooterQueueMini').innerText = t('Num songs', obj.result.totalEntities);
    }
    else {
        document.getElementById('cardFooterQueueMini').innerText = '';
    }
}

function calcBoxHeight() {
    if (app.current.app === 'Playback') {
        const oh1 = document.getElementById('cardPlayback').offsetHeight;
        const oh2 = document.getElementById('cardQueueMini').offsetHeight;
        const oh3 = document.getElementById('BrowseDatabaseButtons').offsetHeight;
        const oh4 = document.getElementById('searchDatabaseCrumb').offsetHeight;
        const oh5 = document.getElementById('PlaybackButtonsTop').offsetHeight;
        document.getElementById('viewListDatabaseBox').style.height = oh1 + oh2 - oh3 - oh4 + 'px';
        document.getElementById('viewDetailDatabaseBox').style.height = oh1 + oh2 - oh5 + 'px';
    }
}
