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
var HBDevoloRule = /** @class */ (function (_super) {
    __extends(HBDevoloRule, _super);
    function HBDevoloRule(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onEnabledChanged', function (value) {
            self.log.info('%s (%s / %s) > onEnabledChanged > Enabled is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(value, null);
        });
        return _this;
    }
    HBDevoloRule.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Rule')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.dDevice.listen();
        return [this.informationService, this.switchService];
    };
    HBDevoloRule.prototype.getSwitchState = function (callback) {
        this.apiGetSwitchState = this.dDevice.getEnabled();
        this.log.debug('%s (%s / %s) > getSwitchState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetSwitchState);
        return callback(null, this.apiGetSwitchState);
    };
    HBDevoloRule.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s / %s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
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
