import {HBIDevoloDevice} from './HBDevoloMisc';
import {Devolo} from 'node-devolo/dist/Devolo';
import {Device} from 'node-devolo/dist/DevoloDevice';

export abstract class HBDevoloDevice implements HBIDevoloDevice {

    log;
    uuid_base: string;
    name: string;
    dAPI: Devolo;
    dDevice: Device;
    informationService;
    Homebridge;
    Service;
    Characteristic;

    constructor(log, dAPI: Devolo, dDevice: Device) {
        this.log = log;
        this.dAPI = dAPI;
        this.dDevice = dDevice;
        this.log.debug('%s > Initializing', (this.constructor as any).name);
        this.name = this.dDevice.name;
        this.uuid_base = this.dDevice.id;
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
        return [];
    };

}