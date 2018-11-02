/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const MerossCloud = require('../index.js');

const options = {
    'email': 'email',
    'password': 'password',
    'logger': console.log
};

const meross = new MerossCloud(options);

meross.on('deviceInitialized', (deviceId, deviceDef, device) => {
    console.log('New device ' + deviceId + ': ' + JSON.stringify(deviceDef));

    device.on('connected', () => {
        console.log('DEV: ' + deviceId + ' connected');

        device.getSystemAbilities((err, res) => {
            console.log('Abilities: ' + JSON.stringify(res));

            device.getSystemAllData((err, res) => {
                console.log('All-Data: ' + JSON.stringify(res));
            });
        });
        setTimeout(() => {
            console.log('toggle ...');
            device.controlToggleX(1, true, (err, res) => {
                console.log('Toggle Response: err: ' + err + ', res: ' + JSON.stringify(res));
            });
        }, 2000);
    });

    device.on('close', (error) => {
        console.log('DEV: ' + deviceId + ' closed: ' + error);
    });

    device.on('error', (error) => {
        console.log('DEV: ' + deviceId + ' error: ' + error);
    });

    device.on('reconnect', () => {
        console.log('DEV: ' + deviceId + ' reconnected');
    });

    device.on('data', (namespace, payload) => {
        console.log('DEV: ' + deviceId + ' ' + namespace + ' - data: ' + JSON.stringify(payload));
    });

});

meross.on('connected', (deviceId) => {
    console.log(deviceId + ' connected');
});

meross.on('close', (deviceId, error) => {
    console.log(deviceId + ' closed: ' + error);
});

meross.on('error', (deviceId, error) => {
    console.log(deviceId + ' error: ' + error);
});

meross.on('reconnect', (deviceId) => {
    console.log(deviceId + ' reconnected');
});

meross.on('data', (deviceId, payload) => {
    console.log(deviceId + ' data: ' + JSON.stringify(payload));
});



meross.connect((error) => {
    console.log('connect error: ' + error);
});
