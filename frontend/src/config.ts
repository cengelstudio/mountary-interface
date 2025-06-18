export const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:5001',
    ENDPOINTS: {
        LOGIN: '/api/login',
        CHECK_TOKEN: '/api/check_token',
        DISKS: '/api/disks'
    }
};

export const COOKIE_CONFIG = {
    TOKEN_KEY: 'auth_token',
    EXPIRES_IN: 7 // days
};
