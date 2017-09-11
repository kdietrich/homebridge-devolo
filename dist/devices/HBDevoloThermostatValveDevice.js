"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloThermostatValveDevice = (function (_super) {
    __extends(HBDevoloThermostatValveDevice, _super);
    function HBDevoloThermostatValveDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s) > Temperature > %s', self.constructor.name, self.dDevice.id, value);
                self.thermostatService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTargetValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s) > TargetTemperature > %s', self.constructor.name, self.dDevice.id, value);
                self.thermostatService.getCharacteristic(self.Characteristic.TargetTemperature).updateValue(value, null);
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
    HBDevoloThermostatValveDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Thermostat Valve');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.thermostatService = new this.Service.Thermostat(this.name);
        this.thermostatService.setCharacteristic(this.Characteristic.CurrentHeatingCoolingState, 1); //heating
        this.thermostatService.setCharacteristic(this.Characteristic.TargetHeatingCoolingState, 1); //heating
        this.thermostatService.setCharacteristic(this.Characteristic.TemperatureDisplayUnits, 0); //celcius
        this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature).setProps({
            minValue: 4,
            maxValue: 28,
            minStep: 0.5
        });
        this.thermostatService.getCharacteristic(this.Characteristic.CurrentTemperature)
            .on('get', this.getCurrentTemperature.bind(this));
        this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature)
            .on('get', this.getTargetTemperature.bind(this))
            .on('set', this.setTargetTemperature.bind(this));
        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
            .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
            .on('get', this.getStatusLowBattery.bind(this));
        this.dDevice.listen();
        return [this.informationService, this.thermostatService, this.batteryService];
    };
    HBDevoloThermostatValveDevice.prototype.getCurrentTemperature = function (callback) {
        this.log.debug('%s (%s) > getCurrentTemperature', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getValue('temperature'));
    };
    HBDevoloThermostatValveDevice.prototype.getTargetTemperature = function (callback) {
        this.log.debug('%s (%s) > getTargetTemperature', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getTargetValue('temperature'));
    };
    HBDevoloThermostatValveDevice.prototype.setTargetTemperature = function (value, callback) {
        this.log.debug('%s (%s) > setTargetTemperature to %s', this.constructor.name, this.dDevice.id, value);
        if (value == this.dDevice.getTargetValue('temperature')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setTargetValue('temperature', value, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback();
        }, true);
    };
    HBDevoloThermostatValveDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s > getBatteryLevel', this.constructor.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloThermostatValveDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s > getStatusLowBattery', this.constructor.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloThermostatValveDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s > getChargingState', this.constructor.name);
        return callback(null, false);
    };
    return HBDevoloThermostatValveDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloThermostatValveDevice = HBDevoloThermostatValveDevice;
