"use strict";
var HBDevoloSwitchMeterDevice_1 = require("./devices/HBDevoloSwitchMeterDevice");
var HBDevoloHumidityDevice_1 = require("./devices/HBDevoloHumidityDevice");
var HBDevoloDoorWindowDevice_1 = require("./devices/HBDevoloDoorWindowDevice");
var HBDevoloMotionDevice_1 = require("./devices/HBDevoloMotionDevice");
var HBDevoloFloodDevice_1 = require("./devices/HBDevoloFloodDevice");
var DevoloDevice_1 = require("node-devolo/dist/DevoloDevice");
var Homebridge;
var Service;
var Characteristic;
var HBDevoloCentralUnit = (function () {
    function HBDevoloCentralUnit(log, dAPI) {
        this.accessoryList = [];
        this.heartBeating = false;
        this.log = log;
        this.dAPI = dAPI;
        this.log.debug('%s > Initializing', this.constructor.name);
        this.name = 'Devolo Central Unit';
        this.heartrate = 3;
    }
    HBDevoloCentralUnit.prototype.setHomebridge = function (homebridge) {
        Homebridge = homebridge;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
    };
    HBDevoloCentralUnit.prototype.accessories = function (callback) {
        var self = this;
        this.findAccessories(function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, self.accessoryList);
        });
    };
    HBDevoloCentralUnit.prototype.getServices = function () {
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(Characteristic.Model, 'Central Unit');
        //.setCharacteristic(Characteristic.SerialNumber, 'ABCDEFGHI')
        return [this.informationService];
    };
    /* HEARTBEAT */
    HBDevoloCentralUnit.prototype.heartbeat = function (beat) {
        var self = this;
        if ((beat % this.heartrate) === 0 && !self.heartBeating) {
            this.log.debug('%s > Heartbeat', this.constructor.name);
            self.heartBeating = true;
            var deviceIDs = [];
            for (var i = 0; i < this.accessoryList.length; i++) {
                deviceIDs.push(this.accessoryList[i].dDevice.id);
            }
            self.dAPI.getDevices(deviceIDs, function (err, devices) {
                if (err) {
                    self.log.error(err);
                }
                else {
                    var itemsProcessed = 0;
                    devices.forEach(function (refreshedDevice) {
                        var oldDevice = null;
                        for (var i = 0; i < self.accessoryList.length; i++) {
                            if (refreshedDevice.id == self.accessoryList[i].dDevice.id) {
                                oldDevice = self.accessoryList[i];
                            }
                        }
                        if (oldDevice) {
                            oldDevice.heartbeat(refreshedDevice);
                        }
                        itemsProcessed++;
                        if (itemsProcessed === devices.length) {
                            self.heartBeating = false;
                            self.log.debug('%s > Heartbeat: %s done', self.constructor.name, beat);
                        }
                    });
                }
                self.heartBeating = false;
            });
        }
    };
    HBDevoloCentralUnit.prototype.findAccessories = function (callback) {
        //this.accessoryList.push(new HBDevoloDevice(this.log));
        var self = this;
        this.dAPI.getAllDevices(function (err, devices) {
            if (err) {
                callback(err);
                return;
            }
            //console.log(JSON.stringify(devices, null, 4));
            for (var i = 0; i < devices.length; i++) {
                var d = null;
                if (devices[i].constructor.name == DevoloDevice_1.SwitchMeterDevice.name) {
                    d = new HBDevoloSwitchMeterDevice_1.HBDevoloSwitchMeterDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.HumidityDevice.name) {
                    d = new HBDevoloHumidityDevice_1.HBDevoloHumidityDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.DoorWindowDevice.name) {
                    d = new HBDevoloDoorWindowDevice_1.HBDevoloDoorWindowDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.MotionDevice.name) {
                    d = new HBDevoloMotionDevice_1.HBDevoloMotionDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.FloodDevice.name) {
                    d = new HBDevoloFloodDevice_1.HBDevoloFloodDevice(self.log, self.dAPI, devices[i]);
                }
                else {
                    self.log.info("%s > Device \"%s\" is not supported (yet). Open an issue on github and ask for adding it.", self.constructor.name, devices[i].model);
                }
                if (d) {
                    d.setHomebridge(Homebridge);
                    self.accessoryList.push(d);
                }
            }
            callback(null);
        });
    };
    return HBDevoloCentralUnit;
}());
exports.HBDevoloCentralUnit = HBDevoloCentralUnit;
