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
var DevoloSensor_1 = require("node-devolo/dist/DevoloSensor");
var HBOtherRelaySwitchXDevice = /** @class */ (function (_super) {
    __extends(HBOtherRelaySwitchXDevice, _super);
    function HBOtherRelaySwitchXDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        _this.manufacturers = {
            "0x010f": "Fibaro",
            "0x0175": "Devolo",
            "0x0130": "Qubino",
            "0x0060": "Everspring"
        };
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
        if (this.manufacturers[this.dDevice.manID]) {
            this.log.info('manufacturer: %s ', this.manufacturers[this.dDevice.manID]);
            this.informationService.setCharacteristic(this.Characteristic.Manufacturer, this.manufacturers[this.dDevice.manID]);
        }
        else {
            this.informationService.setCharacteristic(this.Characteristic.Manufacturer, 'Other');
        }
        this.informationService
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
                var meterSensor = this.dDevice.getSensor(DevoloSensor_1.MeterSensor, 'energy', sensorCount + 1);
                if (meterSensor) {
                    this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
                        .on('get', this.getDevoloCurrentConsumption.bind([this, (sensorCount + 1)]));
                    this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumption)
                        .on('get', this.getDevoloTotalConsumption.bind([this, (sensorCount + 1)]));
                    this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
                        .on('get', this.getDevoloTotalConsumptionSince.bind([this, (sensorCount + 1)]));
                }
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
        this.apiGetSwitchState = self.dDevice.getState(num) != 0;
        self.log.debug('%s (%s [%s] / %s) > getSwitchState is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, this.apiGetSwitchState);
        return callback(null, this.apiGetSwitchState);
    };
    HBOtherRelaySwitchXDevice.prototype.getDevoloCurrentConsumption = function (callback) {
        var self = this[0];
        var num = this[1];
        try {
            //self.log.debug('will read current consumption for %s (id: %s num: [%s] / dDevice.name: %s)', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name);
            this.apiGetDevoloCurrentConsumption = self.dDevice.getCurrentValue('energy', num);
            self.log.debug('%s (%s [%s] / %s) > getDevoloCurrentConsumption is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloCurrentConsumption);
            return callback(null, this.apiGetDevoloCurrentConsumption);
        }
        catch (e) {
            self.log.warn('Error reading current consumption for %s (id: %s [%s])', self.dDevice.name, self.dDevice.id, num);
            return callback(e, null);
        }
    };
    HBOtherRelaySwitchXDevice.prototype.getDevoloTotalConsumption = function (callback) {
        var self = this[0];
        var num = this[1];
        try {
            this.apiGetDevoloTotalConsumption = self.dDevice.getTotalValue('energy', num);
            self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumption is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloTotalConsumption);
            return callback(null, this.apiGetDevoloTotalConsumption);
        }
        catch (e) {
            self.log.warn('Error reading total consumption for %s (id: %s [%s])', self.dDevice.name, self.dDevice.id, num);
            return callback(e, null);
        }
    };
    HBOtherRelaySwitchXDevice.prototype.getDevoloTotalConsumptionSince = function (callback) {
        var self = this[0];
        var num = this[1];
        try {
            this.apiGetDevoloTotalConsumptionSince = new Date(self.dDevice.getSinceTime('energy', num)).toISOString().replace(/T/, ' ').replace(/\..+/, '');
            self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumptionSince is %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloTotalConsumptionSince);
            return callback(null, this.apiGetDevoloTotalConsumptionSince);
        }
        catch (e) {
            self.log.warn('Error reading total consumption since for %s (id: %s [%s])', self.dDevice.name, self.dDevice.id, num);
            return callback(e, null);
        }
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
