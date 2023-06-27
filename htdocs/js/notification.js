"use strict";
// SPDX-License-Identifier: GPL-3.0-or-later
// myMPD (c) 2018-2023 Juergen Mang <mail@jcgames.de>
// https://github.com/jcorporation/mympd

/** @module notifications_js */

/**
 * Initializes the notification html elements
 * @returns {void}
 */
function initNotifications() {
    document.getElementById('modalNotifications').addEventListener('show.bs.modal', function() {
        showMessages();
    });
}

/**
 * Sets the background color of the myMPD logo according to the websocket state
 * @returns {void}
 */
function setStateIcon() {
    const fgColor = uiEnabled === true
        ? settings.partition.highlightColorContrast
        : '#f8f9fa;';
    const bgColor = uiEnabled === true
        ? settings.partition.highlightColor
        : '#6c757d';

    const logoFgs = document.querySelectorAll('.logoFg');
    for (const logoFg of logoFgs) {
        logoFg.setAttribute('fill', fgColor);
    }
    const logoBgs = document.querySelectorAll('.logoBg');
    for (const logoBg of logoBgs) {
        logoBg.setAttribute('fill', bgColor);
    }
}

/**
 * Toggles and sets/clears the message of the top alertBox
 * @param {string} alertBoxId the id of alertBox to toggle
 * @param {boolean} state false = hides the alertBox, true = shows the alertBox
 * @param {string} msg already translated message
 * @returns {void}
 */
function toggleAlert(alertBoxId, state, msg) {
    //get existing alert
    const topAlert = document.querySelector('#top-alerts');
    let alertBoxEl = topAlert.querySelector('#' + alertBoxId);
    if (state === false) {
        //remove alert
        if (alertBoxEl !== null) {
            alertBoxEl.remove();
        }
    }
    else if (alertBoxEl === null) {
        //create new alert
        alertBoxEl = elCreateNode('div', {"id": alertBoxId, "class": ["alert", "top-alert", "d-flex", "flex-row"]},
            elCreateText('span', {}, msg)
        );
        switch(alertBoxId) {
            case 'alertMpdStatusError': {
                alertBoxEl.classList.add('alert-danger', 'top-alert-dismissible');
                const clBtn = elCreateEmpty('button', {"class": ["btn-close"]});
                alertBoxEl.appendChild(clBtn);
                clBtn.addEventListener('click', function() {
                    clearMPDerror();
                }, false);
                break;
            }
            case 'alertUpdateDBState':
            case 'alertUpdateCacheState': {
                alertBoxEl.classList.add('alert-success');
                break;
            }
            default:
                alertBoxEl.classList.add('alert-danger');
        }
        topAlert.appendChild(alertBoxEl);
    }
    else {
        //replace the message
        alertBoxEl.firstElementChild.textContent = msg;
    }

    //check if we should show the alert container
    if (topAlert.childElementCount > 0) {
        elShow(topAlert);
        domCache.main.style.marginTop = topAlert.offsetHeight + 'px';
    }
    else {
        domCache.main.style.marginTop = '0';
        elHide(topAlert);
    }
}

/**
 * Notification severities
 * @type {object}
 */
const severities = {
    "info": {
        "text": "Info",
        "icon": "info",
        "class": "text-success"
    },
    "warn": {
        "text": "Warning",
        "icon": "warning",
        "class": "text-warning"
    },
    "error": {
        "text": "Error",
        "icon": "error",
        "class": "text-danger"
    }
};

/**
 * Notification facilities
 * @type {object}
 */
const facilities = {
    "database": "Database",
    "general":  "General",
    "home":     "Home",
    "jukebox":  "Jukebox",
    "lyrics":   "Lyrics",
    "mpd":      "MPD",
    "playlist": "Playlist",
    "player":   "Player",
    "queue":    "Queue",
    "session":  "Session",
    "script":   "Script",
    "sticker":  "Sticker",
    "timer":    "Timer",
    "trigger":  "Trigger"
};

/**
 * Creates a severity icon
 * @param {string} severity severity
 * @returns {HTMLElement} severity icon
 */
function createSeverityIcon(severity) {
    return elCreateText('span', {"data-title-phrase": severities[severity].text,
        "class": ["mi", severities[severity].class, "me-2"]}, severities[severity].icon);
}

/**
 * Shows a toast notification or an appinit alert
 * @param {string} message message
 * @param {string} facility facility
 * @param {string} severity one off info, warn, error
 * @returns {void}
 */
function showNotification(message, facility, severity) {
    if (appInited === false) {
        showAppInitAlert(message);
        return;
    }
    logMessage(message, facility, severity);
    if (severity === 'info') {
        //notifications with severity info can be hidden
        if (settings.webuiSettings.notifyPage === false &&
            settings.webuiSettings.notifyWeb === false)
        {
            return;
        }
        //disabled notification for facility in advanced setting
        let show = settings.webuiSettings['notification' + facilities[facility]];
        if (show === null ) {
            logDebug('Unknown facility: ' + facility);
            //fallback to general
            show = settings.webuiSettings['notificationGeneral'];
        }
        if (show === false) {
            return;
        }
    }

    if (settings.webuiSettings.notifyWeb === true) {
        const notification = new Notification(message, {icon: 'assets/favicon.ico'});
        setTimeout(notification.close.bind(notification), 3000);
    }
    if (settings.webuiSettings.notifyPage === true) {
        const toast = elCreateNodes('div', {"class": ["toast", "mt-2"]}, [
            elCreateNodes('div', {"class": ["toast-header"]}, [
                createSeverityIcon(severity),
                elCreateText('span', {"class": ["me-auto"]}, message),
                elCreateEmpty('button', {"type": "button", "class": ["btn-close"], "data-bs-dismiss": "toast"}),
            ])
        ]);
        document.getElementById('alertBox').prepend(toast);
        const toastInit = new BSN.Toast(toast, {delay: 2500});
        toast.addEventListener('hidden.bs.toast', function() {
            this.remove();
        }, false);
        toastInit.show();
    }
}

/**
 * Appends a log message to the log buffer
 * @param {string} message message
 * @param {string} facility facility
 * @param {string} severity one off info, warn, error
 * @returns {void}
 */
function logMessage(message, facility, severity) {
    let messagesLen = messages.length;
    const lastMessage = messagesLen > 0 ? messages[messagesLen - 1] : null;
    if (lastMessage !== null &&
        lastMessage.message === message)
    {
        lastMessage.occurrence++;
        lastMessage.timestamp = getTimestamp();
    }
    else {
        messages.push({
            "message": message,
            "facility": facility,
            "severity": severity,
            "occurrence": 1,
            "timestamp": getTimestamp()
        });
        if (messagesLen >= messagesMax) {
            messages.shift();
        }
        else {
            messagesLen++;
        }
    }
    //update log overview if shown
    if (document.getElementById('modalNotifications').classList.contains('show')) {
        showMessages();
    }
}

/**
 * Lists the logbuffer in the logOverview element
 * @returns {void}
 */
function showMessages() {
    const overview = document.getElementById('logOverview');
    elClear(overview);
    for (const message of messages) {
        overview.insertBefore(
            elCreateNodes('tr', {}, [
                elCreateText('td', {}, fmtTime(message.timestamp)),
                elCreateNodes('td', {}, [
                    createSeverityIcon(message.severity),
                    document.createTextNode(tn(facilities[message.facility]))
                ]),
                elCreateText('td', {}, message.occurrence),
                elCreateNodes('td', {}, [
                    elCreateText('p', {"class": ["mb-0"]}, message.message)
                ])
            ]),
        overview.firstElementChild);
    }
    if (overview.querySelector('tr') === null) {
        overview.appendChild(emptyRow(4));
    }
}

/**
 * Clears the logbuffer
 * @returns {void}
 */
//eslint-disable-next-line no-unused-vars
function clearMessages() {
    const overview = document.getElementById('logOverview');
    elClear(overview);
    overview.appendChild(emptyRow(4));
    messages.length = 0;
}

/**
 * Checks for web notification support
 * @returns {boolean} true if web notifications are supported, else false
 */
function notificationsSupported() {
    return "Notification" in window;
}

/**
 * Toggles the ui state
 * @returns {void}
 */
function toggleUI() {
    /** @type {string} */
    const state = getWebsocketState() &&
        settings.partition.mpdConnected &&
        myMPDready
            ? 'enabled'
            : 'disabled';
    /** @type {boolean} */
    const enabled = state === 'disabled' ? false : true;
    if (enabled !== uiEnabled) {
        logDebug('Setting ui state to ' + state);
        domCache.body.setAttribute('data-uiState', state);
        //remember current state
        uiEnabled = enabled;
    }

    if (myMPDready === false) {
        toggleAlert('alertMympdNotReady', true, tn('myMPD not yet ready'));
    }
    else {
        toggleAlert('alertMympdNotReady', false, '');
    }

    if (settings.partition.mpdConnected === true) {
        toggleAlert('alertMpdState', false, '');
    }
    else {
        toggleAlert('alertMpdState', true, tn('MPD disconnected'));
        logMessage(tn('MPD disconnected'), 'mpd', 'error');
    }

    if (getWebsocketState() === true) {
        toggleAlert('alertMympdState', false, '');
    }
    else if (appInited === true) {
        toggleAlert('alertMympdState', true, tn('Disconnected from myMPD'));
        logMessage(tn('Websocket is disconnected'), 'general', 'error');
    }

    setStateIcon();
}

/**
 * Shows an alert in a modal
 * @param {object} obj jsonrpc error response
 * @returns {void}
 */
function showModalAlert(obj) {
    const aModal = getOpenModal();
    const activeAlert = aModal.querySelector('.modalAlert');
    const div = elCreateTextTn('div', {"class": ["alert", "alert-danger", "modalAlert"]}, obj.error.message, obj.error.data);
    if (activeAlert === null) {
        aModal.querySelector('.modal-body').appendChild(div);
    }
    else {
        aModal.querySelector('.modal-body').replaceChild(div, activeAlert);
    }
}

/**
 * Shows an info in a modal
 * @param {string} message message to display
 * @returns {void}
 */
function showModalInfo(message) {
    const aModal = getOpenModal();
    const activeAlert = aModal.querySelector('.modalAlert');
    const div = elCreateTextTn('div', {"class": ["alert", "alert-success", "modalAlert"]}, message);
    if (activeAlert === null) {
        aModal.querySelector('.modal-body').appendChild(div);
    }
    else {
        aModal.querySelector('.modal-body').replaceChild(div, activeAlert);
    }
}

/**
 * Removes all alerts in a modal
 * @param {HTMLElement | Element} el the modal element
 * @returns {void}
 */
function hideModalAlert(el) {
    const activeAlerts = el.querySelectorAll('.modalAlert');
    for (let i = 0, j = activeAlerts.length; i < j; i++) {
        activeAlerts[i].remove();
    }
}

/**
 * Hides a dismissible alert
 * @param {EventTarget} target close button of the alert
 * @returns {void}
 */
//eslint-disable-next-line no-unused-vars
function hideAlert(target) {
    elHide(target.parentNode);
}
