"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment = require('moment');
var shell = require('shelljs');
var HBDevoloDevice = /** @class */ (function () {
    function HBDevoloDevice(log, dAPI, dDevice, storage, config) {
        this.log = log;
        this.dAPI = dAPI;
        this.dDevice = dDevice;
        this.log.debug('%s > Initializing', this.constructor.name);
        this.name = this.dDevice.name;
        this.uuid_base = this.dDevice.id;
        this.storage = storage;
        this.config = config;
        // FakeGato (eve app)
        this.displayName = this.dDevice.id.replace('/', '-'); // shit, hardcoded by simont77 for "filename"
    }
    HBDevoloDevice.prototype.setHomebridge = function (homebridge) {
        this.Homebridge = homebridge;
        this.Service = homebridge.hap.Service;
        this.Characteristic = homebridge.hap.Characteristic;
    };
    HBDevoloDevice.prototype.accessories = function () {
        return [];
    };
    HBDevoloDevice.prototype.getServices = function () {
        return [];
    };
    ;
    HBDevoloDevice.prototype._isInList = function (name, list) {
        for (var i = 0; i < list.length; i++) {
            if (name === list[i])
                return true;
        }
        return false;
    };
    // START FakeGato (eve app)
    HBDevoloDevice.prototype.AddFakeGatoHistory = function (type, disTimer) {
        var folder = this.Homebridge.user.storagePath() + '/.homebridge-devolo/fakegato-history';
        shell.mkdir('-p', folder);
        var FakeGatoHistoryService = require('fakegato-history')(this.Homebridge);
        this.log.info("%s (%s / %s) > FakeGato initialized (%s).", this.constructor.name, this.dDevice.id, this.dDevice.name, folder);
        this.loggingService = new FakeGatoHistoryService(type, this, { storage: 'fs', path: folder, disableTimer: disTimer });
    };
    HBDevoloDevice.prototype.AddFakeGatoEntry = function (data) {
        if ((this.loggingService != undefined) && (data != undefined)) {
            data.time = moment().unix();
            this.loggingService.addEntry(data);
            this.log.debug("%s (%s / %s) > FakeGato > New entry saved: %s.", this.constructor.name, this.dDevice.id, this.dDevice.name, JSON.stringify(data));
        }
    };
    return HBDevoloDevice;
}());
exports.HBDevoloDevice = HBDevoloDevice;
