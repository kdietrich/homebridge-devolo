"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var moment = require('moment');
var HBDevoloMotionDevice = /** @class */ (function (_super) {
    __extends(HBDevoloMotionDevice, _super);
    function HBDevoloMotionDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > onStateChanged > MotionState is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.motionSensorService.getCharacteristic(self.Characteristic.MotionDetected).updateValue(state, null);
            // START FakeGato (eve app)
            if (self.config.fakeGato) {
                if (self.loggingService.isHistoryLoaded()) {
                    self._addFakeGatoEntry({ status: state });
                    if (state == 0) {
                        // NO MOTION
                    }
                    else {
                        // MOTION
                        self.lastActivation = moment().unix() - self.loggingService.getInitialTime();
                        self.motionSensorService.getCharacteristic(self.Characteristic.LastActivation).updateValue(self.lastActivation, null);
                    }
                    self.log.info("%s (%s / %s) > onStateChanged FakeGato > MotionState changed to %s, lastActivation is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, state, self.lastActivation);
                    self.loggingService.setExtraPersistedData([{ "lastActivation": self.lastActivation }]);
                }
                else {
                    self.log.info("%s (%s / %s) > onStateChanged FakeGato > MotionState %s not added - FakeGato history not yet loaded", self.constructor.name, self.dDevice.id, self.dDevice.name, state);
                }
            }
            // END FakeGato (eve app)
        });
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s / %s) > onValueChanged > Temperature is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if (type === 'light') {
                self.log.info('%s (%s / %s) > onValueChanged > Light is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.lightSensorService.getCharacteristic(self.Characteristic.CurrentAmbientLightLevel).updateValue(value / 100 * 500, null); //convert percentage to lux
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
    HBDevoloMotionDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Motion Sensor')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.motionSensorService = new this.Service.MotionSensor();
        this.motionSensorService.getCharacteristic(this.Characteristic.MotionDetected)
            .on('get', this.getMotionDetected.bind(this));
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
        this.temperatureService = new this.Service.TemperatureSensor(this.name);
        this.temperatureService.getCharacteristic(this.Characteristic.CurrentTemperature)
            .on('get', this.getCurrentTemperature.bind(this));
        var services = [this.informationService, this.motionSensorService, this.batteryService];
        if (!this.config.lightBlacklist || !this._isInList(this.dDevice.name, this.config.lightBlacklist)) {
            services = services.concat([this.lightSensorService]);
        }
        if (!this.config.tempBlacklist || !this._isInList(this.dDevice.name, this.config.tempBlacklist)) {
            services = services.concat([this.temperatureService]);
        }
        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('motion', false);
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)
        this.dDevice.listen();
        return services;
    };
    HBDevoloMotionDevice.prototype.getMotionDetected = function (callback) {
        this.apiGetMotionDetected = this.dDevice.getState();
        this.log.debug('%s (%s / %s) > getMotionDetected is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetMotionDetected);
        return callback(null, this.apiGetMotionDetected);
    };
    HBDevoloMotionDevice.prototype.getCurrentTemperature = function (callback) {
        this.apiGetCurrentTemperature = this.dDevice.getValue('temperature');
        this.log.debug('%s (%s / %s) > getCurrentTemperature is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentTemperature);
        return callback(null, this.apiGetCurrentTemperature);
    };
    HBDevoloMotionDevice.prototype.getCurrentAmbientLightLevel = function (callback) {
        this.apiGetCurrentAmbientLightLevel = this.dDevice.getValue('light') / 100 * 500; //convert percentage to lux
        this.log.debug('%s (%s / %s) > getCurrentAmbientLightLevel is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentAmbientLightLevel);
        return callback(null, this.apiGetCurrentAmbientLightLevel);
    };
    HBDevoloMotionDevice.prototype.getBatteryLevel = function (callback) {
        this.apiGetBatteryLevel = this.dDevice.getBatteryLevel();
        this.log.debug('%s (%s / %s) > getBatteryLevel is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetBatteryLevel);
        return callback(null, this.apiGetBatteryLevel);
    };
    HBDevoloMotionDevice.prototype.getStatusLowBattery = function (callback) {
        this.apiGetStatusLowBattery = !this.dDevice.getBatteryLow();
        this.log.debug('%s (%s / %s) > getStatusLowBattery is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetStatusLowBattery);
        return callback(null, this.apiGetStatusLowBattery);
    };
    HBDevoloMotionDevice.prototype.getChargingState = function (callback) {
        this.apiGetChargingState = false;
        this.log.debug('%s (%s / %s) > getChargingState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetChargingState);
        return callback(null, this.apiGetChargingState);
    };
    HBDevoloMotionDevice.prototype.getLastActivation = function (callback) {
        this.log.debug('%s (%s / %s) > getLastActivation will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.lastActivation);
        this.motionSensorService.getCharacteristic(this.Characteristic.LastActivation).updateValue(this.lastActivation, null);
        return callback(null, this.lastActivation);
    };
    HBDevoloMotionDevice.prototype.onAfterFakeGatoHistoryLoaded = function () {
        this.motionSensorService.addCharacteristic(this.Characteristic.LastActivation)
            .on('get', this.getLastActivation.bind(this));
        if (this.loggingService.getExtraPersistedData() == undefined) {
            this.lastActivation = 0;
            this.loggingService.setExtraPersistedData([{ "lastActivation": this.lastActivation }]);
        }
        else {
            this.lastActivation = this.loggingService.getExtraPersistedData()[0].lastActivation;
        }
        // initial state post homebridge-restart, otherwise no graph - motion and door
        this._addFakeGatoEntry({ status: this.dDevice.getState() });
        this.log.debug("%s (%s / %s) > FakeGato Characteristic loaded.", this.constructor.name, this.dDevice.id, this.dDevice.name);
    };
    return HBDevoloMotionDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloMotionDevice = HBDevoloMotionDevice;
