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
var moment = require('moment');
var HBDevoloDoorWindowDevice = /** @class */ (function (_super) {
    __extends(HBDevoloDoorWindowDevice, _super);
    function HBDevoloDoorWindowDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.contactSensorService.getCharacteristic(self.Characteristic.ContactSensorState).updateValue(state, null);
            // START FakeGato (eve app)
            if (self.config.fakeGato) {
                self.AddFakeGatoEntry({ status: state });
                if (state == 0) {
                    // CLOSED
                    self.timeOpen = self.timeOpen + (moment().unix() - self.lastChange);
                }
                else {
                    // OPEN
                    self.timeClose = self.timeClose + (moment().unix() - self.lastChange);
                    self.timesOpened = self.timesOpened + 1;
                    self.lastActivation = moment().unix() - self.loggingService.getInitialTime();
                    self.contactSensorService.getCharacteristic(self.Characteristic.TimesOpened).updateValue(self.timesOpened, null);
                    self.contactSensorService.getCharacteristic(self.Characteristic.LastActivation).updateValue(self.lastActivation, null);
                }
                self.lastChange = moment().unix();
                self.log.info("%s (%s / %s) > FakeGato > SensorState changed to %s > lastActivation is %s, lastReset is %s, lastChange is %s timesOpened is %s, timeOpen is %s, timeClose is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, state, self.lastActivation, self.lastReset, self.lastChange, self.timesOpened, self.timeOpen, self.timeClose);
                self.loggingService.setExtraPersistedData([{ "lastActivation": self.lastActivation, "lastReset": self.lastReset, "lastChange": self.lastChange, "timesOpened": self.timesOpened, "timeOpen": self.timeOpen, "timeClose": self.timeClose }]);
            }
            // END FakeGato (eve app)
        });
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'temperature') {
                self.log.info('%s (%s / %s) > Temperature > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if (type === 'light') {
                self.log.info('%s (%s / %s) > Light > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.lightSensorService.getCharacteristic(self.Characteristic.CurrentAmbientLightLevel).updateValue(value / 100 * 500, null); //convert percentage to lux
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
    HBDevoloDoorWindowDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Door Window Contact')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.contactSensorService = new this.Service.ContactSensor();
        this.contactSensorService.getCharacteristic(this.Characteristic.ContactSensorState)
            .on('get', this.getContactSensorState.bind(this));
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
        var services = [this.informationService, this.contactSensorService, this.batteryService, this.lightSensorService, this.temperatureService];
        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this.AddFakeGatoHistory('door', false);
            this.CheckFakeGatoHistoryLoaded();
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)
        this.dDevice.listen();
        return services;
    };
    HBDevoloDoorWindowDevice.prototype.getContactSensorState = function (callback) {
        this.log.debug('%s (%s / %s) > getContactSensorState', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getState());
    };
    HBDevoloDoorWindowDevice.prototype.getCurrentTemperature = function (callback) {
        this.log.debug('%s (%s / %s) > getCurrentTemperature', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('temperature'));
    };
    HBDevoloDoorWindowDevice.prototype.getCurrentAmbientLightLevel = function (callback) {
        this.log.debug('%s (%s / %s) > getCurrentAmbientLightLevel', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('light') / 100 * 500); //convert percentage to lux
    };
    HBDevoloDoorWindowDevice.prototype.getBatteryLevel = function (callback) {
        this.log.debug('%s (%s / %s) > getBatteryLevel', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getBatteryLevel());
    };
    HBDevoloDoorWindowDevice.prototype.getStatusLowBattery = function (callback) {
        this.log.debug('%s (%s / %s) > getStatusLowBattery', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, !this.dDevice.getBatteryLow());
    };
    HBDevoloDoorWindowDevice.prototype.getChargingState = function (callback) {
        this.log.debug('%s (%s / %s) > getChargingState', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, false);
    };
    // START FakeGato (eve app)
    HBDevoloDoorWindowDevice.prototype.gettimesOpened = function (callback) {
        this.log.debug('%s (%s / %s) > gettimesOpened will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.timesOpened);
        this.contactSensorService.getCharacteristic(this.Characteristic.TimesOpened).updateValue(this.timesOpened, null);
        return callback(null, this.timesOpened);
    };
    HBDevoloDoorWindowDevice.prototype.getlastActivation = function (callback) {
        this.log.debug('%s (%s / %s) > getlastActivation will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.lastActivation);
        this.contactSensorService.getCharacteristic(this.Characteristic.LastActivation).updateValue(this.lastActivation, null);
        return callback(null, this.lastActivation);
    };
    HBDevoloDoorWindowDevice.prototype.getOpenDuration = function (callback) {
        this.log.debug('%s (%s / %s) > getOpenDuration will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.timeOpen);
        this.contactSensorService.getCharacteristic(this.Characteristic.OpenDuration).updateValue(this.timeOpen, null);
        return callback(null, this.timeOpen);
    };
    HBDevoloDoorWindowDevice.prototype.getClosedDuration = function (callback) {
        this.log.debug('%s (%s / %s) > getCloseDuration will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.timeClose);
        this.contactSensorService.getCharacteristic(this.Characteristic.ClosedDuration).updateValue(this.timeClose, null);
        return callback(null, this.timeClose);
    };
    HBDevoloDoorWindowDevice.prototype.getReset = function (callback) {
        this.log.debug('%s (%s / %s) > getResetTime will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.lastReset);
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback(null, this.lastReset);
    };
    HBDevoloDoorWindowDevice.prototype.setReset = function (value, callback) {
        this.log.debug('%s (%s / %s) > setResetTime to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        this.timesOpened = 0;
        this.lastReset = value;
        this.loggingService.setExtraPersistedData([{ "lastActivation": this.lastActivation, "lastReset": this.lastReset, "lastChange": this.lastChange, "timesOpened": this.timesOpened, "timeOpen": this.timeOpen, "timeClose": this.timeClose }]);
        if (this.contactSensorService.getCharacteristic(this.Characteristic.TimesOpened)) {
            this.contactSensorService.getCharacteristic(this.Characteristic.TimesOpened).updateValue(this.timesOpened, null);
        }
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback();
    };
    HBDevoloDoorWindowDevice.prototype.CheckFakeGatoHistoryLoaded = function () {
        if (this.loggingService.isHistoryLoaded() == false) {
            setTimeout(this.CheckFakeGatoHistoryLoaded.bind(this), 100);
        }
        else {
            this.contactSensorService.addCharacteristic(this.Characteristic.LastActivation)
                .on('get', this.getlastActivation.bind(this));
            this.contactSensorService.addCharacteristic(this.Characteristic.TimesOpened)
                .on('get', this.gettimesOpened.bind(this));
            this.contactSensorService.addCharacteristic(this.Characteristic.OpenDuration)
                .on('get', this.getOpenDuration.bind(this));
            this.contactSensorService.addCharacteristic(this.Characteristic.ClosedDuration)
                .on('get', this.getClosedDuration.bind(this));
            this.loggingService.addCharacteristic(this.Characteristic.ResetTotal)
                .on('get', this.getReset.bind(this))
                .on('set', this.setReset.bind(this));
            if (this.loggingService.getExtraPersistedData() == undefined) {
                this.lastActivation = 0;
                this.lastReset = moment().unix() - moment('2001-01-01T00:00:00Z').unix();
                this.lastChange = moment().unix();
                this.timesOpened = 0;
                this.timeOpen = 0;
                this.timeClose = 0;
                this.loggingService.setExtraPersistedData([{ "lastActivation": this.lastActivation, "lastReset": this.lastReset, "lastChange": this.lastChange, "timesOpened": this.timesOpened, "timeOpen": this.timeOpen, "timeClose": this.timeClose }]);
            }
            else {
                this.lastActivation = this.loggingService.getExtraPersistedData()[0].lastActivation;
                this.lastReset = this.loggingService.getExtraPersistedData()[0].lastReset;
                this.lastChange = this.loggingService.getExtraPersistedData()[0].lastChange;
                this.timesOpened = this.loggingService.getExtraPersistedData()[0].timesOpened;
                this.timeOpen = this.loggingService.getExtraPersistedData()[0].timeOpen;
                this.timeClose = this.loggingService.getExtraPersistedData()[0].timeClose;
            }
        }
    };
    return HBDevoloDoorWindowDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloDoorWindowDevice = HBDevoloDoorWindowDevice;
