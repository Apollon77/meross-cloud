const errorMessages = {
     500: 'The selected timezone is not supported',
    1001: 'Wrong or missing password',
    1002: 'Account does not exist',
    1003: 'This account has been disabled or deleted',
    1004: 'Wrong email or password',
    1005: 'Invalid email address',
    1006: 'Bad password format',
    1008: 'This email is not registered',
    1019: 'Token expired',
    1022: 'Token error',
    1030: 'Redirect app to login other than this region',
    1032: 'Invalid MFA code. Please use a current MFA code.',
    1033: 'MFA is activated for the account but MFA code not provided. Please provide a current MFA code.',
    1200: 'Token has expired',
    1255: 'The number of remote control boards exceeded the limit',
    1301: 'You have issued too many tokens without logging out and your account might have been temporarily disabled.',
    5000: 'Unknown or generic error',
    5001: 'Unknown or generic error',
    5002: 'Unknown or generic error',
    5003: 'Unknown or generic error',
    5004: 'Unknown or generic error',
    5020: 'Infrared Remote device is busy',
    5021: 'Infrared record timeout',
    5022: 'Infrared record invalid'
}

module.exports = {
    getErrorMessage(code) {
        return errorMessages[code] || 'Unknown error';
    }
}
