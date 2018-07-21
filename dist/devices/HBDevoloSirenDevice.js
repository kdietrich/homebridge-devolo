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
var HBDevoloSirenDevice = /** @class */ (function (_super) {
    __extends(HBDevoloSirenDevice, _super);
    function HBDevoloSirenDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
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
            .setCharacteristic(this.Characteristic.Model, 'Siren')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.securitySystemService = new this.Service.SecuritySystem();
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState)
            .on('get', this.getSecuritySystemCurrentState.bind(this))
            .on('set', this.setSecuritySystemCurrentState.bind(this));
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState)
            .on('get', this.getSecuritySystemTargetState.bind(this))
            .on('set', this.setSecuritySystemTargetState.bind(this));
        this.dDevice.listen();
        return [this.informationService, this.securitySystemService];
    };
    HBDevoloSirenDevice.prototype.getSecuritySystemCurrentState = function (callback) {
        this.log.debug('%s (%s / %s) > getSecuritySystemCurrentState', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.currentState);
    };
    HBDevoloSirenDevice.prototype.setSecuritySystemCurrentState = function (value, callback) {
        this.log.debug('%s (%s / %s) > setSecuritySystemCurrentState to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        this.currentState = value;
        this.storage.setItem('hbd-siren-state', value);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState).updateValue(value, null);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState).updateValue(value, null);
        return callback();
    };
    HBDevoloSirenDevice.prototype.getSecuritySystemTargetState = function (callback) {
        this.log.debug('%s (%s / %s) > getSecuritySystemTargetState', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.currentState);
    };
    HBDevoloSirenDevice.prototype.setSecuritySystemTargetState = function (value, callback) {
        this.log.debug('%s (%s / %s) > setSecuritySystemTargetState to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        this.currentState = value;
        this.storage.setItem('hbd-siren-state', value);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState).updateValue(value, null);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState).updateValue(value, null);
        return callback();
    };
    return HBDevoloSirenDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloSirenDevice = HBDevoloSirenDevice;
