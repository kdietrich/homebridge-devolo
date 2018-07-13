"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBQubinoRelay2Device = (function (_super) {
    __extends(HBQubinoRelay2Device, _super);
    function HBQubinoRelay2Device(log, dAPI, dDevice, storage) {
        var _this = _super.call(this, log, dAPI, dDevice, storage) || this;
        _this.switchServices = [];
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state, num) {
            self.log.info('%s (%s [%s] / %s) > State > %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, state);
            self.switchServices[num - 1].getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value, num) {
            if (type === 'energy') {
                self.log.info('%s (%s [%s] / %s) > CurrentConsumption > %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num - 1].getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value, num) {
            if (type === 'energy') {
                self.log.info('%s (%s [%s] / %s) > TotalConsumption > %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num - 1].getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value, num) {
            if (type === 'energy') {
                self.log.info('%s (%s [%s] / %s) > TotalConsumptionSince > %s', self.constructor.name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num - 1].getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBQubinoRelay2Device.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Qubino')
            .setCharacteristic(this.Characteristic.Model, 'Flush x');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        var sensorCount = 0;
        for (var i = 0; i < this.dDevice.sensors.length; i++) {
            var sensor = this.dDevice.sensors[i];
            if (sensor.id.indexOf('BinarySwitch') > -1) {
                this.switchServices.push(new this.Service.Outlet(this.name + ' ' + (sensorCount + 1), this.name + ' ' + (sensorCount + 1)));
                this.switchServices[sensorCount].getCharacteristic(this.Characteristic.On)
                    .on('get', this.getSwitchState.bind([this, (sensorCount + 1)]))
                    .on('set', this.setSwitchState.bind([this, (sensorCount + 1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.CurrentConsumption)
                    .on('get', this.getCurrentConsumption.bind([this, (sensorCount + 1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.TotalConsumption)
                    .on('get', this.getTotalConsumption.bind([this, (sensorCount + 1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.TotalConsumptionSince)
                    .on('get', this.getTotalConsumptionSince.bind([this, (sensorCount + 1)]));
                sensorCount++;
            }
        }
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        this.dDevice.listen();
        return [this.informationService].concat(this.switchServices);
    };
    HBQubinoRelay2Device.prototype.getSwitchState = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getSwitchState', self.constructor.name, self.dDevice.id, num);
        return callback(null, self.dDevice.getState(num) != 0);
    };
    HBQubinoRelay2Device.prototype.getCurrentConsumption = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getCurrentConsumption', self.constructor.name, self.dDevice.id, num);
        return callback(null, self.dDevice.getCurrentValue('energy', num));
    };
    HBQubinoRelay2Device.prototype.getTotalConsumption = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getTotalConsumption', self.constructor.name, self.dDevice.id, num);
        return callback(null, self.dDevice.getTotalValue('energy', num));
    };
    HBQubinoRelay2Device.prototype.getTotalConsumptionSince = function (callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getTotalConsumptionSince', self.constructor.name, self.dDevice.id, num);
        return callback(null, new Date(self.dDevice.getSinceTime('energy', num)).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    };
    HBQubinoRelay2Device.prototype.setSwitchState = function (value, callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > setSwitchState to %s', self.constructor.name, self.dDevice.id, num, value);
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
    return HBQubinoRelay2Device;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBQubinoRelay2Device = HBQubinoRelay2Device;
