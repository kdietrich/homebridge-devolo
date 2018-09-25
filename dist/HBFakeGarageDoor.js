"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment = require('moment');
var shell = require('shelljs');
var HBFakeGarageDoor = /** @class */ (function () {
    function HBFakeGarageDoor(log, dAPI, dDevices, storage, config) {
        this.log = log;
        this.dAPI = dAPI;
        this.log.debug('%s > Initializing', this.constructor.name);
        for (var i = 0; i < dDevices.length; i++) {
            if (dDevices[i].name == config.fakeGaragedoorParams.doorDevice)
                this.dDoorDevice = dDevices[i];
            else if (dDevices[i].name == config.fakeGaragedoorParams.relayDevice)
                this.dRelayDevice = dDevices[i];
        }
        this.name = 'GarageDoor';
        this.uuid_base = 'g4r4g3d00r';
        this.storage = storage;
        this.config = config;
        var self = this;
        self.dDoorDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, state);
            // state = 0 = contact is CLOSED = GarageDoorState = 1 || state = 1 = contact is OPENED = GarageDoorState = 0
            if (state === self.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED) {
                // GARAGEDOOR = CLOSED > OPEN
                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.TargetDoorState).updateValue(self.Characteristic.TargetDoorState.OPEN, null);
                self.log.debug('%s (%s / %s) > onStateChanged > TargetDoorState was %s, set to %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, self.convertDoorstateIDToText(self.garageDoorLastTargetDoorState), self.convertDoorstateIDToText(self.Characteristic.TargetDoorState.OPEN));
                self.garageDoorLastTargetDoorState = self.Characteristic.TargetDoorState.OPEN;
                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPENING, null);
                self.log.debug('%s (%s / %s) > onStateChanged > CurrentDoorState was %s, set to %s - OpeningTime is %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, self.convertDoorstateIDToText(self.garageDoorLastTargetDoorState), self.convertDoorstateIDToText(self.Characteristic.CurrentDoorState.OPENING), self.config.fakeGaragedoorParams.openTime);
                self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPENING;
                setTimeout(function () {
                    /// Bugfixing "if" || Close > Push > Open > Push, Push > Close
                    if (self.garageDoorLastTargetDoorState === self.Characteristic.TargetDoorState.OPEN && self.garageDoorLastCurrentDoorState !== self.Characteristic.CurrentDoorState.STOPPED) {
                        self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPEN, null);
                        self.log.debug('%s (%s / %s) > onStateChanged > CurrentDoorState was %s, set to %s - OpeningTime was %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, self.convertDoorstateIDToText(self.garageDoorLastCurrentDoorState), self.convertDoorstateIDToText(self.Characteristic.CurrentDoorState.OPEN), self.config.fakeGaragedoorParams.openTime);
                        self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPEN;
                    }
                }, self.config.fakeGaragedoorParams.openTime * 1000);
            }
            else {
                // GARAGEDOOR = OPEN || OPENING || CLOSING || STOPPED > CLOSE
                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.TargetDoorState).updateValue(self.Characteristic.TargetDoorState.CLOSED, null);
                self.log.debug('%s (%s / %s) > onStateChanged > TargetDoorState was %s, set to %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, self.convertDoorstateIDToText(self.garageDoorLastTargetDoorState), self.convertDoorstateIDToText(self.Characteristic.TargetDoorState.CLOSED));
                self.garageDoorLastTargetDoorState = self.Characteristic.TargetDoorState.CLOSED;
                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.CLOSED, null);
                self.log.debug('%s (%s / %s) > onStateChanged > CurrentDoorState was %s, set to %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, self.convertDoorstateIDToText(self.garageDoorLastCurrentDoorState), self.convertDoorstateIDToText(self.Characteristic.CurrentDoorState.CLOSED));
                self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.CLOSED;
            }
        });
    }
    HBFakeGarageDoor.prototype.setHomebridge = function (homebridge) {
        this.Homebridge = homebridge;
        this.Service = homebridge.hap.Service;
        this.Characteristic = homebridge.hap.Characteristic;
    };
    HBFakeGarageDoor.prototype.accessories = function () {
        return [];
    };
    HBFakeGarageDoor.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Fake')
            .setCharacteristic(this.Characteristic.Model, 'GarageDoor')
            .setCharacteristic(this.Characteristic.SerialNumber, 'g4r4g3d00r');
        this.garageDoorOpenerService = new this.Service.GarageDoorOpener(this.name);
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState)
            .on('get', this.getCurrentDoorState.bind(this));
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState)
            .on('get', this.getTargetDoorState.bind(this))
            .on('set', this.setTargetDoorState.bind(this));
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.ObstructionDetected);
        // dDoorDevice.state = 0 = contact is CLOSED = GarageDoorState = 1 || dDoorDevice.state = 1 = contact is OPENED = GarageDoorState = 0
        this.garageDoorLastCurrentDoorState = (this.dDoorDevice.getState() ? 0 : 1);
        this.garageDoorLastTargetDoorState = (this.dDoorDevice.getState() ? 0 : 1);
        // No notification when homebridge starts/restart, because default state 0 is open
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.garageDoorLastCurrentDoorState, null);
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.garageDoorLastTargetDoorState, null);
        this.dDoorDevice.listen();
        this.dRelayDevice.listen();
        return [this.informationService, this.garageDoorOpenerService];
    };
    HBFakeGarageDoor.prototype.getCurrentDoorState = function (callback) {
        // dDoorDevice.state = 0 = contact is CLOSED = GarageDoorState = 1 || dDoorDevice.state = 1 = contact is OPENED = GarageDoorState = 0
        this.log.debug('%s (%s / %s) > getCurrentDoorState', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name);
        return callback(null, !this.dDoorDevice.getState());
    };
    HBFakeGarageDoor.prototype.getTargetDoorState = function (callback) {
        // dDoorDevice.state = 0 = contact is CLOSED = GarageDoorState = 1 || dDoorDevice.state = 1 = contact is OPENED = GarageDoorState = 0
        this.log.debug('%s (%s / %s) > getTargetDoorState', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name);
        return callback(null, !this.dDoorDevice.getState());
    };
    HBFakeGarageDoor.prototype.setTargetDoorState = function (value, callback) {
        this.log.debug('%s (%s / %s) > setTargetDoorState to %s', this.constructor.name, this.dRelayDevice.id, this.dRelayDevice.name, value);
        /*
        this.dRelayDevice.turnOn(function(err) {
            if(err) {
                callback(err); return;
            }
            callback();
        });
        */
        var self = this;
        self.dRelayDevice.turnOn(function (err) {
            if (err) {
                callback(err);
                return;
            }
            self.dRelayDevice.turnOff(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        });
        if (this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.CLOSED) {
            // GARAGEDOOR = CLOSED > OPENING
            //// onStateChanged set TargetDoorState to OPEN, CurrentDoorState to OPENING and later CurrentDoorState to OPEN
        }
        else if (this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.OPEN) {
            // GARAGEDOOR = OPEN > CLOSING
            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.CLOSED, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastTargetDoorState), this.convertDoorstateIDToText(this.Characteristic.TargetDoorState.CLOSED));
            this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.CLOSED;
            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.CLOSING, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastCurrentDoorState), this.convertDoorstateIDToText(this.Characteristic.CurrentDoorState.CLOSING));
            this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.CLOSING;
            //// onStateChanged set CurrentDoorState to CLOSED
        }
        else if (this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.OPENING || this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.CLOSING) {
            // GARAGEDOOR = OPENING/CLOSING > STOPPED
            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.STOPPED, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s (OPENING/CLOSING), set to %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastCurrentDoorState), this.convertDoorstateIDToText(this.Characteristic.CurrentDoorState.STOPPED));
            this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.STOPPED;
        }
        else {
            // GARAGEDOOR = STOPPED > OPENING/CLOSING
            if (this.garageDoorLastTargetDoorState === this.Characteristic.TargetDoorState.CLOSED) {
                // GARAGEDOOR = TARGET CLOSED > OPENING
                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.OPEN, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastTargetDoorState), this.convertDoorstateIDToText(this.Characteristic.TargetDoorState.OPEN));
                this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.OPEN;
                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.OPENING, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s - OpeningTime is %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastCurrentDoorState), this.convertDoorstateIDToText(this.Characteristic.CurrentDoorState.OPENING), this.config.fakeGaragedoorParams.openTime);
                this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.OPENING;
                var self = this;
                setTimeout(function () {
                    /// Bugfixing "if" || Close > Push > Open > Push, Push > Close
                    if (self.garageDoorLastTargetDoorState === self.Characteristic.TargetDoorState.OPEN) {
                        self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPEN, null);
                        self.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s - OpeningTime was %s', self.constructor.name, self.dDoorDevice.id, self.dDoorDevice.name, self.convertDoorstateIDToText(self.garageDoorLastCurrentDoorState), self.convertDoorstateIDToText(self.Characteristic.CurrentDoorState.OPEN), self.config.fakeGaragedoorParams.openTime);
                        self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPEN;
                    }
                }, self.config.fakeGaragedoorParams.openTime * 1000);
            }
            else {
                // GARAGEDOOR = TARGET OPEN > CLOSING
                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.CLOSED, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastTargetDoorState), this.convertDoorstateIDToText(this.Characteristic.TargetDoorState.CLOSED));
                this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.CLOSED;
                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.CLOSING, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s', this.constructor.name, this.dDoorDevice.id, this.dDoorDevice.name, this.convertDoorstateIDToText(this.garageDoorLastCurrentDoorState), this.convertDoorstateIDToText(this.Characteristic.CurrentDoorState.CLOSING));
                this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.CLOSING;
                //// onStateChanged set CurrentDoorState to CLOSED
            }
        }
    };
    HBFakeGarageDoor.prototype.convertDoorstateIDToText = function (doorstate) {
        switch (doorstate) {
            case 0: return "OPEN";
            case 1: return "CLOSED";
            case 2: return "OPENING";
            case 3: return "CLOSING";
            case 4: return "STOPPED";
        }
    };
    return HBFakeGarageDoor;
}());
exports.HBFakeGarageDoor = HBFakeGarageDoor;
