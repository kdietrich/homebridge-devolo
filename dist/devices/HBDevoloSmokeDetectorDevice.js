"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloSmokeDetectorDevice = (function (_super) {
    __extends(HBDevoloSmokeDetectorDevice, _super);
    function HBDevoloSmokeDetectorDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s) > State > %s', self.constructor.name, self.dDevice.id, state);
            self.smokeSensorService.getCharacteristic(self.Characteristic.SmokeDetected).updateValue(state, null);
        });
        self.dDevice.events.on('onBatteryLevelChanged', function (value) {
            self.log.info('%s (%s) > Battery level > %s', self.constructor.name, self.dDevice.id, value);
            self.batteryService.getCharacteristic(self.Characteristic.BatteryLevel).updateValue(value, null);
        });
        self.dDevice.events.on('onBatteryLowChanged', function (value) {
            self.log.info('%s (%s) > Battery low > %s', self.constructor.name, self.dDevice.id, value);
            self.batteryService.getCharacteristic(self.Characteristic.StatusLowBattery).updateValue(!value, null);
        });
        return _this;
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
        this.dDevice.listen();
        return [this.informationService, this.smokeSensorService, this.batteryService];
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
