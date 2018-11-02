/* jshint -W097 */
/* jshint -W030 */
/* jshint strict:true */
/* jslint node: true */
/* jslint esversion: 6 */
'use strict';

const mqtt = require('mqtt');
const crypto = require('crypto');
const request = require('request');
const EventEmitter = require('events');

const SECRET = "23x17ahWarFH6w29";
const MEROSS_URL = "https://iot.meross.com";
const LOGIN_URL = MEROSS_URL + "/v1/Auth/Login";
const DEV_LIST = MEROSS_URL + "/v1/Device/devList";

function generateRandomString(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let nonce = '';
    while (nonce.length < length) {
        nonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return nonce;
}

function encodeParams(parameters) {
    const jsonstring = JSON.stringify(parameters);
    return Buffer.from(jsonstring).toString('base64');
}


class MerossCloud extends EventEmitter {

    /*
        email
        password
    */

    constructor(options) {
        super();

        this.options = options || {};
        this.token = null;
        this.key = null;
        this.userId = null;
        this.userEmail = null;
        this.authenticated = false;

        this.devices = {};
    }

    authenticatedPost(url, paramsData, callback) {
        const nonce = generateRandomString(16);
        const timestampMillis = Date.now();
        const loginParams = encodeParams(paramsData);

        // Generate the md5-hash (called signature)
        const datatosign = SECRET + timestampMillis + nonce + loginParams;
        const md5hash = crypto.createHash('md5').update(datatosign).digest("hex");
        const headers = {
            "Authorization": "Basic " + (this.token || ''),
            "vender": "Meross",
            "AppVersion": "1.3.0",
            "AppLanguage": "EN",
            "User-Agent": "okhttp/3.6.0"
        };

        const payload = {
            'params': loginParams,
            'sign': md5hash,
            'timestamp': timestampMillis,
            'nonce': nonce
        };

        const options = {
            url: url,
            method: 'POST',
            headers: headers,
            form: payload
        };
        //console.log(options);
        // Perform the request.
        request(options, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                //console.log(body);
                body = JSON.parse(body);

                if (body.info === 'Success') {
                    return callback && callback(null, body.data);
                }
                return callback && callback(new Error(body.apiStatus + ': ' + body.info));
            }
            return callback && callback(error);
        });
    }

    connect(callback) {

        const data = {"email": this.options.email, "password": this.options.password};

        this.authenticatedPost(LOGIN_URL, data, (err, loginResponse) => {
            //console.log(loginResponse);
            if (err) {
                callback && callback(err);
                return;
            }
            this.token = loginResponse.token;
            this.key = loginResponse.key;
            this.userId = loginResponse.userid;
            this.userEmail = loginResponse.email;
            this.authenticated = true;

            this.authenticatedPost(DEV_LIST, {}, (err, deviceList) => {
                //console.log(JSON.stringify(deviceList, null, 2));

                deviceList.forEach((dev) => {
                    //const deviceType = dev.deviceType;
                    this.devices[dev.uuid] = new MerossCloudDevice(this.token, this.key, this.userId, dev);
                    this.devices[dev.uuid].on('connected', () => {
                        this.emit('connected', dev.uuid);
                    });
                    this.devices[dev.uuid].on('close', (error) => {
                        this.emit('close', dev.uuid, error);
                    });
                    this.devices[dev.uuid].on('error', (error) => {
                        this.emit('error', dev.uuid, error);
                    });
                    this.devices[dev.uuid].on('reconnect', () => {
                        this.emit('reconnect', dev.uuid);
                    });
                    this.devices[dev.uuid].on('data', (namespace, payload) => {
                        this.emit('data', dev.uuid, namespace, payload);
                    });
                    this.emit('deviceInitialized', dev.uuid, dev, this.devices[dev.uuid]);
                    this.devices[dev.uuid].connect();
                });

                callback && callback(null);
            });
        });


        /*

        /app/64416/subscribe <-- {"header":{"messageId":"b5da1e168cba7a681afcff82eaf703c8","namespace":"Appliance.System.Online","timestamp":1539614195,"method":"PUSH","sign":"b16c2c4cbb5acf13e6b94990abf5b140","from":"/appliance/1806299596727829081434298f15a991/subscribe","payloadVersion":1},"payload":{"online":{"status":2}}}
        /app/64416/subscribe <-- {"header":{"messageId":"4bf5dfaaa0898243a846c1f2a93970fe","namespace":"Appliance.System.Online","timestamp":1539614201,"method":"PUSH","sign":"f979692120e7165b2116abdfd464ca83","from":"/appliance/1806299596727829081434298f15a991/subscribe","payloadVersion":1},"payload":{"online":{"status":1}}}
        /app/64416/subscribe <-- {"header":{"messageId":"46182b62a9377a8cc0147f22262a23f3","namespace":"Appliance.System.Report","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539614201,"timestampMs":78,"sign":"048fad34ca4d00875a026e33b16caf1b"},"payload":{"report":[{"type":"1","value":"0","timestamp":1539614201}]}}
        TIMEOUT
        err: Error: Timeout, res: undefined
        /app/64416/subscribe <-- {"header":{"messageId":"8dbe0240b2c03dcefda87a758a228d21","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539614273,"timestampMs":27,"sign":"0f1ab22db05842eb94714b669b911aff"},"payload":{"togglex":{"channel":1,"onoff":1,"lmTime":1539614273}}}
        /app/64416/subscribe <-- {"header":{"messageId":"6ecacf6453bb0a4256f8bf1f5dd1d835","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539614276,"timestampMs":509,"sign":"b8281d71ef8ab5420a1382af5ff9fc34"},"payload":{"togglex":{"channel":1,"onoff":0,"lmTime":1539614276}}}

        {"header":{"messageId":"98fee66789f75eb0e149f2a5116f919c","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539633281,"timestampMs":609,"sign":"dd6bf3acee81a6c46f6fedd02515ddf3"},"payload":{"togglex":[{"channel":0,"onoff":0,"lmTime":1539633280},{"channel":1,"onoff":0,"lmTime":1539633280},{"channel":2,"onoff":0,"lmTime":1539633280},{"channel":3,"onoff":0,"lmTime":1539633280},{"channel":4,"onoff":0,"lmTime":1539633280}]}}
        */
    }

    getDevice(uuid) {
        return this.devices[uuid];
    }
}

class MerossCloudDevice extends EventEmitter {

    constructor(token, key, userId, dev) {
        super();

        this.clientRequestTopic = null;
        this.clientResponseTopic = null;
        this.waitingMessageIds = {};

        this.token = token;
        this.key = key;
        this.userId = userId;
        this.dev = dev;
    }

    connect() {
        const domain = this.dev.domain || "eu-iot.meross.com";
        const appId = crypto.createHash('md5').update('API' + this.dev.uuid).digest("hex");
        const clientId = 'app:' + appId;

        // Password is calculated as the MD5 of USERID concatenated with KEY
        const hashedPassword = crypto.createHash('md5').update(this.userId + this.key).digest("hex");

        this.client  = mqtt.connect({
            'protocol': 'mqtts',
            'host': domain,
            'port': 2001,
            'clientId': clientId,
            'username': this.userId,
            'password': hashedPassword,
            'rejectUnauthorized': true,
            'keepalive': 30
        });

        this.client.on('connect', () => {

            //console.log("Connected. Subscribe to user topics");

            this.client.subscribe('/app/' + this.userId + '/subscribe', (err) => {
                if (err) {
                    this.emit('error', err);
                }
                //console.log('User Subscribe Done');
            });

            this.clientRequestTopic = '/appliance/' + this.dev.uuid + '/subscribe';
            this.clientResponseTopic = '/app/' + this.userId + '-' + appId + '/subscribe';

            this.client.subscribe(this.clientResponseTopic, (err) => {
                if (err) {
                    this.emit('error', err);
                }
                //console.log('User Response Subscribe Done');
            });
            this.emit('connected');
        });

        this.client.on('message', (topic, message) => {
            // message is Buffer
            //console.log(topic + ' <-- ' + message.toString());
            message = JSON.parse(message.toString());
            // {"header":{"messageId":"14b4951d0627ea904dd8685c480b7b2e","namespace":"Appliance.Control.ToggleX","method":"PUSH","payloadVersion":1,"from":"/appliance/1806299596727829081434298f15a991/publish","timestamp":1539602435,"timestampMs":427,"sign":"f33bb034ac2d5d39289e6fa3dcead081"},"payload":{"togglex":[{"channel":0,"onoff":0,"lmTime":1539602434},{"channel":1,"onoff":0,"lmTime":1539602434},{"channel":2,"onoff":0,"lmTime":1539602434},{"channel":3,"onoff":0,"lmTime":1539602434},{"channel":4,"onoff":0,"lmTime":1539602434}]}}

            // If the message is the RESP for some previous action, process return the control to the "stopped" method.
            if (this.waitingMessageIds[message.header.messageId]) {
                if (this.waitingMessageIds[message.header.messageId].timeout) {
                    clearTimeout(this.waitingMessageIds[message.header.messageId].timeout);
                }
                this.waitingMessageIds[message.header.messageId].callback(null, message.payload || message);
                delete this.waitingMessageIds[message.header.messageId];
            }
            else if (message.header.method === "PUSH") { // Otherwise process it accordingly
                const namespace = message.header ? message.header.namespace : '';
                this.emit('data', namespace, message.payload || message);
            }
        });
        this.client.on('error', (error) => {
            this.emit('error', error.toString());
        });
        this.client.on('close', (error) => {
            this.emit('close', error.toString());
        });
        this.client.on('reconnect', () => {
            this.emit('reconnect');
        });

        // mqtt.Client#end([force], [options], [cb])
        // mqtt.Client#reconnect()
    }

    publishMessage(method, namespace, payload, callback) {
        // if not subscribed und so ...
        const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
        const timestamp = Math.round(new Date().getTime() / 1000);  //int(round(time.time()))

        const signature = crypto.createHash('md5').update(messageId + this.key + timestamp).digest("hex");

        const data = {
            "header": {
                "from": this.clientResponseTopic,
                "messageId": messageId, // Example: "122e3e47835fefcd8aaf22d13ce21859"
                "method": method, // Example: "GET",
                "namespace": namespace, // Example: "Appliance.System.All",
                "payloadVersion": 1,
                "sign": signature, // Example: "b4236ac6fb399e70c3d61e98fcb68b74",
                "timestamp": timestamp
            },
            "payload": payload
        };
        //console.log('clientRequestTopic --> ' + JSON.stringify(data));
        this.client.publish(this.clientRequestTopic, JSON.stringify(data));
        if (callback) {
            this.waitingMessageIds[messageId] = {};
            this.waitingMessageIds[messageId].callback = callback;
            this.waitingMessageIds[messageId].timeout = setTimeout(() => {
                //console.log('TIMEOUT');
                if (this.waitingMessageIds[messageId].callback) {
                    this.waitingMessageIds[messageId].callback(new Error('Timeout'));
                }
                delete this.waitingMessageIds[messageId];
            }, 20000);
        }
        return messageId;
    }



    getSystemAllData(callback) {
        // {"all":{"system":{"hardware":{"type":"mss425e","subType":"eu","version":"2.0.0","chipType":"mt7682","uuid":"1806299596727829081434298f15a991","macAddress":"34:29:8f:15:a9:91"},"firmware":{"version":"2.1.2","compileTime":"2018/08/13 10:42:53 GMT +08:00","wifiMac":"34:31:c4:73:3c:7f","innerIp":"192.168.178.86","server":"iot.meross.com","port":2001,"userId":64416},"time":{"timestamp":1539612975,"timezone":"Europe/Berlin","timeRule":[[1521939600,7200,1],[1540688400,3600,0],[1553994000,7200,1],[1572138000,3600,0],[1585443600,7200,1],[1603587600,3600,0],[1616893200,7200,1],[1635642000,3600,0],[1648342800,7200,1],[1667091600,3600,0],[1679792400,7200,1],[1698541200,3600,0],[1711846800,7200,1],[1729990800,3600,0],[1743296400,7200,1],[1761440400,3600,0],[1774746000,7200,1],[1792890000,3600,0],[1806195600,7200,1],[1824944400,3600,0]]},"online":{"status":1}},"digest":{"togglex":[{"channel":0,"onoff":0,"lmTime":1539608841},{"channel":1,"onoff":0,"lmTime":1539608841},{"channel":2,"onoff":0,"lmTime":1539608841},{"channel":3,"onoff":0,"lmTime":1539608841},{"channel":4,"onoff":0,"lmTime":1539608841}],"triggerx":[],"timerx":[]}}}

        return this.publishMessage("GET", "Appliance.System.All", {}, callback);
    }

    getSystemDebug(callback) {
        // {"debug":{"system":{"version":"2.1.2","sysUpTime":"114h16m34s","localTimeOffset":7200,"localTime":"Mon Oct 15 16:23:03 2018","suncalc":"7:42;19:49"},"network":{"linkStatus":"connected","signal":50,"ssid":"ApollonHome","gatewayMac":"34:31:c4:73:3c:7f","innerIp":"192.168.178.86","wifiDisconnectCount":1},"cloud":{"activeServer":"iot.meross.com","mainServer":"iot.meross.com","mainPort":2001,"secondServer":"smart.meross.com","secondPort":2001,"userId":64416,"sysConnectTime":"Mon Oct 15 08:06:40 2018","sysOnlineTime":"6h16m23s","sysDisconnectCount":5,"pingTrace":[]}}}
        return this.publishMessage("GET", "Appliance.System.Debug", {}, callback);
    }

    getSystemAbilities(callback) {
        // {"payloadVersion":1,"ability":{"Appliance.Config.Key":{},"Appliance.Config.WifiList":{},"Appliance.Config.Wifi":{},"Appliance.Config.Trace":{},"Appliance.System.All":{},"Appliance.System.Hardware":{},"Appliance.System.Firmware":{},"Appliance.System.Debug":{},"Appliance.System.Online":{},"Appliance.System.Time":{},"Appliance.System.Ability":{},"Appliance.System.Runtime":{},"Appliance.System.Report":{},"Appliance.System.Position":{},"Appliance.System.DNDMode":{},"Appliance.Control.Multiple":{"maxCmdNum":5},"Appliance.Control.ToggleX":{},"Appliance.Control.TimerX":{"sunOffsetSupport":1},"Appliance.Control.TriggerX":{},"Appliance.Control.Bind":{},"Appliance.Control.Unbind":{},"Appliance.Control.Upgrade":{},"Appliance.Digest.TriggerX":{},"Appliance.Digest.TimerX":{}}}
        return this.publishMessage("GET", "Appliance.System.Ability", {}, callback);
    }

    getSystemReport(callback) {
        return this.publishMessage("GET", "Appliance.System.Report", {}, callback);
    }


    getConfigWifiList(callback) {
        // {"wifiList":[]}
        return this.publishMessage("GET", "Appliance.Config.WifiList", {}, callback);
    }

    getConfigTrace(callback) {
        // {"trace":{"ssid":"","code":0,"info":""}}
        return this.publishMessage("GET", "Appliance.Config.Trace", {}, callback);
    }


    getControlPowerConsumptionX(callback) {
        return this.publishMessage("GET", "Appliance.Control.ConsumptionX", {}, callback);
    }

    getControlElectricity(callback) {
        return this.publishMessage("GET", "Appliance.Control.Electricity", {}, callback);
    }

    controlToggle(channel, onoff, callback) {
        const payload = {"channel": channel, "toggle": {"onoff": onoff ? 1 : 0}};
        return this.publishMessage("SET", "Appliance.Control.Toggle", payload, callback);
    }

    controlToggleX(channel, onoff, callback) {
        const payload = {"togglex": {"channel": channel, "onoff": onoff ? 1 : 0}};
        return this.publishMessage("SET", "Appliance.Control.ToggleX", payload, callback);
    }

}

module.exports = MerossCloud;
