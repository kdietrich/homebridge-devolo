"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloRule = (function (_super) {
    __extends(HBDevoloRule, _super);
    function HBDevoloRule(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onEnabledChanged', function (value) {
            self.log.info('%s (%s / %s) > Enabled > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(value, null);
        });
        return _this;
    }
    HBDevoloRule.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Rule');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.dDevice.listen();
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.switchService];
    };
    HBDevoloRule.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s) > getSwitchState', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getEnabled());
    };
    HBDevoloRule.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, value);
        if (value == this.dDevice.getEnabled()) {
            callback();
            return;
        }
        callback('Rules cannot be switched right now.');
        return;
    };
    return HBDevoloRule;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloRule = HBDevoloRule;
