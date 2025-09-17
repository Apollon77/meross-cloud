# meross-cloud


[![NPM version](http://img.shields.io/npm/v/meross-cloud.svg)](https://www.npmjs.com/package/meross-cloud)
[![Downloads](https://img.shields.io/npm/dm/meross-cloud.svg)](https://www.npmjs.com/package/meross-cloud)
![Test and Release](https://github.com/Apollon77/meross-cloud/workflows/Test%20and%20Release/badge.svg)

This library allows to login into Meross cloud server, read the registered devices and open connections to the MQTT cloud server to get the data.
The library tries to control the devices locally first (if "localHttpFirst" option is set to true), else will control via cloud server.

## Disclaimer
**All product and company names or logos are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them or any associated subsidiaries! This personal project is maintained in spare time and has no business goal.**
**MEROSS is a trademark of Chengdu Meross Technology Co., Ltd.**

## Example

see example folder

## Todo
* Experiment with multiple MQTT connections vs only one and maybe optimize
* Find out how reading of Fan and Childlook works :-(

## Credits
The library is partially based on the Python project https://github.com/albertogeniola/MerossIot, Thank you for this great basic work on how to connect to the Meross Cloud Servers

## Changelog
### __WORK IN PROGRESS__
* (Apollon77) BREAKING: Node.js 18.x or higher is required
* (Apollon77) Replace deprecated request library with native fetch

### 3.1.2 (2023-12-30)
* (Apollon77) Enhance some error messages

### 3.1.1 (2023-12-30)
* (Apollon77) Fix crash case_

### 3.1.0 (2023-12-30)
* (Apollon77/bwp91) Adjust Signin API and add support for MFA
* (Apollon77) Allow to store and reuse Login token to avoid Login/MFA requests

### 3.0.1 (2023-11-25)
* (Apollon77) Prevented crash case reported by Sentry

### 3.0.0 (2023-11-25)
* IMPORTANT: Node.js 16.x or higher is required

### 2.4.1 (2023-05-15)
* (Apollon77) Fix an issue when committing devices delayed

### 2.4.0 (2023-01-02)
* (Apollon77) Added controlRollerShutterPosition that might work with Homekit versions of shutter devices
* (Apollon77) Prevented crash case reported by Sentry

### 2.3.1 (2022-09-20)
* (Apollon77) Fix garage door state control

### 2.3.0 (2022-09-19)
* (Apollon77) Add support for additional MAP100 air purifier data

### 2.2.0 (2022-09-04)
* (Apollon77) Add support for FilterMaintenance data of MAP100 air purifier
* (Apollon77) Fix typings: messageId returned by many calls is a string and not a number

### 2.1.3 (2022-08-12)
* (Apollon77) Prevent some crash cases reported by Sentry

### 2.1.2 (2022-08-12)
* (JackReevies) Remove not needed console logging

### 2.1.1 (2022-07-12)
* (Apollon77) Fix new logic

### 2.1.0 (2022-07-12)
* (Apollon77) Add new option to define that GET requests are only tried locally and not resend to cloud on error.

### 2.0.0 (2022-06-27)
* (Apollon77) Major change: the error event emitted on MerossCloud instance has now as first parameter the error info and second an optional device id!! Before this was partially switched

### 1.9.1 (2022-06-27)
* (Apollon77) Also emit an error event if publishing an MQTT message fails

### 1.9.0 (2022-06-19)
* (Apollon77) Detect MQTT reconnect issue "Server unavailable" and reinitialize the MQTT connection completely - this case is silently handled as reconnect!

### 1.8.1 (2022-05-31)
* (Apollon77) Add timeout parameter to options to use as request timeout. For MQTT data requests the timeout is doubled
* (Apollon77) Lower the MQTT timeout from 20s to 6s. Can be increased using timeout parameter again if needed

### 1.7.4 (2022-04-14)
* (Apollon77) Adjust to recent API changes from Meross services

### 1.7.2 (2022-02-19)
* (Apollon77) Fix pot. crash case

### 1.7.1 (2022-01-26)
* (Apollon77) Fix pot. crash case

### 1.7.0 (2022-01-20)
* (Apollon77) Add option to the library to try to communicate to the device locally using HTTP if the IP is known (or retrieved using getSystemAllData). If a call is not answered via HTTP within 3s the value is sent via MQTT. See above for more details
* (Apollon77) Restructure library so that only one MQTT connection is used: Effect ist that the "connect()" and "disconnect()" methods are only activating or deactivating if messages are emitted/answered or not!
* (Apollon77) Add Logout method. Please use to tear down a session at the end (Meross is monitoring too many open sessions)

### 1.6.0 (2022-01-05)
* (Apollon77) Add support for MTS200 Wifi Thermostat

### 1.5.0 (2021-11-13)
* Add support for MTS150 Thermostats
* Add support for MRS100 RollerShutter devices
* update typescript definitions

### 1.4.0 (2021-04-18)
* add MOD100 Diffuser Spray device

### 1.3.6 (2020-12-05)
* generate an unique uuid for each connection, fixes the "Server not available"

### 1.3.5 (2020-06-11)
* update dependencies

### 1.3.4 (2020-04-12)
* add typings (thanks to @colthreepv)
* prevent some error cases

### 1.3.3 (2019-12-01)
* handle error cases

### 1.3.2 (2019-11-28)
* handle error cases

### 1.3.1 (2019-11-28)
* handle error cases

### 1.3.0
* more fixes for garage door opener
* better support lights
* reconnection fixes
* support for hub devices

### 1.2.1
* try to fix garage door opener

### 1.2.0
* add read/write DND-Mode (Device LED)
* add read SystemRuntime (Wifi Strength)

### 1.1.0
* add Light Support

### 1.0.0
* move to 1.0.0

### 0.3.2
* (Apollon77) fix message handling and ignore messages posted by other devices

### 0.3.1
* (Apollon77) add rawData event to allow better debugging

### 0.3.0
* (Apollon77) Add more functions for mss310 devices

### 0.2.0
* (Apollon77) implement all functionalities for adapter

### 0.1.0
* (Apollon77) initial first release
