"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloDoorWindowDevice = (function (_super) {
    __extends(HBDevoloDoorWindowDevice, _super);
    function HBDevoloDoorWindowDevice() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HBDevoloDoorWindowDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Door Sensor / Window Contact');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.contactSensorService = new this.Service.ContactSensor();
        this.contactSensorService.getCharacteristic(this.Characteristic.ContactSensorState)
            .on('get', this.getContactSensorState.bind(this));
        this.temperatureService = new this.Service.TemperatureSensor(this.name);
        this.temperatureService.getCharacteristic(this.Characteristic.CurrentTemperature)
            .on('get', this.getCurrentTemperature.bind(this));
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
        return [this.informationService, this.contactSensorService, this.temperatureService, this.batteryService];
    };
    /* HEARTBEAT */
    HBDevoloDoorWindowDevice.prototype.heartbeat = function (device) {
        this.log.debug('%s > Hearbeat', this.constructor.name);
        var self = this;
        /* Service.ContactSensor */
        var oldState = self.dDevice.getState();
        if (device.getState() != oldState) {
            self.log.info('%s > State %s > %s', this.constructor.name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function (err) { });
            self.contactSensorService.setCharacteristic(self.Characteristic.ContactSensorState, device.getState());
        }
        /* Service.TemperatureSensor */
        var oldTemperature = self.dDevice.getValue('temperature');
        if (device.getValue('temperature') != oldTemperature) {
            self.log.info('%s > Temperature %s > %s', this.constructor.name, oldTemperature, device.getValue('temperature'));
            self.dDevice.setValue('temperature', device.getValue('temperature'));
            self.temperatureService.setCharacteristic(self.Characteristic.CurrentTemperature, device.getValue('temperature'));
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
    HBDevoloDoorWindowDevice.prototype.getContactSensorState = function (callback) {
        this.log.debug('%s > getContactSensorState', this.constructor.name);
        return callback(null, this.dDevice.getState());
    };
    HBDevoloDoorWindowDevice.prototype.getCurrentTemperature = function (callback) {
        this.log.debug('%s > getCurrentTemperature', this.constructor.name);
        return callback(null, this.dDevice.getValue('temperature'));
    };
    HBDevoloDoorWindowDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s > getBatteryLevel', this.constructor.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloDoorWindowDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s > getStatusLowBattery', this.constructor.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloDoorWindowDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s > getChargingState', this.constructor.name);
        return callback(null, false);
    };
    return HBDevoloDoorWindowDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloDoorWindowDevice = HBDevoloDoorWindowDevice;
