/****************************************************************************
 * index.js
 * openacousticdevices.info
 * December 2022
 *****************************************************************************/

/* global AudioMothChimeConnector */
import {initialiseTzf} from './timeZone.js';
import {setUpMap, hideMap, showMap, isLocationChimeEnabled, disableLocationSwitch, getMarkerLatLng, enableLocationSwitch, locationSwitch} from './map.js';
import {getTimeZoneMode, getCustomTimeZoneOffsetString, getLocalTimeZoneString, getMapTimeZoneString, getSelectedTimeZoneOffsetMins} from './timeZoneSelection.js';

const mainContent = document.getElementById('main-content');

const iphoneWarning = document.getElementById('iphone-warning');

const timeRow = document.getElementById('time-row');
const locationRow = document.getElementById('location-row');

let audioMothChimeConnector;

const timeLabel = document.getElementById('time-label');
const timeZoneLabel = document.getElementById('time-zone-label');
const timeZoneLink = document.getElementById('time-zone-link');
const timeZoneHolder = document.getElementById('time-zone-holder');
const timeZoneMobileSpan = document.getElementById('time-zone-mobile-span');

const chimeButton = document.getElementById('chime-button');

const localTimeZoneModalLabel = document.getElementById('local-time-zone-modal-label');

const locationSwitchLabel = document.getElementById('location-switch-label');

const latLabel = document.getElementById('lat-label');
const lonLabel = document.getElementById('lon-label');

const switchDiv = document.getElementById('switch-div');

// Keep time UI updated

function updateTime () {

    const currentDate = new Date();

    const hours = String(currentDate.getUTCHours()).padStart(2, '0');
    const mins = String(currentDate.getUTCMinutes()).padStart(2, '0');
    const secs = String(currentDate.getUTCSeconds()).padStart(2, '0');

    let timeString = hours;
    timeString += ':';
    timeString += mins;
    timeString += ':';
    timeString += secs;

    timeLabel.innerText = timeString + ' UTC';

    updateTimeZone();

    setTimeout(updateTime, 1000);

}

function updateTimeZone () {

    let timeZoneText = '';

    // Update label in modal
    const localTimeZoneText = getLocalTimeZoneString();
    localTimeZoneModalLabel.innerText = localTimeZoneText;

    // Update main label
    switch (getTimeZoneMode()) {

    case 'local':
        timeZoneText = localTimeZoneText;
        timeZoneLabel.innerText = 'Local Time Zone:';
        break;
    case 'map':
        timeZoneText = getMapTimeZoneString();
        timeZoneLabel.innerText = 'Map Time Zone:';
        break;
    case 'custom':
        timeZoneText = getCustomTimeZoneOffsetString();
        timeZoneLabel.innerText = 'Custom Time Zone:';
        break;

    }

    timeZoneLink.innerText = timeZoneText;
    timeZoneMobileSpan.innerText = timeZoneText;

}

// Handle chime button event

async function handleChime () {

    chimeButton.disabled = true;
    disableLocationSwitch();

    const date = new Date();

    const tzOffsetMinutes = getSelectedTimeZoneOffsetMins();

    if (!isLocationChimeEnabled()) {

        audioMothChimeConnector.playTime(date, tzOffsetMinutes, undefined, undefined, () => {

            enableLocationSwitch();
            chimeButton.disabled = false;

        });

    } else {

        const latLng = getMarkerLatLng();

        console.log('Chiming using location', latLng.lat, latLng.lng);

        audioMothChimeConnector.playTime(date, tzOffsetMinutes, latLng.lat, latLng.lng, () => {

            chimeButton.disabled = false;
            locationSwitch.disabled = false;
            enableLocationSwitch();

        });

    }

}

async function loadPage () {

    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (!isMobile) {

        await initialiseTzf();

    }

    updateTime();

    chimeButton.addEventListener('click', handleChime);

    mainContent.style.display = 'flex';

    if (isIOS) {

        iphoneWarning.innerHTML = 'Adjust volume to 3/4 full and ensure<br>that silent mode is switched off.';

        setTimeout(() => {

            iphoneWarning.style.opacity = '0';

        }, 5000);

    } else {

        iphoneWarning.innerText = '';

    }

    if (isMobile) {

        hideMap();

        timeZoneMobileSpan.style.display = '';
        timeZoneLink.style.display = 'none';

        const width = window.innerWidth;

        timeLabel.style.fontSize = 0.1 * width + 'px';
        timeZoneHolder.style.fontSize = 0.05 * width + 'px';
        locationSwitchLabel.style.fontSize = 0.05 * width + 'px';
        latLabel.style.fontSize = 0.075 * width + 'px';
        lonLabel.style.fontSize = 0.075 * width + 'px';

        timeRow.style.marginTop = '40%';
        timeRow.style.height = '280px';
        locationRow.style.height = '300px';

        const thickness = width * 0.01 + 'px';
        const radius = width * 0.04 + 'px';
        document.querySelectorAll('.rounded-border').forEach(el => {

            el.style.setProperty('border-width', thickness, 'important');
            el.style.setProperty('border-radius', radius, 'important');

        });

        chimeButton.style.position = 'fixed';
        chimeButton.style.left = '50%';
        chimeButton.style.transform = 'translateX(-50%)';
        chimeButton.style.bottom = '10px';
        chimeButton.style.zIndex = '1000';
        chimeButton.style.setProperty('width', '80%', 'important');
        chimeButton.style.setProperty('height', '110px', 'important');
        chimeButton.style.fontSize = 0.05 * width + 'px';

    } else {

        iphoneWarning.style.display = 'none';
        timeRow.style.marginTop = '0';

        showMap();
        setUpMap();

    }

}

window.addEventListener('load', () => {

    checkWindowSize();

    audioMothChimeConnector = new AudioMothChimeConnector();

    // Register service worker

    if (!('serviceWorker' in navigator)) {

        console.log('Service workers not supported');

        loadPage();

    } else {

        // Ensure service worker is updated

        navigator.serviceWorker.register('./worker.js?v=6').then(
            () => {

                console.log('Service worker registered');

            },
            (err) => {

                console.error('Service worker registration failed', err);

            }

        );

        navigator.serviceWorker.ready.then(() => {

            console.log('Ready');

            loadPage();

        });

    }

});

function checkWindowSize () {

    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {

        return;

    }

    const height = window.innerHeight;

    const mapDiv = document.getElementById('map-div');

    let timeFontSize;

    if (height < 1080) {

        timeFontSize = 50;

        switchDiv.style.height = '35px';
        chimeButton.style.height = '50px';

        timeRow.style.height = '120px';
        locationRow.style.height = '150px';

        mapDiv.style.height = 'calc(100vh - 430px)';

    } else {

        timeFontSize = 90;

        switchDiv.style.height = '70px';
        chimeButton.style.height = '70px';

        timeRow.style.height = '200px';
        locationRow.style.height = '250px';

        mapDiv.style.height = 'calc(100vh - 620px)';

    }

    timeLabel.style.fontSize = `${timeFontSize}px`;
    timeLabel.style.height = `${1.25 * timeFontSize}px`;
    timeZoneLabel.style.fontSize = `${timeFontSize / 2}px`;
    timeZoneLink.style.fontSize = `${timeFontSize / 2}px`;
    timeZoneMobileSpan.style.fontSize = `${timeFontSize / 2}px`;
    latLabel.style.fontSize = `${3 * timeFontSize / 4}px`;
    latLabel.style.height = `${(3 * timeFontSize / 4) + 10}px`;
    lonLabel.style.fontSize = `${3 * timeFontSize / 4}px`;
    lonLabel.style.height = `${(3 * timeFontSize / 4) + 10}px`;
    locationSwitchLabel.style.fontSize = `${timeFontSize / 2}px`;

}

window.addEventListener('resize', checkWindowSize);

export {updateTimeZone};
