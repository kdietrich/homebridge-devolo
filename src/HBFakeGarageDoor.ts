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

        this.name = this.dDoorDevice.name;
        this.uuid_base = this.dDoorDevice.id;
        this.storage = storage;
        this.config = config;

        //TODO: add on change listeners

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
            .setCharacteristic(this.Characteristic.Model, 'Garagedoor')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDoorDevice.id.replace('/','-'));

        this.garageDoorOpenerService = new this.Service.GarageDoorOpener(this.name);
        //TODO: add service configuration

        this.dDoorDevice.listen();
        this.dRelayDevice.listen();

        return [this.informationService, this.garageDoorOpenerService];
    };

}