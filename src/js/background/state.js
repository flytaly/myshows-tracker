import browser from 'webextension-polyfill';
import types from '../types.js';

// eslint-disable-next-line no-use-before-define
const sendMsg = (msg) => state.popupPort?.postMessage(msg);

/* Proxy object that sends messages to the popup upon changes */
const state = new Proxy(
    {
        updating: false,
        lastUpdate: null,
        totalEpisodes: null,
        episodeWasRated: null,
        popupPort: null,
        extensionTitle: '',
        loginStarted: false,
        loginError: {},
    },
    {
        set: (obj, prop, value) => {
            switch (prop) {
                case 'updating':
                    sendMsg({ type: value ? types.LOADING_START : types.LOADING_ENDED });
                    break;
                case 'lastUpdate':
                    sendMsg({ type: types.INFO_UPDATED });
                    console.log(`%c ✅ Successfully updated at ${value}`, 'color:green;');
                    break;
                case 'totalEpisodes':
                    browser.action.setBadgeBackgroundColor({ color: '#252525' });
                    browser.action.setBadgeText({ text: value ? value.toString() : '' });
                    break;
                case 'extensionTitle':
                    browser.action.setTitle({ title: value });
                    break;
                case 'episodeWasRated':
                    sendMsg({ type: types.EPISODE_WAS_RATED, payload: { episodeId: value } });
                    break;
                case 'loginStarted':
                    sendMsg({ type: value ? types.LOGIN_STARTED : types.LOGIN_SUCCESS });
                    break;
                case 'loginError':
                    sendMsg({ type: types.LOGIN_ERROR, payload: value.message });
                    break;
                default:
            }
            // eslint-disable-next-line no-param-reassign
            obj[prop] = value;
            return true;
        },
    },
);

export default state;
