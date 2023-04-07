import browser from 'webextension-polyfill';

export function togglePopup(needAuth = false) {
    if (needAuth) {
        browser.action.setPopup({ popup: browser.runtime.getURL('popup-noauth.html') });
        browser.action.setBadgeBackgroundColor({ color: 'red' });
        browser.action.setBadgeText({ text: '...' });
        return;
    }
    browser.action.setPopup({ popup: browser.runtime.getURL('popup.html') });
    browser.action.setBadgeText({ text: '' });
}
