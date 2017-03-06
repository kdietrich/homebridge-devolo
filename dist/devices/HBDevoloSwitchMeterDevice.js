"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloSwitchMeterDevice = (function (_super) {
    __extends(HBDevoloSwitchMeterDevice, _super);
    function HBDevoloSwitchMeterDevice() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.heartbeatsSinceLastStateSwitch = 1;
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
        return [this.informationService, this.switchService];
    };
    /* HEARTBEAT */
    HBDevoloSwitchMeterDevice.prototype.heartbeat = function (device) {
        this.log.debug('%s (%s) > Hearbeat', this.constructor.name, device.id);
        this.heartbeatsSinceLastStateSwitch++;
        if (this.heartbeatsSinceLastStateSwitch <= 1) {
            this.log.debug('%s (%s) > Skip this heartbeat because of fast switching.', this.constructor.name, device.id);
            return;
        }
        var self = this;
        /* Service.Outlet */
        var oldState = self.dDevice.getState();
        if (device.getState() != oldState) {
            self.log.info('%s (%s) > State %s > %s', this.constructor.name, device.id, oldState, device.getState());
            self.dDevice.setState(device.getState(), function (err) {
                self.switchService.setCharacteristic(self.Characteristic.On, (device.getState() == 1));
            });
        }
        var oldCurrentConsumption = self.dDevice.getCurrentValue('energy');
        if (device.getCurrentValue('energy') != oldCurrentConsumption) {
            self.log.info('%s > CurrentConsumption %s > %s', this.constructor.name, oldCurrentConsumption, device.getCurrentValue('energy'));
            self.dDevice.setCurrentValue('energy', device.getCurrentValue('energy'), function (err) { });
            self.switchService.setCharacteristic(self.Characteristic.CurrentConsumption, device.getCurrentValue('energy'));
        }
        var oldTotalConsumption = self.dDevice.getTotalValue('energy');
        if (device.getTotalValue('energy') != oldTotalConsumption) {
            self.log.info('%s > TotalConsumption %s > %s', this.constructor.name, oldTotalConsumption, device.getTotalValue('energy'));
            self.dDevice.setTotalValue('energy', device.getTotalValue('energy'), function (err) { });
            self.switchService.setCharacteristic(self.Characteristic.TotalConsumption, device.getTotalValue('energy'));
        }
        var oldTotalConsumptionSince = self.dDevice.getSinceTime('energy');
        if (device.getSinceTime('energy') != oldTotalConsumptionSince) {
            self.log.info('%s > TotalConsumptionSince %s > %s', this.constructor.name, oldTotalConsumptionSince, device.getSinceTime('energy'));
            self.dDevice.setSinceTime('energy', device.getSinceTime('energy'), function (err) { });
            self.switchService.setCharacteristic(self.Characteristic.TotalConsumptionSince, new Date(device.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
        }
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
                self.heartbeatsSinceLastStateSwitch = 0;
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                self.heartbeatsSinceLastStateSwitch = 0;
                callback();
            });
        }
    };
    return HBDevoloSwitchMeterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSwitchMeterDevice = HBDevoloSwitchMeterDevice;
