# meross-cloud


[![NPM version](http://img.shields.io/npm/v/meross-cloud.svg)](https://www.npmjs.com/package/meross-cloud)
[![Downloads](https://img.shields.io/npm/dm/meross-cloud.svg)](https://www.npmjs.com/package/meross-cloud)
![Test and Release](https://github.com/Apollon77/meross-cloud/workflows/Test%20and%20Release/badge.svg)

This library allows to login into Meross cloud server, read the registered devices and open connections to the MQTT cloud server to get the datatosign

## Example

see example folder

## Todo
* Experiment with multiple MQTT connections vs only one and maybe optimize

## Credits
The library is partially based on the Python project https://github.com/albertogeniola/MerossIot, Thank you for this great basic work on how to connect to the Meross Cloud Servers

## Changelog
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
