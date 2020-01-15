"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloHumidityDevice = /** @class */ (function (_super) {
    __extends(HBDevoloHumidityDevice, _super);
    function HBDevoloHumidityDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s / %s) > onValueChanged > CurrentTemperature is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    if (self.loggingService.isHistoryLoaded()) {
                        self._addFakeGatoEntry({ temp: value, humidity: self.lastHumidity });
                        self.log.info("%s (%s / %s) > onValueChanged FakeGato > CurrentTemperature changed to %s, LastHumidity is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, value, self.lastHumidity);
                        self.lastTemperature = value;
                    }
                    else {
                        self.log.info("%s (%s / %s) > onValueChanged FakeGato > CurrentTemperature %s not added - FakeGato history not yet loaded", self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                    }
                }
                // END FakeGato (eve app)
            }
            else if (type === 'humidity') {
                self.log.info('%s (%s / %s) > onValueChanged > CurrentHumidity is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.humidityService.getCharacteristic(self.Characteristic.CurrentRelativeHumidity).updateValue(value, null);
                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    if (self.loggingService.isHistoryLoaded()) {
                        self._addFakeGatoEntry({ temp: self.lastTemperature, humidity: value });
                        self.log.info("%s (%s / %s) > onValueChanged FakeGato > CurrentHumidity changed to %s, LastTemperature is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, value, self.lastTemperature);
                        self.lastHumidity = value;
                    }
                    else {
                        self.log.info("%s (%s / %s) > onValueChanged FakeGato > CurrentHumidity %s not added - FakeGato history not yet loaded", self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                    }
                }
                // END FakeGato (eve app)
            }
        });
        self.dDevice.events.on('onBatteryLevelChanged', function (value) {
            self.log.info('%s (%s / %s) > onBatteryLevelChanged > Battery level is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.BatteryLevel).updateValue(value, null);
        });
        self.dDevice.events.on('onBatteryLowChanged', function (value) {
            self.log.info('%s (%s / %s) > onBatteryLowChanged > Battery is low (%s)', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.StatusLowBattery).updateValue(!value, null);
        });
        return _this;
    }
    HBDevoloHumidityDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Humidity Sensor')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
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
        this.lastTemperature = this.dDevice.getValue('temperature');
        this.lastHumidity = this.dDevice.getValue('humidity');
        var services = [this.informationService, this.humidityService, this.temperatureService, this.batteryService];
        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('weather', false);
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)
        this.dDevice.listen();
        return services;
    };
    HBDevoloHumidityDevice.prototype.getCurrentRelativeHumidity = function (callback) {
        this.apiGetCurrentRelativeHumidity = this.dDevice.getValue('humidity');
        this.log.debug('%s (%s / %s) > getCurrentRelativeHumidity is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentRelativeHumidity);
        return callback(null, this.apiGetCurrentRelativeHumidity);
    };
    HBDevoloHumidityDevice.prototype.getCurrentTemperature = function (callback) {
        this.apiGetCurrentTemperature = this.dDevice.getValue('temperature');
        this.log.debug('%s (%s / %s) > getCurrentTemperature is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentTemperature);
        return callback(null, this.apiGetCurrentTemperature);
    };
    HBDevoloHumidityDevice.prototype.getBatteryLevel = function (callback) {
        this.apiGetBatteryLevel = this.dDevice.getBatteryLevel();
        this.log.debug('%s (%s / %s) > getBatteryLevel is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetBatteryLevel);
        return callback(null, this.apiGetBatteryLevel);
    };
    HBDevoloHumidityDevice.prototype.getStatusLowBattery = function (callback) {
        this.apiGetStatusLowBattery = !this.dDevice.getBatteryLow();
        this.log.debug('%s (%s / %s) > getStatusLowBattery is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetStatusLowBattery);
        return callback(null, this.apiGetStatusLowBattery);
    };
    HBDevoloHumidityDevice.prototype.getChargingState = function (callback) {
        this.apiGetChargingState = false;
        this.log.debug('%s (%s / %s) > getChargingState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetChargingState);
        return callback(null, this.apiGetChargingState);
    };
    // START FakeGato (eve app)
    HBDevoloHumidityDevice.prototype.onAfterFakeGatoHistoryLoaded = function () {
        // initial state post homebridge-restart, otherwise no graph
        this._addFakeGatoEntry({ temp: this.dDevice.getValue('temperature'), humidity: this.dDevice.getValue('humidity') });
    };
    return HBDevoloHumidityDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloHumidityDevice = HBDevoloHumidityDevice;
