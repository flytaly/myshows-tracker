import './l10n.js'; // load to translate html elements
import './popup/open-links.js';
import types from './types.js';

const $ = document.querySelector.bind(document);

const loginError = $('#login-error');
const passwordError = $('#password-error');
const submitBtn = $('#submit-button');

const bgScriptPort = browser.runtime.connect();
bgScriptPort.onMessage.addListener(async (message) => {
    const { type, payload } = message;
    switch (type) {
        case types.LOGIN_ERROR: {
            let errMsg = payload;
            if (payload === 'Invalid username and password combination') {
                errMsg = browser.i18n.getMessage('invalidUsernameOrPassword');
            }
            passwordError.textContent = `${browser.i18n.getMessage('loginErrorMsg')}: ${errMsg}`;
            submitBtn.textContent = browser.i18n.getMessage('loginButton');
            break;
        }
        case types.LOGIN_STARTED:
            submitBtn.textContent = browser.i18n.getMessage('loggingIn');
            break;
        case types.LOGIN_SUCCESS:
            submitBtn.textContent = browser.i18n.getMessage('loginButton');
            window.close();
            break;
        default:
    }
});

$('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    loginError.textContent = '';
    passwordError.textContent = '';

    const username = $('#login').value.trim();
    const password = $('#password').value.trim();

    if (!username || !password) {
        if (!username) loginError.textContent = browser.i18n.getMessage('emptyUsername');
        if (!password) passwordError.textContent = browser.i18n.getMessage('emptyPassword');
        return;
    }

    bgScriptPort.postMessage({ type: types.LOGIN, payload: { username, password } });
});
