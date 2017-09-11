"use strict";
var HBDevoloDevice = (function () {
    function HBDevoloDevice(log, dAPI, dDevice) {
        this.log = log;
        this.dAPI = dAPI;
        this.dDevice = dDevice;
        this.log.debug('%s > Initializing', this.constructor.name);
        this.name = this.dDevice.name;
        this.uuid_base = this.dDevice.id;
    }
    HBDevoloDevice.prototype.setHomebridge = function (homebridge) {
        this.Homebridge = homebridge;
        this.Service = homebridge.hap.Service;
        this.Characteristic = homebridge.hap.Characteristic;
    };
    HBDevoloDevice.prototype.accessories = function () {
        return [];
    };
    HBDevoloDevice.prototype.getServices = function () {
        return [];
    };
    ;
    return HBDevoloDevice;
}());
exports.HBDevoloDevice = HBDevoloDevice;
