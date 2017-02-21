"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloFloodDevice = (function (_super) {
    __extends(HBDevoloFloodDevice, _super);
    function HBDevoloFloodDevice() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HBDevoloFloodDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Motion Sensor');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.leakSensorService = new this.Service.LeakSensor();
        this.leakSensorService.getCharacteristic(this.Characteristic.LeakDetected)
            .on('get', this.getLeakDetected.bind(this));
        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
            .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
            .on('get', this.getStatusLowBattery.bind(this));
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.leakSensorService, this.batteryService];
    };
    /* HEARTBEAT */
    HBDevoloFloodDevice.prototype.heartbeat = function (device) {
        this.log.debug('%s > Hearbeat', this.constructor.name);
        var self = this;
        /* Service.LeakSensor */
        var oldState = self.dDevice.getState();
        if (device.getState() != oldState) {
            self.log.info('%s > State %s > %s', this.constructor.name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function (err) { });
            self.leakSensorService.setCharacteristic(self.Characteristic.LeakDetected, device.getState());
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
    HBDevoloFloodDevice.prototype.getLeakDetected = function (callback) {
        this.log.debug('%s > getLeakDetected', this.constructor.name);
        return callback(null, this.dDevice.getState());
    };
    HBDevoloFloodDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s > getBatteryLevel', this.constructor.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloFloodDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s > getStatusLowBattery', this.constructor.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloFloodDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s > getChargingState', this.constructor.name);
        return callback(null, false);
    };
    return HBDevoloFloodDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloFloodDevice = HBDevoloFloodDevice;
