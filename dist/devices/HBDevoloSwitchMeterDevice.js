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
var HBDevoloSwitchMeterDevice = /** @class */ (function (_super) {
    __extends(HBDevoloSwitchMeterDevice, _super);
    function HBDevoloSwitchMeterDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
            // START FakeGato (eve app)
            if (self.config.fakeGato) {
                if (state == 0) {
                    // OFF
                    self.secondsSincelastChange = moment().unix() - self.lastChange;
                    self.totalConsumptionSincelastChange = self.lastValue * (self.secondsSincelastChange / 3600) / 1000; // kWh
                    self.totalConsumption = self.totalConsumption + self.totalConsumptionSincelastChange; // kWh
                    self.lastChange = moment().unix();
                    self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(self.totalConsumption.toFixed(6), null);
                    self.log.info("%s (%s / %s) > FakeGato > SwitchState changed to off > lastValue was %s W, totalConsumption set to %s kWh, lastChange set to %s, secondsSincelastChange was %s, totalConsumptionSincelastChange was %s kWh, lastReset is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, self.lastValue, self.totalConsumption.toFixed(6), self.lastChange, self.secondsSincelastChange, self.totalConsumptionSincelastChange.toFixed(6), self.lastReset);
                    self.loggingService.setExtraPersistedData([{ "totalConsumption": self.totalConsumption.toFixed(6), "lastValue": self.lastValue, "lastChange": self.lastChange, "lastReset": self.lastReset }]);
                }
                else {
                    // ON
                    self.lastChange = moment().unix();
                    self.log.debug('%s (%s / %s) > FakeGato > SwitchState changed to on > lastChange set to %s', self.constructor.name, self.dDevice.id, self.dDevice.name, self.lastChange);
                    self.loggingService.setExtraPersistedData([{ "totalConsumption": self.totalConsumption.toFixed(6), "lastValue": self.lastValue, "lastChange": self.lastChange, "lastReset": self.lastReset }]);
                }
            }
            // END FakeGato (eve app)
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > CurrentConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloCurrentConsumption).updateValue(value, null);
                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    self._addFakeGatoEntry({ power: value });
                    self.secondsSincelastChange = moment().unix() - self.lastChange;
                    self.totalConsumptionSincelastChange = self.lastValue * (self.secondsSincelastChange / 3600) / 1000; // kWh
                    self.totalConsumption = self.totalConsumption + self.totalConsumptionSincelastChange; // kWh
                    self.lastChange = moment().unix();
                    self.switchService.getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
                    self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(self.totalConsumption.toFixed(6), null);
                    self.log.info("%s (%s / %s) > FakeGato > CurrentConsumption changed to %s W > lastValue was %s, totalConsumption set to %s kWh, lastChange set to %s, secondsSincelastChange was %s, totalConsumptionSincelastChange was %s kWh, lastReset is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, value, self.lastValue, self.totalConsumption.toFixed(6), self.lastChange, self.secondsSincelastChange, self.totalConsumptionSincelastChange.toFixed(6), self.lastReset);
                    self.lastValue = value;
                    self.loggingService.setExtraPersistedData([{ "totalConsumption": self.totalConsumption.toFixed(6), "lastValue": self.lastValue, "lastChange": self.lastChange, "lastReset": self.lastReset }]);
                }
                // END FakeGato (eve app)
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > DevoloTotalConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloTotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > DevoloTotalConsumptionSince > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloTotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBDevoloSwitchMeterDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Smart Metering Plug')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.switchService = new this.Service.Outlet(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
            .on('get', this.getDevoloCurrentConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloTotalConsumption)
            .on('get', this.getDevoloTotalConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
            .on('get', this.getDevoloTotalConsumptionSince.bind(this));
        var services = [this.informationService, this.switchService];
        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('energy', false);
            this.CheckFakeGatoHistoryLoaded();
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)
        this.dDevice.listen();
        return services;
    };
    HBDevoloSwitchMeterDevice.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s / %s) > getSwitchState', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getState() != 0);
    };
    HBDevoloSwitchMeterDevice.prototype.getDevoloCurrentConsumption = function (callback) {
        this.log.debug('%s (%s / %s) > getDevoloCurrentConsumption', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    };
    HBDevoloSwitchMeterDevice.prototype.getDevoloTotalConsumption = function (callback) {
        this.log.debug('%s (%s / %s) > getDevoloTotalConsumption', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getTotalValue('energy'));
    };
    HBDevoloSwitchMeterDevice.prototype.getDevoloTotalConsumptionSince = function (callback) {
        this.log.debug('%s (%s / %s) > getDevoloTotalConsumptionSince', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, new Date(this.dDevice.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    };
    HBDevoloSwitchMeterDevice.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s / %s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        if (value == this.dDevice.getState()) {
            callback();
            return;
        }
        var self = this;
        if (value) {
            this.dDevice.turnOn(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        }
    };
    // START FakeGato (eve app)
    HBDevoloSwitchMeterDevice.prototype.getCurrentConsumption = function (callback) {
        this.log.debug('%s (%s / %s) > getCurrentConsumption', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    };
    HBDevoloSwitchMeterDevice.prototype.getTotalConsumption = function (callback) {
        this.log.debug('%s (%s / %s) > getTotalConsumption', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.totalConsumption);
    };
    HBDevoloSwitchMeterDevice.prototype.getReset = function (callback) {
        this.log.debug('%s (%s / %s) > getResetTime will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.lastReset);
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback(null, this.lastReset);
    };
    HBDevoloSwitchMeterDevice.prototype.setReset = function (value, callback) {
        this.log.debug('%s (%s / %s) > setResetTime to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        this.totalConsumption = 0;
        this.lastReset = value;
        this.loggingService.setExtraPersistedData([{ "totalConsumption": this.totalConsumption, "lastValue": this.lastValue, "lastChange": this.lastChange, "lastReset": this.lastReset }]);
        if (this.switchService.getCharacteristic(this.Characteristic.TotalConsumption)) {
            this.switchService.getCharacteristic(this.Characteristic.TotalConsumption).updateValue(this.totalConsumption, null);
        }
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback();
    };
    HBDevoloSwitchMeterDevice.prototype.CheckFakeGatoHistoryLoaded = function () {
        if (this.loggingService.isHistoryLoaded() == false) {
            setTimeout(this.CheckFakeGatoHistoryLoaded.bind(this), 100);
        }
        else {
            this.switchService.addCharacteristic(this.Characteristic.CurrentConsumption)
                .on('get', this.getCurrentConsumption.bind(this));
            this.switchService.addCharacteristic(this.Characteristic.TotalConsumption)
                .on('get', this.getTotalConsumption.bind(this));
            this.loggingService.addCharacteristic(this.Characteristic.ResetTotal)
                .on('get', this.getReset.bind(this))
                .on('set', this.setReset.bind(this));
            if (this.loggingService.getExtraPersistedData() == undefined) {
                this.totalConsumption = 0;
                this.lastValue = 0;
                this.lastChange = moment().unix();
                this.totalConsumptionSincelastChange = 0;
                this.secondsSincelastChange = 0;
                this.lastReset = moment().unix() - moment('2001-01-01T00:00:00Z').unix();
                this.loggingService.setExtraPersistedData([{ "totalConsumption": this.totalConsumption, "lastValue": this.lastValue, "lastChange": this.lastChange, "lastReset": this.lastReset }]);
            }
            else {
                this.totalConsumption = this.loggingService.getExtraPersistedData()[0].totalConsumption;
                this.lastValue = this.loggingService.getExtraPersistedData()[0].lastValue;
                this.lastChange = this.loggingService.getExtraPersistedData()[0].lastChange;
                this.totalConsumptionSincelastChange = 0;
                this.secondsSincelastChange = 0;
                this.lastReset = this.loggingService.getExtraPersistedData()[0].lastReset;
            }
        }
    };
    return HBDevoloSwitchMeterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSwitchMeterDevice = HBDevoloSwitchMeterDevice;
