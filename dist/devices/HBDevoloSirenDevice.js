"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloSirenDevice = (function (_super) {
    __extends(HBDevoloSirenDevice, _super);
    function HBDevoloSirenDevice(log, dAPI, dDevice, storage) {
        var _this = _super.call(this, log, dAPI, dDevice, storage) || this;
        var self = _this;
        self.currentState = storage.getItemSync('hbd-siren-state');
        if (self.currentState === undefined) {
            self.currentState = 3;
            storage.setItem('hbd-siren-state', self.currentState);
        }
        return _this;
    }
    HBDevoloSirenDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Siren');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.securitySystemService = new this.Service.SecuritySystem();
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState)
            .on('get', this.getSecuritySystemCurrentState.bind(this))
            .on('set', this.setSecuritySystemCurrentState.bind(this));
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState)
            .on('get', this.getSecuritySystemTargetState.bind(this))
            .on('set', this.setSecuritySystemTargetState.bind(this));
        this.dDevice.listen();
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.securitySystemService];
    };
    HBDevoloSirenDevice.prototype.getSecuritySystemCurrentState = function (callback) {
        this.log.debug('%s > getSecuritySystemCurrentState', this.constructor.name);
        return callback(null, this.currentState);
    };
    HBDevoloSirenDevice.prototype.setSecuritySystemCurrentState = function (value, callback) {
        this.log.debug('%s (%s) > setSecuritySystemCurrentState to %s', this.constructor.name, this.dDevice.id, value);
        this.currentState = value;
        this.storage.setItem('hbd-siren-state', value);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState).updateValue(value, null);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState).updateValue(value, null);
        return callback();
    };
    HBDevoloSirenDevice.prototype.getSecuritySystemTargetState = function (callback) {
        this.log.debug('%s > getSecuritySystemTargetState', this.constructor.name);
        return callback(null, this.currentState);
    };
    HBDevoloSirenDevice.prototype.setSecuritySystemTargetState = function (value, callback) {
        this.log.debug('%s (%s) > setSecuritySystemTargetState to %s', this.constructor.name, this.dDevice.id, value);
        this.currentState = value;
        this.storage.setItem('hbd-siren-state', value);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState).updateValue(value, null);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState).updateValue(value, null);
        return callback();
    };
    return HBDevoloSirenDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSirenDevice = HBDevoloSirenDevice;
