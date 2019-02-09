/* eslint-disable import/prefer-default-export */

class AuthError extends Error {
    constructor(message, needAuth = true) {
        super();
        this.name = 'AuthError';
        this.message = message;
        this.needAuth = needAuth;
    }
}

export { AuthError };
