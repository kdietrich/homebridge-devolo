"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBDevoloRemoteControlDevice = (function (_super) {
    __extends(HBDevoloRemoteControlDevice, _super);
    function HBDevoloRemoteControlDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        _this.statelessProgrammableSwitchList = [];
        var self = _this;
        self.dDevice.events.on('onKeyPressedChanged', function (value) {
            if (value == 3) {
                value = 2;
            }
            else if (value == 2) {
                value = 3;
            }
            if (value != 0) {
                self.log.info('%s (%s / %s) > KeyPressed > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, value);
                self.statelessProgrammableSwitchList[value - 1].getCharacteristic(self.Characteristic.ProgrammableSwitchEvent).emit('change', { newValue: 0 });
            }
        });
        return _this;
    }
    HBDevoloRemoteControlDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Remote Control');
        // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')
        for (var i = 0; i < this.dDevice.getKeyCount(); i++) {
            var statelessProgrammableSwitch = new this.Service.StatelessProgrammableSwitch(this.name);
            statelessProgrammableSwitch.subtype = this.name + i;
            statelessProgrammableSwitch.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).setProps({
                maxValue: 0
            });
            this.statelessProgrammableSwitchList[this.dDevice.getKeyCount() - i - 1] = statelessProgrammableSwitch;
        }
        this.dDevice.listen();
        return [this.informationService].concat(this.statelessProgrammableSwitchList);
    };
    return HBDevoloRemoteControlDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBDevoloRemoteControlDevice = HBDevoloRemoteControlDevice;
