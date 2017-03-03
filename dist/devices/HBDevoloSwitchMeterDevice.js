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
    };
    HBDevoloSwitchMeterDevice.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s) > getSwitchState', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getState() != 0);
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
                self.heartbeatsSinceLastStateSwitch = 0;
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function (err) {
                self.heartbeatsSinceLastStateSwitch = 0;
                callback();
            });
        }
    };
    return HBDevoloSwitchMeterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSwitchMeterDevice = HBDevoloSwitchMeterDevice;
