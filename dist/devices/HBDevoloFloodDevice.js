"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloFloodDevice = (function (_super) {
    __extends(HBDevoloFloodDevice, _super);
    function HBDevoloFloodDevice(log, dAPI, dDevice, storage) {
        var _this = _super.call(this, log, dAPI, dDevice, storage) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.leakSensorService.getCharacteristic(self.Characteristic.LeakDetected).updateValue(state, null);
        });
        self.dDevice.events.on('onBatteryLevelChanged', function (value) {
            self.log.info('%s (%s / %s) > Battery level > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.BatteryLevel).updateValue(value, null);
        });
        self.dDevice.events.on('onBatteryLowChanged', function (value) {
            self.log.info('%s (%s / %s) > Battery low > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.StatusLowBattery).updateValue(!value, null);
        });
        return _this;
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
        this.dDevice.listen();
        return [this.informationService, this.leakSensorService, this.batteryService];
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
