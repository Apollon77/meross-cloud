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
const { v4: uuidv4 } = require('uuid');
const { getErrorMessage } = require('./lib/errorcodes');

const SECRET = '23x17ahWarFH6w29';
const MEROSS_URL = 'https://iot.meross.com';
const LOGIN_URL = `${MEROSS_URL}/v1/Auth/Login`;
const LOGOUT_URL = `${MEROSS_URL}/v1/Profile/logout`;
const DEV_LIST = `${MEROSS_URL}/v1/Device/devList`;
const SUBDEV_LIST = `${MEROSS_URL}/v1/Hub/getSubDevices`;

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
        localHttpFirst
        timeout
    */

    constructor(options) {
        super();

        this.options = options || {};
        this.token = null;
        this.key = null;
        this.userId = null;
        this.userEmail = null;
        this.authenticated = false;

        this.localHttpFirst = !!options.localHttpFirst;
        this.onlyLocalForGet = this.localHttpFirst ? !!options.onlyLocalForGet : false;

        this.timeout = options.timeout || 10000;

        this.mqttConnections = {};
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
            "Authorization": `Basic ${this.token || ''}`,
            "vender": "meross",
            "AppVersion": "0.4.4.4",
            "AppType": "MerossIOT",
            "AppLanguage": "EN",
            "User-Agent": "MerossIOT/0.4.4.4"
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
            form: payload,
            timeout: this.timeout
        };
        this.options.logger &&  this.options.logger(`HTTP-Call: ${JSON.stringify(options)}`);
        // Perform the request.
        request(options, (error, response, body) => {
            if (!error && response && response.statusCode === 200 && body) {
                this.options.logger && this.options.logger(`HTTP-Response OK: ${body}`);
                try {
                    body = JSON.parse(body);
                }
                catch (err) {
                    body = {};
                }

                if (body.apiStatus === 0) {
                    return callback && callback(null, body.data);
                }
                return callback && callback(new Error(`${body.apiStatus} (${getErrorMessage(body.apiStatus)})${body.info ? ` - ${body.info}` : ''}`));
            }
            this.options.logger && this.options.logger(`HTTP-Response Error: ${error} / Status=${response ? response.statusCode : '--'}`);
            return callback && callback(error);
        });
    }

    connectDevice(deviceObj, dev) {
        const deviceId = dev.uuid;
        this.devices[deviceId] = deviceObj;
        this.devices[deviceId].on('connected', () => {
            this.emit('connected', deviceId);
        });
        this.devices[deviceId].on('close', (error) => {
            this.emit('close', deviceId, error);
        });
        this.devices[deviceId].on('error', (error) => {
            if (!this.listenerCount('error')) return;
            this.emit('error', error, deviceId);
        });
        this.devices[deviceId].on('reconnect', () => {
            this.emit('reconnect', deviceId);
        });
        this.devices[deviceId].on('data', (namespace, payload) => {
            this.emit('data', deviceId, namespace, payload);
        });
        this.devices[deviceId].on('rawData', (message) => {
            this.emit('rawData', deviceId, message);
        });
        this.emit('deviceInitialized', deviceId, dev, this.devices[deviceId]);

        this.initMqtt(dev);
        this.devices[deviceId].connect();
    }

    connect(callback) {
        if (!this.options.email) {
            return callback && callback(new Error('Email missing'));
        }
        if (!this.options.password) {
            return callback && callback(new Error('Password missing'));
        }
        const logIdentifier = generateRandomString(30) + uuidv4();
        //'0b11b194f83724b614a6975b112f63cee2f098-8125-40c7-a280-5115913d9887';// '%030x' % random.randrange(16 ** 30) + str(uuid.uuid4())
        // 54dp8pv70pz0a94ye8c1q5j13nhtb55dc30135-0cd6-4801-bc13-8608120b05d6
        // aa965f72dc01d414d8efa8360bade3  36894452-c55b-4f10-8ca3-c60edba97728
        const data = {
            email: this.options.email,
            password: this.options.password,
            mobileInfo: {
                "deviceModel": "",
                "mobileOsVersion": "",
                "mobileOs": process.platform,
                "uuid": logIdentifier,
                "carrier":""
            }
        };
        //console.log(JSON.stringify(data));

        this.authenticatedPost(LOGIN_URL, data, (err, loginResponse) => {
            //console.log(loginResponse);
            if (err) {
                callback && callback(err);
                return;
            }
            if (!loginResponse) {
                callback && callback(new Error('No valid Login Response data received'));
                return;
            }
            this.token = loginResponse.token;
            this.key = loginResponse.key;
            this.userId = loginResponse.userid;
            this.userEmail = loginResponse.email;
            this.authenticated = true;

            this.authenticatedPost(DEV_LIST, {}, (err, deviceList) => {
                //console.log(JSON.stringify(deviceList, null, 2));

                let initCounter = 0;
                let deviceListLength = 0;
                if (deviceList && Array.isArray(deviceList)) {
                    deviceListLength = deviceList.length;
                    deviceList.forEach((dev) => {
                        //const deviceType = dev.deviceType;
                        if (dev.deviceType.startsWith('msh300')) {
                            this.options.logger && this.options.logger(`${dev.uuid} Detected Hub`);
                            this.authenticatedPost(SUBDEV_LIST, {uuid: dev.uuid}, (err, subDeviceList) => {
                                this.connectDevice(new MerossCloudHubDevice(this, dev, subDeviceList), dev);
                                initCounter++;
                                if (initCounter === deviceListLength) callback && callback(null, deviceListLength);
                            });
                        } else {
                            this.connectDevice(new MerossCloudDevice(this, dev), dev);
                            initCounter++;
                        }
                    });
                }

                if (initCounter === deviceListLength) callback && callback(null, deviceListLength);
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

    logout(callback) {
        if (!this.authenticated || !this.token) {
            return callback && callback(new Error('Not authenticated'));
        }
        this.authenticatedPost(LOGOUT_URL, {}, (err, logoutResponse) => {
            //console.log(logoutResponse);
            if (err) {
                callback && callback(err);
                return;
            }
            this.token = null;
            this.key = null;
            this.userId = null;
            this.userEmail = null;
            this.authenticated = false;

            callback && callback();
        });
    }

    getDevice(uuid) {
        return this.devices[uuid];
    }

    disconnectAll(force) {
        for (const deviceId in this.devices) {
            if (!this.devices.hasOwnProperty(deviceId)) continue;
            this.devices[deviceId].disconnect(force);
        }
        for (const domain of Object.keys(this.mqttConnections)) {
            this.mqttConnections[domain].client.end(force);
        }
    }

    initMqtt(dev) {
        const domain = dev.domain || "eu-iot.meross.com"; // reservedDomain ???
        if (!this.mqttConnections[domain] || !this.mqttConnections[domain].client) {
            const appId = crypto.createHash('md5').update(`API${uuidv4()}`).digest("hex");
            const clientId = `app:${appId}`;

            // Password is calculated as the MD5 of USERID concatenated with KEY
            const hashedPassword = crypto.createHash('md5').update(this.userId + this.key).digest("hex");

            if (!this.mqttConnections[domain]) {
                this.mqttConnections[domain] = {};
            }
            if (this.mqttConnections[domain].client) {
                this.mqttConnections[domain].client.end(true);
            }
            this.mqttConnections[domain].client = mqtt.connect({
                'protocol': 'mqtts',
                'host': domain,
                'port': 2001,
                'clientId': clientId,
                'username': this.userId,
                'password': hashedPassword,
                'rejectUnauthorized': true,
                'keepalive': 30,
                'reconnectPeriod': 5000
            });
            this.mqttConnections[domain].deviceList = this.mqttConnections[domain].deviceList || [];
            if (!this.mqttConnections[domain].deviceList.includes(dev.uuid)) {
                this.mqttConnections[domain].deviceList.push(dev.uuid);
            }

            this.mqttConnections[domain].client.on('connect', () => {
                //console.log("Connected. Subscribe to user topics");

                this.mqttConnections[domain].client.subscribe(`/app/${this.userId}/subscribe`, (err) => {
                    if (err) {
                        this.emit('error', err);
                    }
                    //console.log('User Subscribe Done');
                });

                this.clientResponseTopic = `/app/${this.userId}-${appId}/subscribe`;

                this.mqttConnections[domain].client.subscribe(this.clientResponseTopic, (err) => {
                    if (err) {
                        this.emit('error', err);
                    }
                    //console.log('User Response Subscribe Done');
                });

                this.mqttConnections[domain].deviceList.forEach(devId => {
                    this.devices[devId] && this.devices[devId].emit(this.mqttConnections[domain].silentReInitialization ? 'reconnect' : 'connected');
                });
                this.mqttConnections[domain].silentReInitialization = false;
            });

            this.mqttConnections[domain].client.on('error', (error) => {
                if (error && error.toString().includes('Server unavailable')) {
                    this.mqttConnections[domain].silentReInitialization = true;
                    this.mqttConnections[domain].client.end(true);
                    if (this.mqttConnections[domain].deviceList.length) {
                        setImmediate(() => {
                            this.mqttConnections[domain].client = null;
                            this.initMqtt(this.devices[this.mqttConnections[domain].deviceList[0]]);
                        });
                    }
                }
                this.mqttConnections[domain].deviceList.forEach(devId => {
                    this.devices[devId] && this.devices[devId].emit('error', error ? error.toString() : null);
                });
            });
            this.mqttConnections[domain].client.on('close', (error) => {
                if (this.mqttConnections[domain].silentReInitialization) {
                    return;
                }
                this.mqttConnections[domain].deviceList.forEach(devId => {
                    this.devices[devId] && this.devices[devId].emit('close', error ? error.toString() : null);
                });
            });
            this.mqttConnections[domain].client.on('reconnect', () => {
                this.mqttConnections[domain].deviceList.forEach(devId => {
                    this.devices[devId] && this.devices[devId].emit('reconnect');
                });
            });

            this.mqttConnections[domain].client.on('message', (topic, message) => {
                if (!message) return;
                // message is Buffer
                //console.log(topic + ' <-- ' + message.toString());
                try {
                    message = JSON.parse(message.toString());
                } catch (err) {
                    this.emit('error', `JSON parse error: ${err}`);
                    return;
                }

                if (!message.header.from) return;
                const fromArr = message.header.from.split('/');
                if (this.devices[fromArr[2]]) {
                    this.devices[fromArr[2]].handleMessage(message);
                }
            });

        } else {
            if (!this.mqttConnections[domain].deviceList.includes(dev.uuid)) {
                this.mqttConnections[domain].deviceList.push(dev.uuid);
            }
            if (this.mqttConnections[domain].client.connected) {
                setImmediate(() => {
                    this.devices[dev] && this.devices[dev].emit('connected');
                });
            }
        }
    }

    sendMessageMqtt(dev, data) {
        if (!this.mqttConnections[dev.domain] || ! this.mqttConnections[dev.domain].client) {
            return false;
        }

        this.options.logger &&  this.options.logger(`MQTT-Cloud-Call ${dev.uuid}: ${JSON.stringify(data)}`);
        this.mqttConnections[dev.domain].client.publish(`/appliance/${dev.uuid}/subscribe`, JSON.stringify(data), undefined, err => {
            if (err) {
                this.devices[dev.uuid] && this.devices[dev.uuid].emit('error', err);
            }
        });
        return true;
    }

    sendMessageHttp(dev, ip, payload, callback) {
        const options = {
            url: `http://${ip}/config`,
            method: 'POST',
            json: payload,
            timeout: this.timeout
        };
        this.options.logger &&  this.options.logger(`HTTP-Local-Call ${dev.uuid}: ${JSON.stringify(options)}`);
        // Perform the request.
        request(options, (error, response, body) => {
            if (!error && response && response.statusCode === 200 && body) {
                this.options.logger && this.options.logger(`HTTP-Local-Response OK ${dev.uuid}: ${JSON.stringify(body)}`);
                if (body) {
                    setImmediate(() => {
                        this.devices[dev.uuid].handleMessage(body);
                    })
                    return callback && callback(null);
                }
                return callback && callback(new Error(`${body.apiStatus}: ${body.info}`));
            }
            this.options.logger && this.options.logger(`HTTP-Local-Response Error ${dev.uuid}: ${error} / Status=${response ? response.statusCode : '--'}`);
            return callback && callback(error);
        });
    }

    encodeMessage(method, namespace, payload) {
        const messageId = crypto.createHash('md5').update(generateRandomString(16)).digest("hex");
        const timestamp = Math.round(new Date().getTime() / 1000);  //int(round(time.time()))

        const signature = crypto.createHash('md5').update(messageId + this.key + timestamp).digest("hex");

        return {
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
    }

    sendMessage(dev, ip, data, callback) {
        if (this.localHttpFirst && ip) {
            this.sendMessageHttp(dev, ip, data, err => {
                let res = !err;
                const isGetMessage = data && data.header && data.header.method === 'GET';
                let resendToCloud = !isGetMessage || (isGetMessage && !this.onlyLocalForGet);
                if (err && resendToCloud) {
                    res = this.sendMessageMqtt(dev, data);
                }
                callback && callback(res);
            })
        } else {
            callback && callback(this.sendMessageMqtt(dev, data));
        }
    }
}

class MerossCloudDevice extends EventEmitter {

    constructor(cloudInstance, dev) {
        super();

        this.clientResponseTopic = null;
        this.waitingMessageIds = {};

        this.dev = dev;
        this.cloudInst = cloudInstance;

        this.deviceConnected = false;
    }

    handleMessage(message) {
        if (!this.deviceConnected) return;
        if (!message || !message.header) return;
        if (message && message.header && message.header.from && !message.header.from.includes(this.dev.uuid)) return;
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
        this.emit('rawData', message);
    }

    /**
     * @deprecated
     */
    connect() {
        this.deviceConnected = true;
    }

    /**
     * @deprecated
     */
    disconnect() {
        this.deviceConnected = false;
    }

    setKnownLocalIp(ip) {
        this.knownLocalIp = ip;
    }

    removeKnownLocalIp() {
        this.knownLocalIp = '';
    }

    publishMessage(method, namespace, payload, callback) {
        const data = this.cloudInst.encodeMessage(method, namespace, payload);
        const messageId = data.header.messageId;
        this.cloudInst.sendMessage(this.dev, this.knownLocalIp, data, res => {
            if (!res) {
                return callback && callback(new Error('Device has no data connection available'));
            }
            if (callback) {
                this.waitingMessageIds[messageId] = {};
                this.waitingMessageIds[messageId].callback = callback;
                this.waitingMessageIds[messageId].timeout = setTimeout(() => {
                    //console.log('TIMEOUT');
                    if (this.waitingMessageIds[messageId].callback) {
                        this.waitingMessageIds[messageId].callback(new Error('Timeout'));
                    }
                    delete this.waitingMessageIds[messageId];
                }, this.cloudInst.timeout * 2);
            }
            this.emit('rawSendData', data);
        });
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

    getSystemRuntime(callback) { // Wifi Strength
        // "payload": {
        // 		"runtime": {
        // 			"signal": 86
        // 		}
        // 	}
        return this.publishMessage("GET", "Appliance.System.Runtime", {}, callback);
    }

    getSystemDNDMode(callback) { // DND Mode (LED)
        // "payload": {
        // 		"DNDMode": {
        // 			"mode": 0
        // 		}
        // 	}
        return this.publishMessage("GET", "Appliance.System.DNDMode", {}, callback);
    }

    setSystemDNDMode(onoff, callback) {
        const payload = {"DNDMode": {"mode": onoff ? 1 : 0}};
        return this.publishMessage("SET", "Appliance.System.DNDMode", payload, callback);
    }


    getOnlineStatus(callback) {
        return this.publishMessage("GET", "Appliance.System.Online", {}, callback);
    }

    getConfigWifiList(callback) {
        // {"wifiList":[]}
        return this.publishMessage("GET", "Appliance.Config.WifiList", {}, callback);
    }

    getConfigTrace(callback) {
        // {"trace":{"ssid":"","code":0,"info":""}}
        return this.publishMessage("GET", "Appliance.Config.Trace", {}, callback);
    }

    getControlPowerConsumption(callback) {
        return this.publishMessage("GET", "Appliance.Control.Consumption", {}, callback);
    }

    getControlPowerConsumptionX(callback) {
        return this.publishMessage("GET", "Appliance.Control.ConsumptionX", {}, callback);
    }

    getControlElectricity(callback) {
        return this.publishMessage("GET", "Appliance.Control.Electricity", {}, callback);
    }

    controlToggle(onoff, callback) {
        const payload = {"toggle": {"onoff": onoff ? 1 : 0}};
        return this.publishMessage("SET", "Appliance.Control.Toggle", payload, callback);
    }

    controlToggleX(channel, onoff, callback) {
        const payload = {"togglex": {"channel": channel, "onoff": onoff ? 1 : 0}};
        return this.publishMessage("SET", "Appliance.Control.ToggleX", payload, callback);
    }

    controlSpray(channel, mode, callback) {
        const payload = {"spray": {"channel": channel, "mode": mode || 0}};
        return this.publishMessage("SET", "Appliance.Control.Spray", payload, callback);
    }

    controlRollerShutterUp(channel, callback) {
        const payload = {"position": {"position": 100, "channel": channel}};
        return this.publishMessage("SET", "Appliance.RollerShutter.Position", payload, callback);
    }

    controlRollerShutterDown(channel, callback) {
        const payload = {"position": {"position": 0, "channel": channel}};
        return this.publishMessage("SET", "Appliance.RollerShutter.Position", payload, callback);
    }

    controlRollerShutterStop(channel, callback) {
        const payload = {"position": {"position": -1, "channel": channel}};
        return this.publishMessage("SET", "Appliance.RollerShutter.Position", payload, callback);
    }

    getRollerShutterState(callback) {
        return this.publishMessage("GET", "Appliance.RollerShutter.State", {}, callback);
    }

    getRollerShutterPosition(callback) {
        return this.publishMessage("GET", "Appliance.RollerShutter.Position", {}, callback);
    }

    controlGarageDoor(channel, open, callback) {
        const payload = {"state": {"channel": channel, "open": open ? 1 : 0, "uuid": this.dev.uuid}};
        return this.publishMessage("SET", "Appliance.GarageDoor.State", payload, callback);
    }

    // {"light":{"capacity":6,"channel":0,"rgb":289,"temperature":80,"luminance":100}}
    controlLight(light, callback) {
        const payload = {"light": light};
        return this.publishMessage("SET", "Appliance.Control.Light", payload, callback);
    }

    controlDiffusorSpray(type, channel, mode, callback) {
        const payload = {"spray": [{"channel": channel, "mode": mode || 0, "uuid": this.dev.uuid}]};
        return this.publishMessage("SET", "Appliance.Control.Diffuser.Spray", payload, callback);
    }

    controlDiffusorLight(type, light, callback) {
        light.uuid = this.dev.uuid;
        const payload = {"light": [light]};
        return this.publishMessage("SET", "Appliance.Control.Diffuser.Light", payload, callback);
    }

    controlThermostatMode(channel, modeData, callback) {
        modeData.channel = channel;
        const payload = {"mode": [modeData]};
        return this.publishMessage("SET", "Appliance.Control.Thermostat.Mode", payload, callback);
    }

}


class MerossCloudHubDevice extends MerossCloudDevice {

    constructor(cloudInstance, dev, subDeviceList) {
        super(cloudInstance, dev);

        this.subDeviceList = subDeviceList;
    }

    getHubBattery(callback) {
        const payload = {"battery": []};
        return this.publishMessage("GET", "Appliance.Hub.Battery", payload, callback);
    }

    getMts100All(ids, callback) {
        const payload = {"all": []};
        ids.forEach(id => payload.all.push({id: id}));
        return this.publishMessage("GET", "Appliance.Hub.Mts100.All", payload, callback);
    }

    controlHubToggleX(subId, onoff, callback) {
        const payload = {"togglex": [{"id": subId, "onoff": onoff ? 1 : 0}]};
        return this.publishMessage("SET", "Appliance.Hub.ToggleX", payload, callback);
    }

    controlHubMts100Mode(subId, mode, callback) {
        const payload = {"mode": [{"id": subId, "state": mode}]};
        return this.publishMessage("SET", "Appliance.Hub.Mts100.Mode", payload, callback);
    }

    controlHubMts100Temperature(subId, temp, callback) {
        temp.id = subId;
        const payload = {"temperature": [temp]};
        return this.publishMessage("SET", "Appliance.Hub.Mts100.Temperature", payload, callback);
    }

}

module.exports = MerossCloud;
