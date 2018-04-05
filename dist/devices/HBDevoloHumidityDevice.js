"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloHumidityDevice = (function (_super) {
    __extends(HBDevoloHumidityDevice, _super);
    function HBDevoloHumidityDevice(log, dAPI, dDevice, storage) {
        var _this = _super.call(this, log, dAPI, dDevice, storage) || this;
        var self = _this;
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s / %s) > Temperature > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if (type === 'humidity') {
                self.log.info('%s (%s / %s) > Humidity > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.humidityService.getCharacteristic(self.Characteristic.CurrentRelativeHumidity).updateValue(value, null);
            }
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
    HBDevoloHumidityDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Humidity Sensor');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.humidityService = new this.Service.HumiditySensor();
        this.humidityService.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
            .on('get', this.getCurrentRelativeHumidity.bind(this));
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
        this.dDevice.listen();
        return [this.informationService, this.humidityService, this.temperatureService, this.batteryService];
    };
    HBDevoloHumidityDevice.prototype.getCurrentRelativeHumidity = function (callback) {
        this.log.debug('%s > getCurrentRelativeHumidity', this.constructor.name);
        return callback(null, this.dDevice.getValue('humidity'));
    };
    HBDevoloHumidityDevice.prototype.getCurrentTemperature = function (callback) {
        this.log.debug('%s > getCurrentTemperature', this.constructor.name);
        return callback(null, this.dDevice.getValue('temperature'));
    };
    HBDevoloHumidityDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s > getBatteryLevel', this.constructor.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloHumidityDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s > getStatusLowBattery', this.constructor.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloHumidityDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s > getChargingState', this.constructor.name);
        return callback(null, false);
    };
    return HBDevoloHumidityDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloHumidityDevice = HBDevoloHumidityDevice;
