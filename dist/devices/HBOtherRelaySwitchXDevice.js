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
var HBOtherRelaySwitchXDevice = /** @class */ (function (_super) {
    __extends(HBOtherRelaySwitchXDevice, _super);
    function HBOtherRelaySwitchXDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        _this.switchServices = [];
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state, num) {
            self.log.info('%s (%s [%s] / %s) > onStateChanged > State is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, state);
            self.switchServices[num - 1].getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value, num) {
            if (type === 'energy') {
                self.log.info('%s (%s [%s] / %s) > onCurrentValueChanged > CurrentConsumption is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num - 1].getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value, num) {
            if (type === 'energy') {
                self.log.info('%s (%s [%s] / %s) > onTotalValueChanged > TotalConsumption is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num - 1].getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value, num) {
            if (type === 'energy') {
                self.log.info('%s (%s [%s] / %s) > onSinceTimeChanged > TotalConsumptionSince is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num - 1].getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBOtherRelaySwitchXDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Other')
            .setCharacteristic(this.Characteristic.Model, 'Single-Double-Triple-Quattro Relay-Switch')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        var services = [this.informationService];
        var sensorCount = 0;
        for (var i = 0; i < this.dDevice.sensors.length; i++) {
            var sensor = this.dDevice.sensors[i];
            if (sensor.id.indexOf('BinarySwitch') > -1) {
                this.switchServices.push(new this.Service.Outlet(this.name + ' ' + (sensorCount + 1), this.name + ' ' + (sensorCount + 1)));
                this.switchServices[sensorCount].getCharacteristic(this.Characteristic.On)
                    .on('get', this.getSwitchState.bind([this, (sensorCount + 1)]))
                    .on('set', this.setSwitchState.bind([this, (sensorCount + 1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
                    .on('get', this.getDevoloCurrentConsumption.bind([this, (sensorCount + 1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumption)
                    .on('get', this.getDevoloTotalConsumption.bind([this, (sensorCount + 1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
                    .on('get', this.getDevoloTotalConsumptionSince.bind([this, (sensorCount + 1)]));
                if (!this.config.switchBlacklistDoubleRelaySwitch || !this._isInList(this.name + ' ' + (sensorCount + 1), this.config.switchBlacklistDoubleRelaySwitch)) {
                    this.log.debug('Initializing platform accessory \'%s\' with switch %s', this.dDevice.name, (sensorCount + 1));
                    services = services.concat([this.switchServices[sensorCount]]);
                }
                sensorCount++;
            }
        }
        this.dDevice.listen();
        return services;
    };
    HBOtherRelaySwitchXDevice.prototype.getSwitchState = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s] / %s) > getSwitchState', self.constructor.name, self.dDevice.id, num, self.dDevice.name);
        return callback(null, self.dDevice.getState(num) != 0);
    };
    HBOtherRelaySwitchXDevice.prototype.getDevoloCurrentConsumption = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s] / %s) > getDevoloCurrentConsumption', self.constructor.name, self.dDevice.id, num, self.dDevice.name);
        return callback(null, self.dDevice.getCurrentValue('energy', num));
    };
    HBOtherRelaySwitchXDevice.prototype.getDevoloTotalConsumption = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumption', self.constructor.name, self.dDevice.id, num, self.dDevice.name);
        return callback(null, self.dDevice.getTotalValue('energy', num));
    };
    HBOtherRelaySwitchXDevice.prototype.getDevoloTotalConsumptionSince = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumptionSince', self.constructor.name, self.dDevice.id, num, self.dDevice.name);
        return callback(null, new Date(self.dDevice.getSinceTime('energy', num)).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    };
    HBOtherRelaySwitchXDevice.prototype.setSwitchState = function (value, callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s] / %s) > setSwitchState to %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
        if (value == self.dDevice.getState(num)) {
            callback();
            return;
        }
        if (value) {
            self.dDevice.turnOn(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            }, num);
        }
        else {
            self.dDevice.turnOff(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            }, num);
        }
    };
    return HBOtherRelaySwitchXDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBOtherRelaySwitchXDevice = HBOtherRelaySwitchXDevice;