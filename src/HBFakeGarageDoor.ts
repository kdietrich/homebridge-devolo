import {HBIDevoloDevice} from './HBDevoloMisc';
import {Devolo} from 'node-devolo/dist/Devolo';
import {Device} from 'node-devolo/dist/DevoloDevice';

const moment = require('moment');
const shell = require('shelljs');

export class HBFakeGarageDoor implements HBIDevoloDevice {

    log;
    name: string;
    dAPI: Devolo;
    uuid_base: string;
    storage;
    config;
    Homebridge;
    Service;
    Characteristic;

    dDoorDevice: Device;
    dRelayDevice: Device;
    garageDoorLastTargetDoorState;
    garageDoorLastCurrentDoorState;

    informationService;
    garageDoorOpenerService;


    constructor(log, dAPI: Devolo, dDevices: Device[], storage, config) {
        this.log = log;
        this.dAPI = dAPI;
        this.log.debug('%s > Initializing', (this.constructor as any).name);

        for(var i=0; i<dDevices.length; i++) {
            if(dDevices[i].name == config.fakeGaragedoorParams.doorDevice)
                this.dDoorDevice = dDevices[i];
            else if(dDevices[i].name == config.fakeGaragedoorParams.relayDevice)
                this.dRelayDevice = dDevices[i];
        }

        this.name = 'GarageDoor';
        this.uuid_base = 'g4r4g3d00r';
        this.storage = storage;
        this.config = config;

        var self = this;

        self.dDoorDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > State > %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, state);

            // state = 0 = contact is CLOSED = GarageDoorState = 1 || state = 1 = contact is OPENED = GarageDoorState = 0
            if(state === self.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED) {
                // GARAGEDOOR = CLOSED > OPEN
                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.TargetDoorState).updateValue(self.Characteristic.TargetDoorState.OPEN, null);
                self.log.debug('%s (%s / %s) > onStateChanged > TargetDoorState was %s, set to %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastTargetDoorState), self.mappingDoorState(self.Characteristic.TargetDoorState.OPEN));
                self.garageDoorLastTargetDoorState = self.Characteristic.TargetDoorState.OPEN;

                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPENING, null);
                self.log.debug('%s (%s / %s) > onStateChanged > CurrentDoorState was %s, set to %s - OpeningTime is %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastTargetDoorState), self.mappingDoorState(self.Characteristic.CurrentDoorState.OPENING), self.config.fakeGaragedoorParams.openTime);
                self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPENING;

                setTimeout(function() {
                    /// Bugfixing "if" || Close > Push > Open > Push, Push > Close
                    if(self.garageDoorLastTargetDoorState === self.Characteristic.TargetDoorState.OPEN && self.garageDoorLastCurrentDoorState !== self.Characteristic.CurrentDoorState.STOPPED) {
                        self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPEN, null);
                        self.log.debug('%s (%s / %s) > onStateChanged > CurrentDoorState was %s, set to %s - OpeningTime was %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastCurrentDoorState), self.mappingDoorState(self.Characteristic.CurrentDoorState.OPEN), self.config.fakeGaragedoorParams.openTime);
                        self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPEN;
                    }
                }, self.config.fakeGaragedoorParams.openTime*1000);

            } else {
                // GARAGEDOOR = OPEN || OPENING || CLOSING || STOPPED > CLOSE
                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.TargetDoorState).updateValue(self.Characteristic.TargetDoorState.CLOSED, null);
                self.log.debug('%s (%s / %s) > onStateChanged > TargetDoorState was %s, set to %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastTargetDoorState), self.mappingDoorState(self.Characteristic.TargetDoorState.CLOSED));
                self.garageDoorLastTargetDoorState = self.Characteristic.TargetDoorState.CLOSED;

                self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.CLOSED, null);
                self.log.debug('%s (%s / %s) > onStateChanged > CurrentDoorState was %s, set to %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastCurrentDoorState), self.mappingDoorState(self.Characteristic.CurrentDoorState.CLOSED));
                self.garageDoorLastCurrentDoorState =  self.Characteristic.CurrentDoorState.CLOSED;
            }
        });

    }

    setHomebridge(homebridge) {
        this.Homebridge = homebridge;
        this.Service = homebridge.hap.Service;
        this.Characteristic = homebridge.hap.Characteristic;
    }

    accessories() : HBIDevoloDevice[] {
        return [];
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Fake')
            .setCharacteristic(this.Characteristic.Model, 'GarageDoor')
            .setCharacteristic(this.Characteristic.SerialNumber, 'g4r4g3d00r');

        this.garageDoorOpenerService = new this.Service.GarageDoorOpener(this.name);
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState)
                     .on('get', this.getCurrentDoorState.bind(this))
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState)
                     .on('get', this.getTargetDoorState.bind(this))
                     .on('set', this.setTargetDoorState.bind(this));
        this.garageDoorOpenerService.getCharacteristic(this.Characteristic.ObstructionDetected)

        // dDoorDevice.state = 0 = contact is CLOSED = GarageDoorState = 1 || dDoorDevice.state = 1 = contact is OPENED = GarageDoorState = 0
        this.garageDoorLastCurrentDoorState = (this.dDoorDevice.getState() ? 0 : 1);
        this.garageDoorLastTargetDoorState = (this.dDoorDevice.getState() ? 0 : 1);

        this.dDoorDevice.listen();
        this.dRelayDevice.listen();

        return [this.informationService, this.garageDoorOpenerService];
    }

    getCurrentDoorState(callback) {
        // dDoorDevice.state = 0 = contact is CLOSED = GarageDoorState = 1 || dDoorDevice.state = 1 = contact is OPENED = GarageDoorState = 0
        this.log.debug('%s (%s / %s) > getCurrentDoorState',  (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name);
        return callback(null, !this.dDoorDevice.getState());
    }

    getTargetDoorState(callback) {
        // dDoorDevice.state = 0 = contact is CLOSED = GarageDoorState = 1 || dDoorDevice.state = 1 = contact is OPENED = GarageDoorState = 0
        this.log.debug('%s (%s / %s) > getTargetDoorState',  (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name);
        return callback(null, !this.dDoorDevice.getState());
    }

    setTargetDoorState(value, callback) {
        this.log.debug('%s (%s / %s) > setTargetDoorState to %s', (this.constructor as any).name, this.dRelayDevice.id, this.dRelayDevice.name, value);

        /*
        this.dRelayDevice.turnOn(function(err) {
            if(err) {
                callback(err); return;
            }
            callback();
        });
        */

        var self = this;
        self.dRelayDevice.turnOn(function(err) {
            if(err) {
                callback(err); return;
            }
            self.dRelayDevice.turnOff(function(err) {
                if(err) {
                    callback(err); return;
                }
                callback();
            });
        });

        if(this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.CLOSED) {
            // GARAGEDOOR = CLOSED > OPENING
            //// onStateChanged set TargetDoorState to OPEN, CurrentDoorState to OPENING and later CurrentDoorState to OPEN

            /*
            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.OPEN, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastTargetDoorState), this.mappingDoorState(this.Characteristic.TargetDoorState.OPEN), this.config.fakeGaragedoorParams.openTime);
            this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.OPEN;

            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.OPENING, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s - OpeningTime is %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastCurrentDoorState), this.mappingDoorState(this.Characteristic.CurrentDoorState.OPENING), this.config.fakeGaragedoorParams.openTime);
            this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.OPENING;

            var self = this;
            setTimeout(function() {
                /// Bugfixing "if" || Close > Push > Open > Push, Push > Close
                if(self.garageDoorLastTargetDoorState === self.Characteristic.TargetDoorState.OPEN) {
                    self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPEN, null);
                    self.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s - OpeningTime was %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastCurrentDoorState), self.mappingDoorState(self.Characteristic.CurrentDoorState.OPEN), self.config.fakeGaragedoorParams.openTime);
                    self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPEN;
                }
            }, self.config.fakeGaragedoorParams.openTime*1000);
            */

        } else if (this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.OPEN) {
            // GARAGEDOOR = OPEN > CLOSING
            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.CLOSED, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastTargetDoorState), this.mappingDoorState(this.Characteristic.TargetDoorState.CLOSED));
            this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.CLOSED;

            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.CLOSING, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastCurrentDoorState), this.mappingDoorState(this.Characteristic.CurrentDoorState.CLOSING));
            this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.CLOSING;

            //// onStateChanged set CurrentDoorState to CLOSED

        } else if (this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.OPENING || this.garageDoorLastCurrentDoorState === this.Characteristic.CurrentDoorState.CLOSING ) {
            // GARAGEDOOR = OPENING/CLOSING > STOPPED
            this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.STOPPED, null);
            this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s (OPENING/CLOSING), set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastCurrentDoorState), this.mappingDoorState(this.Characteristic.CurrentDoorState.STOPPED));
            this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.STOPPED;

        } else {
            // GARAGEDOOR = STOPPED > OPENING/CLOSING
            if(this.garageDoorLastTargetDoorState === this.Characteristic.TargetDoorState.CLOSED) {
                // GARAGEDOOR = TARGET CLOSED > OPENING
                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.OPEN, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastTargetDoorState), this.mappingDoorState(this.Characteristic.TargetDoorState.OPEN));
                this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.OPEN;

                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.OPENING, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s - OpeningTime is %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastCurrentDoorState), this.mappingDoorState(this.Characteristic.CurrentDoorState.OPENING), this.config.fakeGaragedoorParams.openTime);
                this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.OPENING;

                var self = this;
                setTimeout(function() {
                    /// Bugfixing "if" || Close > Push > Open > Push, Push > Close
                    if(self.garageDoorLastTargetDoorState === self.Characteristic.TargetDoorState.OPEN) {
                        self.garageDoorOpenerService.getCharacteristic(self.Characteristic.CurrentDoorState).updateValue(self.Characteristic.CurrentDoorState.OPEN, null);
                        self.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s - OpeningTime was %s', (self.constructor as any).name, self.dDoorDevice.id, self.dDoorDevice.name, self.mappingDoorState(self.garageDoorLastCurrentDoorState), self.mappingDoorState(self.Characteristic.CurrentDoorState.OPEN), self.config.fakeGaragedoorParams.openTime);
                        self.garageDoorLastCurrentDoorState = self.Characteristic.CurrentDoorState.OPEN;
                    }
                }, self.config.fakeGaragedoorParams.openTime*1000);

            } else {
                // GARAGEDOOR = TARGET OPEN > CLOSING
                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).updateValue(this.Characteristic.TargetDoorState.CLOSED, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > TargetDoorState was %s, set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastTargetDoorState), this.mappingDoorState(this.Characteristic.TargetDoorState.CLOSED));
                this.garageDoorLastTargetDoorState = this.Characteristic.TargetDoorState.CLOSED;

                this.garageDoorOpenerService.getCharacteristic(this.Characteristic.CurrentDoorState).updateValue(this.Characteristic.CurrentDoorState.CLOSING, null);
                this.log.debug('%s (%s / %s) > setTargetDoorState > CurrentDoorState was %s, set to %s', (this.constructor as any).name, this.dDoorDevice.id, this.dDoorDevice.name, this.mappingDoorState(this.garageDoorLastCurrentDoorState), this.mappingDoorState(this.Characteristic.CurrentDoorState.CLOSING));
                this.garageDoorLastCurrentDoorState = this.Characteristic.CurrentDoorState.CLOSING;

                //// onStateChanged set CurrentDoorState to CLOSED
            }
        }

        //console.log (this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).getValue())
        //this.garageDoorOpenerService.getCharacteristic(this.Characteristic.TargetDoorState).getValue(function(err, val) {
            //console.log(val);
        //});
    }

    mappingDoorState(doorstate) {
        switch (doorstate) {
            case 0: return "OPEN";
            case 1: return "CLOSED";
            case 2: return "OPENING";
            case 3: return "CLOSING";
            case 4: return "STOPPED";
        }
    }

}