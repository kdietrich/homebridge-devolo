"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloMotionDevice = (function (_super) {
    __extends(HBDevoloMotionDevice, _super);
    function HBDevoloMotionDevice() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HBDevoloMotionDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Motion Sensor');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.motionSensorService = new this.Service.MotionSensor();
        this.motionSensorService.getCharacteristic(this.Characteristic.MotionDetected)
            .on('get', this.getMotionDetected.bind(this));
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
        this.lightSensorService = new this.Service.LightSensor(this.name);
        this.lightSensorService.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel)
            .on('get', this.getCurrentAmbientLightLevel.bind(this));
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.motionSensorService, this.temperatureService, this.batteryService];
    };
    /* HEARTBEAT */
    HBDevoloMotionDevice.prototype.heartbeat = function (device) {
        this.log.debug('%s > Hearbeat', this.constructor.name);
        var self = this;
        /* Service.MotionSensor */
        var oldState = self.dDevice.getState();
        if (device.getState() != oldState) {
            self.log.info('%s > State %s > %s', this.constructor.name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function (err) { });
            self.motionSensorService.setCharacteristic(self.Characteristic.MotionDetected, device.getState());
        }
        /* Service.TemperatureSensor */
        var oldTemperature = self.dDevice.getValue('temperature');
        if (device.getValue('temperature') != oldTemperature) {
            self.log.info('%s > Temperature %s > %s', this.constructor.name, oldTemperature, device.getValue('temperature'));
            self.dDevice.setValue('temperature', device.getValue('temperature'));
            self.temperatureService.setCharacteristic(self.Characteristic.CurrentTemperature, device.getValue('temperature'));
        }
        /* Service.LightSensor */
        var oldLight = self.dDevice.getValue('light');
        if (device.getValue('light') != oldLight) {
            self.log.info('%s > Light %s > %s', this.constructor.name, oldLight, device.getValue('light'));
            self.dDevice.setValue('light', device.getValue('light'));
            self.lightSensorService.setCharacteristic(self.Characteristic.CurrentAmbientLightLevel, device.getValue('light') / 100 * 500); //convert percentage to lux
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
    HBDevoloMotionDevice.prototype.getMotionDetected = function (callback) {
        this.log.debug('%s > getMotionDetected', this.constructor.name);
        return callback(null, this.dDevice.getState());
    };
    HBDevoloMotionDevice.prototype.getCurrentTemperature = function (callback) {
        this.log.debug('%s > getCurrentTemperature', this.constructor.name);
        return callback(null, this.dDevice.getValue('temperature'));
    };
    HBDevoloMotionDevice.prototype.getCurrentAmbientLightLevel = function (callback) {
        this.log.debug('%s > getCurrentAmbientLightLevel', this.constructor.name);
        return callback(null, this.dDevice.getValue('light') / 100 * 500); //convert percentage to lux
    };
    HBDevoloMotionDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s > getBatteryLevel', this.constructor.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloMotionDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s > getStatusLowBattery', this.constructor.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloMotionDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s > getChargingState', this.constructor.name);
        return callback(null, false);
    };
    return HBDevoloMotionDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloMotionDevice = HBDevoloMotionDevice;
