"use strict";
var moment = require('moment');
var shell = require('shelljs');
var HBFakeGarageDoor = (function () {
    function HBFakeGarageDoor(log, dAPI, dDevices, storage, config) {
        this.log = log;
        this.dAPI = dAPI;
        this.log.debug('%s > Initializing', this.constructor.name);
        for (var i = 0; i < dDevices.length; i++) {
            if (dDevices[i].name == config.fakeGaragedoorParams.doorDevice)
                this.dDoorDevice = dDevices[i];
            else if (dDevices[i].name == config.fakeGaragedoorParams.relayDevice)
                this.dRelayDevice = dDevices[i];
        }
        this.name = this.dDoorDevice.name;
        this.uuid_base = this.dDoorDevice.id;
        this.storage = storage;
        this.config = config;
        //TODO: add on change listeners
    }
    HBFakeGarageDoor.prototype.setHomebridge = function (homebridge) {
        this.Homebridge = homebridge;
        this.Service = homebridge.hap.Service;
        this.Characteristic = homebridge.hap.Characteristic;
    };
    HBFakeGarageDoor.prototype.accessories = function () {
        return [];
    };
    HBFakeGarageDoor.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Fake')
            .setCharacteristic(this.Characteristic.Model, 'Garagedoor')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDoorDevice.id.replace('/', '-'));
        this.garageDoorOpenerService = new this.Service.GarageDoorOpener(this.name);
        //TODO: add service configuration
        this.dDoorDevice.listen();
        this.dRelayDevice.listen();
        return [this.informationService, this.garageDoorOpenerService];
    };
    ;
    return HBFakeGarageDoor;
}());
exports.HBFakeGarageDoor = HBFakeGarageDoor;
