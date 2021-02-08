"use strict";

function parseServers(obj) {
    let list = '';
    if (obj.error) {
        list = '<div class="list-group-item"><span class="material-icons">error_outline</span> ' + t(obj.error.message) + '</div>';
    }
    else {
        for (let i = 0; i < obj.result.returnedEntities; i++) {
            list += '<a href="#" class="list-group-item list-group-item-action" data-value="' + obj.result.data[i].ipAddress + '">' +
                obj.result.data[i].ipAddress + '<br/><small>' + obj.result.data[i].name + '</small></a>';
        }
        if (obj.result.returnedEntities === 0) {
            list = '<div class="list-group-item"><span class="material-icons">error_outline</span>&nbsp;' + t('Empty list') + '</div>';
        }
    }
    document.getElementById('dropdownServers').children[0].innerHTML = list;
}

function parseWifi(obj) {
    let list = '';
    if (obj.error) {
        list = '<div class="list-group-item"><span class="material-icons">error_outline</span> ' + t(obj.error.message) + '</div>';
    }
    else {
        for (let i = 0; i < obj.result.returnedEntities; i++) {
            list += '<a href="#" class="list-group-item list-group-item-action" data-value="' + obj.result.data[i].wifiSSID + '">' +
                obj.result.data[i].wifiSSID + '<br/></a>';
        }
        if (obj.result.returnedEntities === 0) {
            list = '<div class="list-group-item"><span class="material-icons">error_outline</span>&nbsp;' + t('Empty list') + '</div>';
        }
    }
    document.getElementById('dropdownWifi').children[0].innerHTML = list;
}

function checkForUpdates() {
    sendAPI("MYMPD_API_UPDATE_CHECK", {}, parseCheck);

    btnWaiting(document.getElementById('btnCheckForUpdates'), true);
}

function parseCheck(obj) {
    document.getElementById('currentVersion').innerText = obj.result.currentVersion;
    document.getElementById('latestVersion').innerText = obj.result.latestVersion;

    if (obj.result.latestVersion !== '') {
        if (obj.result.updatesAvailable === true) {
            document.getElementById('lblInstallUpdates').innerText = 'New version available';
            document.getElementById('btnInstallUpdates').classList.remove('hide');
        }
        else {
            document.getElementById('lblInstallUpdates').innerText = 'System is up to date';
            document.getElementById('btnInstallUpdates').classList.add('hide');
        }
        document.getElementById('updateMsg').innerText = '';
    }
    else {
        document.getElementById('lblInstallUpdates').innerText = '';
        document.getElementById('btnInstallUpdates').classList.add('hide');
        document.getElementById('updateMsg').innerText = 'Cannot get latest version, please try again later';
    }

    btnWaiting(document.getElementById('btnCheckForUpdates'), false);
}

function installUpdates() {
    sendAPI("MYMPD_API_UPDATE_INSTALL", {}, parseInstall);

    document.getElementById('updateMsg').innerText = 'System will automatically reboot after installation';

    btnWaiting(document.getElementById('btnInstallUpdates'), true);
}

function parseInstall(obj) {
    if (obj.result.pacman === false) {
        document.getElementById('updateMsg').innerText = 'Update error, please try again later';
    }
    else if (obj.result.reboot === false) {
        document.getElementById('updateMsg').innerText = 'Reboot error, please reboot manually';
    }
    else {
        document.getElementById('updateMsg').innerText = '';
    }

    btnWaiting(document.getElementById('btnInstallUpdates'), false);
}

function parseCollybiaSettings() {
    document.getElementById('selectDac').value = settings.dac;
    document.getElementById('selectMixerType').value = settings.mixerType;
    toggleBtnChk('btnDop', settings.dop);
    toggleBtnChk('btnFFmpeg', settings.ffmpeg);

    document.getElementById('selectNsType').value = settings.nsType;
    document.getElementById('inputNsServer').value = settings.nsServer;
    document.getElementById('inputNsShare').value = settings.nsShare;
    document.getElementById('selectSambaVersion').value = settings.sambaVersion;
    document.getElementById('inputNsUsername').value = settings.nsUsername;
    document.getElementById('inputNsPassword').value = settings.nsPassword;

    if (settings.nsType === 0) {
        document.getElementById('nsServerShare').classList.add('hide');
        document.getElementById('sambaVersion').classList.add('hide');
        document.getElementById('nsCredentials').classList.add('hide');
        /* document.getElementById('inputNsServer').setAttribute('disabled', 'disabled');
        document.getElementById('inputNsShare').setAttribute('disabled', 'disabled');
        document.getElementById('inputNsUsername').setAttribute('disabled', 'disabled');
        document.getElementById('inputNsPassword').setAttribute('disabled', 'disabled'); */
    }
    else if (settings.nsType === 2) {
        document.getElementById('nsServerShare').classList.remove('hide');
        document.getElementById('sambaVersion').classList.remove('hide');
        document.getElementById('nsCredentials').classList.remove('hide');
    }
    else { // 1 or 3
        document.getElementById('nsServerShare').classList.remove('hide');
        if (settings.nsType === 1) {
            document.getElementById('sambaVersion').classList.remove('hide');
        }
        else {
            document.getElementById('sambaVersion').classList.add('hide');
        }
        document.getElementById('nsCredentials').classList.add('hide');
    }

    toggleBtnChk('btnAPMode', settings.apmode);
    toggleBtnChk('btnAirplay', settings.airplay);
    toggleBtnChk('btnRoon', settings.roon);
    toggleBtnChk('btnSpotify', settings.spotify);
    toggleBtnChk('btnWifiEnabled', settings.wifi);
    document.getElementById('inputWifiPassword').value = settings.wifiPassword;
    toggleBtnChkCollapse('btnTidalEnabled', 'collapseTidal', settings.tidalEnabled);
    document.getElementById('inputTidalUsername').value = settings.tidalUsername;
    document.getElementById('inputTidalPassword').value = settings.tidalPassword;
    document.getElementById('selectTidalAudioquality').value = settings.tidalAudioquality;
}

function saveCollybiaSettings() {
    let formOK = true;

    let selectNsType = document.getElementById('selectNsType');
    let selectNsTypeValue = selectNsType.options[selectNsType.selectedIndex].value;
    let inputNsServer = document.getElementById('inputNsServer');
    let inputNsShare = document.getElementById('inputNsShare');
    let inputNsUsername = document.getElementById('inputNsUsername');
    let inputNsPassword = document.getElementById('inputNsPassword');

    if (selectNsTypeValue !== '0') {
        if (!validateNotBlank(inputNsServer)) {
            formOK = false;
        }
        if (!validatePath(inputNsShare)) {
            formOK = false;
        }
    }
    if (selectNsTypeValue === '2') {
        if (!validateNotBlank(inputNsUsername) || !validateNotBlank(inputNsPassword)) {
            formOK = false;
        }
    }

    let inputTidalUsername = document.getElementById('inputTidalUsername');
    let inputTidalPassword = document.getElementById('inputTidalPassword');
    if (document.getElementById('btnTidalEnabled').classList.contains('active')) {
        if (!validateNotBlank(inputTidalUsername) || !validateNotBlank(inputTidalPassword)) {
            formOK = false;
        }
    }

    let inputWifiPassword = document.getElementById('inputWifiPassword');
    if (document.getElementById('btnWifiEnabled').classList.contains('active')) {
        if (!validateNotBlank(inputWifiPassword)) {
            formOK = false;
        }
    }

    if (formOK === true) {
        let selectDac = document.getElementById('selectDac');
        let selectMixerType = document.getElementById('selectMixerType');
        let selectSambaVersion = document.getElementById('selectSambaVersion');
        let selectTidalAudioquality = document.getElementById('selectTidalAudioquality');
        sendAPI("MYMPD_API_SETTINGS_SET", {
            "dac": selectDac.options[selectDac.selectedIndex].value,
            "mixerType": selectMixerType.options[selectMixerType.selectedIndex].value,
            "dop": (document.getElementById('btnDop').classList.contains('active') ? true : false),
            "ffmpeg": (document.getElementById('btnFFmpeg').classList.contains('active') ? true : false),
            "nsType": parseInt(selectNsTypeValue),
            "nsServer": inputNsServer.value,
            "nsShare": inputNsShare.value,
            "sambaVersion": selectSambaVersion.options[selectSambaVersion.selectedIndex].value,
            "nsUsername": inputNsUsername.value,
            "nsPassword": inputNsPassword.value,
            "apmode": (document.getElementById('btnAPMode').classList.contains('active') ? true : false),
            "airplay": (document.getElementById('btnAirplay').classList.contains('active') ? true : false),
            "roon": (document.getElementById('btnRoon').classList.contains('active') ? true : false),
            "spotify": (document.getElementById('btnSpotify').classList.contains('active') ? true : false),
            "wifi": (document.getElementById('btnWifiEnabled').classList.contains('active') ? true : false),
            "wifiPassword": inputWifiPassword.value,
            "tidalEnabled": (document.getElementById('btnTidalEnabled').classList.contains('active') ? true : false),
            "tidalUsername": inputTidalUsername.value,
            "tidalPassword": inputTidalPassword.value,
            "tidalAudioquality": selectTidalAudioquality.options[selectTidalAudioquality.selectedIndex].value
        }, getSettings);
        modalCollybia.hide();
    }
}
