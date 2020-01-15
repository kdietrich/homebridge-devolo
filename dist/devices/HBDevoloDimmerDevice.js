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
var HBDevoloDimmerDevice = /** @class */ (function (_super) {
    __extends(HBDevoloDimmerDevice, _super);
    function HBDevoloDimmerDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > onStateChanged > State is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'dimmer') {
                self.log.info('%s (%s / %s) > onValueChanged > Dimmer is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.Brightness).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > onCurrentValueChanged > CurrentConsumption is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloCurrentConsumption).updateValue(value, null);
                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    if (self.loggingService.isHistoryLoaded()) {
                        self._addFakeGatoEntry({ power: value });
                        self.secondsSincelastChange = moment().unix() - self.lastChange;
                        self.totalConsumptionSincelastChange = +(self.lastValue * (self.secondsSincelastChange / 3600) / 1000).toFixed(6); // kWh
                        self.totalConsumption = +(self.totalConsumption + self.totalConsumptionSincelastChange).toFixed(6); // kWh
                        self.switchService.getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
                        self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(self.totalConsumption, null);
                        self.log.info("%s (%s / %s) > onCurrentValueChanged FakeGato > CurrentConsumption changed to %s W, lastValue was %s, totalConsumption set to %s kWh, lastChange set to %s, secondsSincelastChange was %s, totalConsumptionSincelastChange was %s kWh, lastReset is %s", self.constructor.name, self.dDevice.id, self.dDevice.name, value, self.lastValue, self.totalConsumption, self.lastChange, self.secondsSincelastChange, self.totalConsumptionSincelastChange, self.lastReset);
                        self.lastChange = moment().unix();
                        self.lastValue = value;
                        self.loggingService.setExtraPersistedData([{ "totalConsumption": self.totalConsumption, "lastValue": self.lastValue, "lastChange": self.lastChange, "lastReset": self.lastReset }]);
                    }
                    else {
                        self.log.info("%s (%s / %s) > onCurrentValueChanged FakeGato > CurrentConsumption %s not added - FakeGato history not yet loaded", self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                    }
                }
                // END FakeGato (eve app)
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > onTotalValueChanged > DevoloTotalConsumption is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloTotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > onSinceTimeChanged > DevoloTotalConsumptionSince is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloTotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBDevoloDimmerDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Dimmer')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.switchService = new this.Service.Lightbulb(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.switchService.getCharacteristic(this.Characteristic.Brightness)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
            .on('get', this.getDevoloCurrentConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloTotalConsumption)
            .on('get', this.getDevoloTotalConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
            .on('get', this.getDevoloTotalConsumptionSince.bind(this));
        this.switchService.getCharacteristic(this.Characteristic.Brightness).setProps({
            minStep: 5
        });
        var services = [this.informationService, this.switchService];
        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('energy', false);
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)
        this.dDevice.listen();
        return services;
    };
    HBDevoloDimmerDevice.prototype.getSwitchState = function (callback) {
        this.apiGetSwitchState = this.dDevice.getState() != 0;
        this.log.debug('%s (%s / %s) > getSwitchState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetSwitchState);
        return callback(null, this.apiGetSwitchState);
    };
    HBDevoloDimmerDevice.prototype.getBrightness = function (callback) {
        this.apiGetBrightness = this.dDevice.getValue('dimmer');
        this.log.debug('%s (%s / %s) > getBrightness is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetBrightness);
        return callback(null, this.apiGetBrightness);
    };
    HBDevoloDimmerDevice.prototype.getDevoloCurrentConsumption = function (callback) {
        this.apiGetDevoloCurrentConsumption = this.dDevice.getCurrentValue('energy');
        this.log.debug('%s (%s / %s) > getDevoloCurrentConsumption is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetDevoloCurrentConsumption);
        return callback(null, this.apiGetDevoloCurrentConsumption);
    };
    HBDevoloDimmerDevice.prototype.getDevoloTotalConsumption = function (callback) {
        this.apiGetDevoloTotalConsumption = this.dDevice.getTotalValue('energy');
        this.log.debug('%s (%s / %s) > getDevoloTotalConsumption is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetDevoloTotalConsumption);
        return callback(null, this.apiGetDevoloTotalConsumption);
    };
    HBDevoloDimmerDevice.prototype.getDevoloTotalConsumptionSince = function (callback) {
        this.apiGetDevoloTotalConsumptionSince = new Date(this.dDevice.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, '');
        this.log.debug('%s (%s / %s) > getDevoloTotalConsumptionSince is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetDevoloTotalConsumptionSince);
        return callback(null, this.apiGetDevoloTotalConsumptionSince);
    };
    HBDevoloDimmerDevice.prototype.setSwitchState = function (value, callback) {
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
    HBDevoloDimmerDevice.prototype.setBrightness = function (value, callback) {
        this.log.debug('%s (%s / %s) > setBrightness to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        if (value == this.dDevice.getValue('dimmer')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setTargetValue('dimmer', value, function (err) {
            callback();
        }, true);
    };
    // START FakeGato (eve app)
    HBDevoloDimmerDevice.prototype.getCurrentConsumption = function (callback) {
        this.apiGetCurrentConsumption = this.dDevice.getCurrentValue('energy');
        this.log.debug('%s (%s / %s) > getCurrentConsumption is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentConsumption);
        return callback(null, this.apiGetCurrentConsumption);
    };
    HBDevoloDimmerDevice.prototype.getTotalConsumption = function (callback) {
        this.log.debug('%s (%s / %s) > getTotalConsumption will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.totalConsumption);
    };
    HBDevoloDimmerDevice.prototype.getReset = function (callback) {
        this.log.debug('%s (%s / %s) > getResetTime will report %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.lastReset);
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback(null, this.lastReset);
    };
    HBDevoloDimmerDevice.prototype.setReset = function (value, callback) {
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
    HBDevoloDimmerDevice.prototype.onAfterFakeGatoHistoryLoaded = function () {
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
        // initial state post homebridge-restart, otherwise no graph
        this._addFakeGatoEntry({ power: this.dDevice.getCurrentValue('energy') });
        this.log.debug("%s (%s / %s) > FakeGato Characteristic loaded.", this.constructor.name, this.dDevice.id, this.dDevice.name);
    };
    return HBDevoloDimmerDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloDimmerDevice = HBDevoloDimmerDevice;
