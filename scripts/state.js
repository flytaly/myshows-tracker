/* eslint-disable no-unused-expressions,no-param-reassign */
/* global browser */
import types from './types';

/* Proxy object that sends messages to the popup upon changes */
const state = new Proxy({
    updating: false,
    lastUpdate: null,
    totalEpisodes: null,
    episodeWasRated: null,
    popupPort: null,
}, ({
    set: (obj, prop, value) => {
        const { popupPort } = obj;
        switch (prop) {
            case 'updating':
                popupPort && popupPort.postMessage({
                    type: value ? types.LOADING_START : types.LOADING_ENDED,
                });
                break;
            case 'lastUpdate':
                popupPort && popupPort.postMessage({ type: types.INFO_UPDATED });
                console.log(`Successfully updated at ${value}`);
                break;
            case 'totalEpisodes':
                browser.browserAction.setBadgeBackgroundColor({ color: '#252525' });
                browser.browserAction.setBadgeText({ text: value ? value.toString() : null });
                break;
            case 'episodeWasRated':
                popupPort && popupPort.postMessage({ type: types.EPISODE_WAS_RATED, payload: { episodeId: value } });
                break;
            default:
        }
        obj[prop] = value;
        return true;
    },
}));

export default state;
