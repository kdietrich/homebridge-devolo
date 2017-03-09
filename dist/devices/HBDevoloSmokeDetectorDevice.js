"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloSmokeDetectorDevice = (function (_super) {
    __extends(HBDevoloSmokeDetectorDevice, _super);
    function HBDevoloSmokeDetectorDevice() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HBDevoloSmokeDetectorDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Smoke Detector');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.smokeSensorService = new this.Service.SmokeSensor();
        this.smokeSensorService.getCharacteristic(this.Characteristic.SmokeDetected)
            .on('get', this.getSmokeDetected.bind(this));
        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
            .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
            .on('get', this.getStatusLowBattery.bind(this));
        return [this.informationService, this.smokeSensorService, this.batteryService];
    };
    /* HEARTBEAT */
    HBDevoloSmokeDetectorDevice.prototype.heartbeat = function (device) {
        this.log.debug('%s > Hearbeat', this.constructor.name);
        var self = this;
        /* Service.SmokeSensor */
        var oldState = self.dDevice.getState();
        if (device.getState() != oldState) {
            self.log.info('%s > State %s > %s', this.constructor.name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function (err) { });
            self.smokeSensorService.setCharacteristic(self.Characteristic.SmokeDetected, device.getState());
        }
        /* Service.BatteryService */
        var oldBatteryLevel = self.dDevice.getBatteryLevel();
        if (device.getBatteryLevel() != oldBatteryLevel) {
            self.log.info('%s > Battery level %s > %s', this.constructor.name, oldBatteryLevel, device.getBatteryLevel());
            self.dDevice.setBatteryLevel(device.getBatteryLevel());
            self.batteryService.setCharacteristic(self.Characteristic.BatteryLevel, device.getBatteryLevel());
        }
        var oldBatteryLow = self.dDevice.getBatteryLow();
        if (device.getBatteryLow() != oldBatteryLow) {
            self.log.info('%s > Battery low %s > %s', this.constructor.name, oldBatteryLow, device.getBatteryLow());
            self.dDevice.setBatteryLow(device.getBatteryLow());
            self.batteryService.setCharacteristic(self.Characteristic.StatusLowBattery, !device.getBatteryLow());
        }
    };
    HBDevoloSmokeDetectorDevice.prototype.getSmokeDetected = function (callback) {
        this.log.debug('%s > getSmokeDetected', this.constructor.name);
        return callback(null, this.dDevice.getState());
    };
    HBDevoloSmokeDetectorDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s > getBatteryLevel', this.constructor.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloSmokeDetectorDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s > getStatusLowBattery', this.constructor.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloSmokeDetectorDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s > getChargingState', this.constructor.name);
        return callback(null, false);
    };
    return HBDevoloSmokeDetectorDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSmokeDetectorDevice = HBDevoloSmokeDetectorDevice;
