"use strict";
//Characteristic.PositionState.DECREASING = 0;
//Characteristic.PositionState.INCREASING = 1;
//Characteristic.PositionState.STOPPED = 2;
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
var HBDevoloShutterDevice = /** @class */ (function (_super) {
    __extends(HBDevoloShutterDevice, _super);
    function HBDevoloShutterDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onValueChanged', function (type, value) {
            self.log.info('%s (%s / %s) > Position value > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.windowCoveringService.getCharacteristic(self.Characteristic.CurrentPosition).updateValue(value, null);
        });
        self.dDevice.events.on('onTargetValueChanged', function (type, value) {
            self.log.info('%s (%s / %s) > Target position value > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
            self.windowCoveringService.getCharacteristic(self.Characteristic.TargetPosition).updateValue(value, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > CurrentConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloCurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > DevoloTotalConsumption > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloTotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function (type, value) {
            if (type === 'energy') {
                self.log.info('%s (%s / %s) > DevoloTotalConsumptionSince > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloTotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
        return _this;
    }
    HBDevoloShutterDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Shutter')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.windowCoveringService = new this.Service.WindowCovering();
        this.windowCoveringService.getCharacteristic(this.Characteristic.CurrentPosition)
            .on('get', this.getValue.bind(this));
        //this.windowCoveringService.getCharacteristic(this.Characteristic.PositionState)
        //             .on('get', this.getPositionState.bind(this))
        //             .on('set', this.setPositionState.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition)
            .on('get', this.getTargetValue.bind(this))
            .on('set', this.setTargetValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition).setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 5
        });
        this.dDevice.listen();
        return [this.informationService, this.windowCoveringService];
    };
    HBDevoloShutterDevice.prototype.getValue = function (callback) {
        this.log.debug('%s (%s / %s) > getValue is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.dDevice.getValue('blinds'));
        return callback(null, this.dDevice.getValue('blinds'));
    };
    HBDevoloShutterDevice.prototype.getTargetValue = function (callback) {
        this.log.debug('%s (%s / %s) > getTargetValue is %s', this.constructor.name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getTargetValue('blinds'));
    };
    HBDevoloShutterDevice.prototype.setTargetValue = function (value, callback) {
        this.log.debug('%s (%s / %s) > setTargetValue to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
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
    return HBDevoloShutterDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloShutterDevice = HBDevoloShutterDevice;
