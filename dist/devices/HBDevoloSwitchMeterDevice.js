"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloSwitchMeterDevice = (function (_super) {
    __extends(HBDevoloSwitchMeterDevice, _super);
    function HBDevoloSwitchMeterDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > CurrentConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > TotalConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > TotalConsumptionSince > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBDevoloSwitchMeterDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Smart Metering Plug');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.switchService = new this.Service.Outlet(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.CurrentConsumption)
            .on('get', this.getCurrentConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.TotalConsumption)
            .on('get', this.getTotalConsumption.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.TotalConsumptionSince)
            .on('get', this.getTotalConsumptionSince.bind(this));
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        this.dDevice.listen();
        return [this.informationService, this.switchService];
    };
    HBDevoloSwitchMeterDevice.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s) > getSwitchState', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getState() != 0);
    };
    HBDevoloSwitchMeterDevice.prototype.getCurrentConsumption = function (callback) {
        this.log.debug('%s > getCurrentConsumption', this.constructor.name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    };
    HBDevoloSwitchMeterDevice.prototype.getTotalConsumption = function (callback) {
        this.log.debug('%s > getTotalConsumption', this.constructor.name);
        return callback(null, this.dDevice.getTotalValue('energy'));
    };
    HBDevoloSwitchMeterDevice.prototype.getTotalConsumptionSince = function (callback) {
        this.log.debug('%s > getTotalConsumptionSince', this.constructor.name);
        return callback(null, new Date(this.dDevice.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    };
    HBDevoloSwitchMeterDevice.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, value);
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
    return HBDevoloSwitchMeterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSwitchMeterDevice = HBDevoloSwitchMeterDevice;
