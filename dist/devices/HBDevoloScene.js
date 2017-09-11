"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloScene = (function (_super) {
    __extends(HBDevoloScene, _super);
    function HBDevoloScene() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HBDevoloScene.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Scene');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.switchService];
    };
    HBDevoloScene.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s) > getSwitchState', this.constructor.name, this.dDevice.id);
        return callback(null, false);
    };
    HBDevoloScene.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, value);
        var self = this;
        if (value) {
            this.dDevice.invoke(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                setTimeout(function () {
                    self.switchService.setCharacteristic(self.Characteristic.On, false);
                }, 100);
                callback();
            });
        }
        else
            callback();
    };
    return HBDevoloScene;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloScene = HBDevoloScene;
