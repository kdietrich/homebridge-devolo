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
        return _super !== null && _super.apply(this, arguments) || this;
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
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.switchService];
    };
    /* HEARTBEAT */
    HBDevoloSwitchMeterDevice.prototype.heartbeat = function (device) {
        this.log.debug('%s > Hearbeat', this.constructor.name);
        var self = this;
        /* Service.Outlet */
        var oldState = self.dDevice.getState();
        if (device.getState() != oldState) {
            self.log.info('%s > State %s > %s', this.constructor.name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function (err) { });
            self.switchService.setCharacteristic(self.Characteristic.On, (device.getState() == 1));
        }
    };
    HBDevoloSwitchMeterDevice.prototype.getSwitchState = function (callback) {
        this.log.debug('%s > getSwitchState', this.constructor.name);
        return callback(null, this.dDevice.getState() != 0);
    };
    HBDevoloSwitchMeterDevice.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s > setSwitchState to %s', this.constructor.name, value);
        if (value == this.dDevice.getState())
            return;
        if (value) {
            this.dDevice.turnOn(function (err) {
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function (err) {
                callback();
            });
        }
    };
    return HBDevoloSwitchMeterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSwitchMeterDevice = HBDevoloSwitchMeterDevice;
