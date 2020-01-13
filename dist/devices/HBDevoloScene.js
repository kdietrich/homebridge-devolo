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
var HBDevoloScene = /** @class */ (function (_super) {
    __extends(HBDevoloScene, _super);
    function HBDevoloScene() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    HBDevoloScene.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Scene')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        return [this.informationService, this.switchService];
    };
    HBDevoloScene.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s / %s) > getSwitchState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, false);
        return callback(null, false);
    };
    HBDevoloScene.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s / %s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
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
