"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBQubinoShutterDevice = (function (_super) {
    __extends(HBQubinoShutterDevice, _super);
    function HBQubinoShutterDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onValueChanged', function (type, value) {
            self.log.info('%s (%s / %s) > Position value > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.windowCoveringService.getCharacteristic(self.Characteristic.CurrentPosition).updateValue(value, null);
        });
        self.dDevice.events.on('onTargetValueChanged', function (type, value) {
            self.log.info('%s (%s / %s) > Target position value > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.windowCoveringService.getCharacteristic(self.Characteristic.TargetPosition).updateValue(value, null);
        });
        return _this;
    }
    HBQubinoShutterDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Qubino')
            .setCharacteristic(this.Characteristic.Model, 'Flush Shutter');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        this.windowCoveringService = new this.Service.WindowCovering();
        this.windowCoveringService.getCharacteristic(this.Characteristic.CurrentPosition)
            .on('get', this.getValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition)
            .on('get', this.getTargetValue.bind(this))
            .on('set', this.setTargetValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition).setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 5
        });
        this.dDevice.listen();
        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);
        return [this.informationService, this.windowCoveringService];
    };
    HBQubinoShutterDevice.prototype.getValue = function (callback) {
        this.log.debug('%s (%s) > getValue', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getValue('blinds'));
    };
    HBQubinoShutterDevice.prototype.getTargetValue = function (callback) {
        this.log.debug('%s (%s) > getTargetValue', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getTargetValue('blinds'));
    };
    HBQubinoShutterDevice.prototype.setTargetValue = function (value, callback) {
        this.log.debug('%s (%s) > setTargetValue to %s', this.constructor.name, this.dDevice.id, value);
        if (value == this.dDevice.getTargetValue('blinds')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setTargetValue('blinds', value, function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback();
        }, true);
    };
    return HBQubinoShutterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBQubinoShutterDevice = HBQubinoShutterDevice;
