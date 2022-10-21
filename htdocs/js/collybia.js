"use strict";
// SPDX-License-Identifier: GPL-3.0-or-later
// myMPD (c) 2018-2022 Juergen Mang <mail@jcgames.de>
// https://github.com/jcorporation/mympd

function initCollybia() {
    document.getElementById('btnDropdownServers').parentNode.addEventListener('show.bs.dropdown', function () {
        sendAPI("MYMPD_API_NS_SERVER_LIST", {}, parseServers, true);
    });

    document.getElementById('dropdownServers').children[0].addEventListener('click', function (event) {
        event.preventDefault();
        if (event.target.nodeName === 'A') {
            document.getElementById('inputNsServer').value = event.target.getAttribute('data-value');
        }
    });

    document.getElementById('btnDropdownWifi').parentNode.addEventListener('show.bs.dropdown', function () {
        sendAPI("MYMPD_API_WIFI_SERVER_LIST", {}, parseWifi, true);
    });

    document.getElementById('dropdownWifi').children[0].addEventListener('click', function (event) {
        event.preventDefault();
        if (event.target.nodeName === 'A') {
            document.getElementById('inputWifiSSID').value = event.target.getAttribute('data-value');
        }
    });
}

function populateCollybiaSettingsFrm() {
        document.getElementById('selectDac').value = settings.dac;
        document.getElementById('selectMixerType').value = settings.mixer;

        document.getElementById('selectNsType').value = settings.nsType;
        document.getElementById('inputNsServer').value = settings.nsServer;
        document.getElementById('inputNsShare').value = settings.nsShare;
        document.getElementById('selectSambaVersion').value = settings.sambaVersion;
        document.getElementById('inputNsUsername').value = settings.nsUsername;
        document.getElementById('inputNsPassword').value = settings.nsPassword;

    if (settings.nsType === 0) {
        document.getElementById('selectNsType').parentNode.parentNode.classList.remove('d-none');
        document.getElementById('inputNsShare').parentNode.parentNode.classList.add('d-none');
        document.getElementById('selectSambaVersion').parentNode.parentNode.classList.add('d-none');
        document.getElementById('inputNsUsername').parentNode.parentNode.classList.add('d-none');
        document.getElementById('inputNsPassword').parentNode.parentNode.classList.add('d-none');
        document.getElementById('inputNsServer').parentNode.parentNode.classList.add('d-none');
    }
    else if (settings.nsType === 2) {
            document.getElementById('inputNsShare').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('selectSambaVersion').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsUsername').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsPassword').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsServer').parentNode.parentNode.classList.remove('d-none');
    }
    else {
        document.getElementById('nsServerShare').parentNode.parentNode.classList.remove('d-none');
        if (settings.nsType === 1) {
            document.getElementById('inputNsShare').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('selectSambaVersion').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsServer').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsUsername').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsPassword').parentNode.parentNode.classList.add('d-none');
        }
        else {
            document.getElementById('sambaVersion').parentNode.parentNode.classList.add('d-none');
        }
            document.getElementById('inputNsServer').parentNode.parentNode.classList.remove('d-none');
            document.getElementById('inputNsUsername').parentNode.parentNode.classList.add('d-none');
            document.getElementById('inputNsPassword').parentNode.parentNode.classList.add('d-none');
    }

        document.getElementById('inputWifiSSID').value = settings.wifissid;
        document.getElementById('inputWifiPassword').value = settings.wifiPassword;

        toggleBtnChkId('btnDop', settings.dop);
        toggleBtnChkId('btnFFmpeg', settings.ffmpeg);
        toggleBtnChkId('btnAPMode', settings.apmode);
        toggleBtnChkId('btnAirplay', settings.airplay);
        toggleBtnChkId('btnRoon', settings.roon);
        toggleBtnChkId('btnSpotify', settings.spotify);
        toggleBtnChkId('btnWifiEnabled', settings.wifi);
}


function parseServers(obj) {
    let list = '';
    if (obj.error) {
        list = '<div class="list-group-item"><span class="mi">error_outline</span> ' + tn(obj.error.message) + '</div>';
    }
    else {
        for (let i = 0; i < obj.result.returnedEntities; i++) {
            list += '<a href="#" class="list-group-item list-group-item-action" data-value="' + obj.result.data[i].ipAddress + '">' +
                obj.result.data[i].ipAddress + '<br/><small>' + obj.result.data[i].name + '</small></a>';
        }
        if (obj.result.returnedEntities === 0) {
            list = '<div class="list-group-item"><span class="mi">error_outline</span>&nbsp;' + tn('Empty list') + '</div>';
        }
    }

    document.getElementById('dropdownServers').children[0].innerHTML = list;
}

function parseWifi(obj) {
    let list = '';
    if (obj.error) {
        list = '<div class="list-group-item"><span class="mi">error_outline</span> ' + tn(obj.error.message) + '</div>';
    }
    else {
        for (let i = 0; i < obj.result.returnedEntities; i++) {
            list += '<a href="#" class="list-group-item list-group-item-action" data-value="' + obj.result.data[i].wifiSSID + '">' +
                obj.result.data[i].wifiSSID + '<br/></a>';
        }
        if (obj.result.returnedEntities === 0) {
            list = '<div class="list-group-item"><span class="mi">error_outline</span>&nbsp;' + tn('Empty list') + '</div>';
        }
    }
    document.getElementById('dropdownWifi').children[0].innerHTML = list;
}

function wifiConnect() {
    sendAPI("MYMPD_API_WIFI_CONNECT", {});
    btnWaiting(document.getElementById('btnWifiConnect'), false);
}

function saveCollybiaSettings(closeModal) {
    cleanupModalId('modalCollybia');
    let formOK = true;

    const inputNsServer = document.getElementById('inputNsServer');

    const inputNsShare = document.getElementById('inputNsShare');

    const inputNsUsername = document.getElementById('inputNsUsername');

    const inputNsPassword = document.getElementById('inputNsPassword');

    const inputWifiPassword = document.getElementById('inputWifiPassword');

    const inputWifiSSID = document.getElementById('inputWifiSSID');

    const selectNsTypeEl = document.getElementById('selectNsType');
    let nsType = getSelectValue(selectNsTypeEl);

    const selectSambaVersionEl = document.getElementById('selectSambaVersion');
    let sambaVersion = getSelectValue(selectSambaVersionEl);

    const selectDacEl = document.getElementById('selectDac');
    let dac = getSelectValue(selectDacEl);

    const selectMixerTypeEl = document.getElementById('selectMixerType');
    let mixer = getSelectValue(selectMixerTypeEl);

    if (formOK === true) {
        const params = {
            "dop": (document.getElementById('btnDop').classList.contains('active') ? true : false),
            "ffmpeg": (document.getElementById('btnFFmpeg').classList.contains('active') ? true : false),
            "apmode": (document.getElementById('btnAPMode').classList.contains('active') ? true : false),
            "nsType": Number(nsType),
            "sambaVersion": sambaVersion,
            "nsServer": inputNsServer.value,
            "nsShare": inputNsShare.value,
            "nsUsername": inputNsUsername.value,
            "nsPassword": inputNsPassword.value,
            "wifiPassword": inputWifiPassword.value,
            "wifissid": inputWifiSSID.value,
            "airplay": (document.getElementById('btnAirplay').classList.contains('active') ? true : false),
            "roon": (document.getElementById('btnRoon').classList.contains('active') ? true : false),
            "spotify": (document.getElementById('btnSpotify').classList.contains('active') ? true : false),
            "wifi": (document.getElementById('btnWifiEnabled').classList.contains('active') ? true : false),
            "dac": dac,
            "mixer": mixer
        };

        if (closeModal === true) {
            sendAPI("MYMPD_API_SETTINGS_SET", params, saveCollybiaSettingsClose, true);
        }
    }
}

function saveCollybiaSettingsClose(obj) {
    if (obj.error) {
        showModalAlert(obj);
    }
    else {
        getSettings(false);
        uiElements.modalCollybia.hide();
    }
}
