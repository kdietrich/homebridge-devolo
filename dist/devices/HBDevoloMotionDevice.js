"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloMotionDevice = (function (_super) {
    __extends(HBDevoloMotionDevice, _super);
    function HBDevoloMotionDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s) > State > %s', self.constructor.name, self.dDevice.id, state);
            self.motionSensorService.getCharacteristic(self.Characteristic.MotionDetected).updateValue(state, null);
        });
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s) > Temperature > %s', self.constructor.name, self.dDevice.id, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if (type === 'light') {
                self.log.info('%s (%s) > Light > %s', self.constructor.name, self.dDevice.id, value);
                self.lightSensorService.getCharacteristic(self.Characteristic.CurrentAmbientLightLevel).updateValue(value / 100 * 500, null); //convert percentage to lux
            }
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
        this.dDevice.listen();
        return [this.informationService, this.motionSensorService, this.temperatureService, this.batteryService, this.lightSensorService];
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
