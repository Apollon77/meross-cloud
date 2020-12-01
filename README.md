# meross-cloud

[![NPM version](http://img.shields.io/npm/v/meross-cloud.svg)](https://www.npmjs.com/package/meross-cloud)
[![Downloads](https://img.shields.io/npm/dm/meross-cloud.svg)](https://www.npmjs.com/package/meross-cloud)
[![Code Climate](https://codeclimate.com/github/Apollon77/meross-cloud/badges/gpa.svg)](https://codeclimate.com/github/Apollon77/meross-cloud)

**Tests:**
[![Test Coverage](https://codeclimate.com/github/Apollon77/meross-cloud/badges/coverage.svg)](https://codeclimate.com/github/Apollon77/meross-cloud/coverage)
Linux/Mac/Windows:
[![Travis-CI](http://img.shields.io/travis/Apollon77/meross-cloud/master.svg)](https://travis-ci.org/Apollon77/meross-cloud)
Windows: [![AppVeyor](https://ci.appveyor.com/api/projects/status/github/Apollon77/meross-cloud?branch=master&svg=true)](https://ci.appveyor.com/project/Apollon77/meross-cloud/)

[![NPM](https://nodei.co/npm/meross-cloud.png?downloads=true)](https://nodei.co/npm/meross-cloud/)

This library allows to login into Meross cloud server, read the registered devices and open connections to the MQTT cloud server to get the datatosign

## Example

see example folder

## Todo
* Experiment with multiple MQTT connections vs only one and maybe optimize

## Credits
The library is partially based on the Python project https://github.com/albertogeniola/MerossIot, Thank you for this great basic work on how to connect to the Meross Cloud Servers

## Changelog

### __WORK IN PROGRESS__
* generate an unique uuid for each connection

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
