import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloSirenDevice extends HBDevoloDevice {

    securitySystemService;
    currentState: number;


    constructor(log, dAPI: Devolo, dDevice: Device, storage) {
        super(log, dAPI, dDevice, storage);

        var self = this;

        self.currentState = storage.getItemSync('hbd-siren-state');
        if(self.currentState===undefined) {
            self.currentState = 3;
            storage.setItem('hbd-siren-state', self.currentState);
        }

    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Siren')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')


        this.securitySystemService = new this.Service.SecuritySystem();
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState)
                     .on('get', this.getSecuritySystemCurrentState.bind(this))
                     .on('set', this.setSecuritySystemCurrentState.bind(this));
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState)
                     .on('get', this.getSecuritySystemTargetState.bind(this))
                     .on('set', this.setSecuritySystemTargetState.bind(this));

        this.dDevice.listen();

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        return [this.informationService, this.securitySystemService];
    }

    getSecuritySystemCurrentState(callback) {
        this.log.debug('%s > getSecuritySystemCurrentState', (this.constructor as any).name);
        return callback(null, this.currentState);
    }

    setSecuritySystemCurrentState(value, callback) {
        this.log.debug('%s (%s) > setSecuritySystemCurrentState to %s', (this.constructor as any).name, this.dDevice.id, value);
        this.currentState = value;
        this.storage.setItem('hbd-siren-state', value);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState).updateValue(value, null);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState).updateValue(value, null);
        return callback();
    }

    getSecuritySystemTargetState(callback) {
        this.log.debug('%s > getSecuritySystemTargetState', (this.constructor as any).name);
        return callback(null, this.currentState);
    }

    setSecuritySystemTargetState(value, callback) {
        this.log.debug('%s (%s) > setSecuritySystemTargetState to %s', (this.constructor as any).name, this.dDevice.id, value);
        this.currentState = value;
        this.storage.setItem('hbd-siren-state', value);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemCurrentState).updateValue(value, null);
        this.securitySystemService.getCharacteristic(this.Characteristic.SecuritySystemTargetState).updateValue(value, null);
        return callback();
    }


}