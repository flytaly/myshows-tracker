/* eslint-disable no-unused-expressions,no-param-reassign */
import types from '../types.js';

/* Proxy object that sends messages to the popup upon changes */
const state = new Proxy({
    updating: false,
    lastUpdate: null,
    totalEpisodes: null,
    episodeWasRated: null,
    popupPort: null,
    extensionTitle: '',
    needAuth: false,
    loginStarted: false,
    loginError: {},
}, ({
    set: (obj, prop, value) => {
        const { popupPort } = obj;
        switch (prop) {
            case 'updating':
                popupPort && popupPort.postMessage({
                    type: value ? types.LOADING_START : types.LOADING_ENDED,
                });
                break;
            case 'needAuth':
                if (value) {
                    browser.browserAction.setPopup({ popup: browser.extension.getURL('popup-noauth.html') });
                    browser.browserAction.setBadgeBackgroundColor({ color: 'red' });
                    browser.browserAction.setBadgeText({ text: '...' });
                } else {
                    browser.browserAction.setPopup({ popup: browser.extension.getURL('popup.html') });
                    browser.browserAction.setBadgeText({ text: '' });
                }
                break;
            case 'lastUpdate':
                popupPort && popupPort.postMessage({ type: types.INFO_UPDATED });
                console.log(`Successfully updated at ${value}`);
                break;
            case 'totalEpisodes':
                browser.browserAction.setBadgeBackgroundColor({ color: '#252525' });
                browser.browserAction.setBadgeText({ text: value ? value.toString() : null });
                break;
            case 'extensionTitle':
                browser.browserAction.setTitle({ title: value });
                break;
            case 'episodeWasRated':
                popupPort && popupPort.postMessage({ type: types.EPISODE_WAS_RATED, payload: { episodeId: value } });
                break;
            case 'loginStarted':
                value
                    ? popupPort && popupPort.postMessage({ type: types.LOGIN_STARTED })
                    : popupPort && popupPort.postMessage({ type: types.LOGIN_SUCCESS });
                break;
            case 'loginError':
                popupPort && popupPort.postMessage({
                    type: types.LOGIN_ERROR,
                    payload: value.message,
                });
                break;
            default:
        }
        obj[prop] = value;
        return true;
    },
}));

export default state;
