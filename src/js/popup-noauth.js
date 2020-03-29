import types from './types.js';

const $ = document.querySelector.bind(document);

// TODO: ADD i18n

const loginError = $('#login-error');
const passwordError = $('#password-error');
const submitBtn = $('#submit-button');

const bgScriptPort = browser.runtime.connect();
bgScriptPort.onMessage.addListener(async (message) => {
    const { type, payload } = message;
    switch (type) {
        case types.LOGIN_ERROR:
            passwordError.textContent = `Couldn't log in: ${payload}`;
            submitBtn.textContent = 'Log in';
            break;
        case types.LOGIN_STARTED:
            submitBtn.textContent = 'Logging in ...';
            break;
        case types.LOGIN_SUCCESS:
            submitBtn.textContent = 'Log in';
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
        if (!username) loginError.textContent = 'enter login or email';
        if (!password) passwordError.textContent = 'enter password';
        return;
    }

    bgScriptPort.postMessage({ type: types.LOGIN, payload: { username, password } });
});
