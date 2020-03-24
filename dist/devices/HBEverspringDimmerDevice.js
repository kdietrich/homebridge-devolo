"use strict";
/*

Die "Everspring AD142" sind leider nicht vollständig kompatibel mit Devolo Homecontrol.
Das Gerät hat nur einen "MultiLevelSwitch" wo man die Prozentwerte von 0% - 99% einstellen kann - keinen Ein-/Ausschalter.

Integration in "homebridge-devolo" habe ich so gut es geht gemacht.

Leider werden vom Gerät oftmals falsche Werte an die Zentrale zurückgemeldet.
Offensichtlich überschneiden sich diese und kommen dann in falscher Reihenfolge an. :-(
Deshalb wird nicht immer der richtige Status in HomeKit angezeigt.

    "targetValue": 0,
    "value": 0,
    "min": 0,
    "pendingOperations": null,
    "max": 99,
    "guiEnabled": true,
    "operationStatus": null,
    "type": 1,
    "widgetUID": "hdm:ZWave:C9CD39AF/120",
    "itemId": null,
    "switchType": "base"

*/
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
var HBEverspringDimmerDevice = /** @class */ (function (_super) {
    __extends(HBEverspringDimmerDevice, _super);
    function HBEverspringDimmerDevice(log, dAPI, dDevice, storage, config) {
        var _this = _super.call(this, log, dAPI, dDevice, storage, config) || this;
        var self = _this;
        self.dDevice.events.on('onValueChanged', function (type, value) {
            if (type === 'base') { // "switchType": "base"
                self.log.info('%s (%s / %s) > onValueChanged > Dimmer is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.Brightness).updateValue(value, null);
                if (value > 0) {
                    self.apiGetSwitchState = 1;
                }
                else {
                    self.apiGetSwitchState = 0;
                }
                self.switchService.getCharacteristic(self.Characteristic.On).updateValue(self.apiGetSwitchState, null);
                self.log.info('%s (%s / %s) > onValueChanged > Dimmer is %s, so State is %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value, self.apiGetSwitchState);
            }
        });
        return _this;
    }
    HBEverspringDimmerDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Everspring')
            .setCharacteristic(this.Characteristic.Model, 'Dimmer')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/', '-'));
        this.switchService = new this.Service.Lightbulb(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.switchService.getCharacteristic(this.Characteristic.Brightness)
            .on('get', this.getBrightness.bind(this))
            .on('set', this.setBrightness.bind(this));
        this.switchService.getCharacteristic(this.Characteristic.Brightness).setProps({
            maxValue: 99,
            minStep: 1
        });
        var services = [this.informationService, this.switchService];
        this.dDevice.listen();
        return services;
    };
    HBEverspringDimmerDevice.prototype.getSwitchState = function (callback) {
        // no BinarySwitch
        this.apiGetBrightness = this.dDevice.getValue('base');
        if (this.apiGetBrightness > 0) {
            this.apiGetSwitchState = 1;
        }
        else {
            this.apiGetSwitchState = 0;
        }
        this.log.debug('%s (%s / %s) > getBrightness is %s, so switchState is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetBrightness, this.apiGetSwitchState);
        return callback(null, this.apiGetSwitchState);
    };
    HBEverspringDimmerDevice.prototype.getBrightness = function (callback) {
        this.apiGetBrightness = this.dDevice.getValue('base'); // "switchType": "base"
        this.log.debug('%s (%s / %s) > getBrightness is %s', this.constructor.name, this.dDevice.id, this.dDevice.name, this.apiGetBrightness);
        return callback(null, this.apiGetBrightness);
    };
    HBEverspringDimmerDevice.prototype.setSwitchState = function (value, callback) {
        // no BinarySwitch
        this.log.debug('%s (%s / %s) > setSwitchState to %s, so set setBrightness to ...', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        if (value == true) {
            this.dDevice.setTargetValue('base', 99, function (err) {
                callback();
            }, true);
        }
        if (value == false) {
            this.dDevice.setTargetValue('base', 0, function (err) {
                callback();
            }, true);
        }
    };
    HBEverspringDimmerDevice.prototype.setBrightness = function (value, callback) {
        this.log.debug('%s (%s / %s) > setBrightness to %s', this.constructor.name, this.dDevice.id, this.dDevice.name, value);
        this.dDevice.setTargetValue('base', value, function (err) {
            callback();
        }, true);
    };
    return HBEverspringDimmerDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBEverspringDimmerDevice = HBEverspringDimmerDevice;
