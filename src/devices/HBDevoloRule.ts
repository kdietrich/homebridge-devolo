import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloRule extends HBDevoloDevice {

    switchService;

    apiGetSwitchState;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onEnabledChanged', function(value: boolean) {
            self.log.info('%s (%s / %s) > onEnabledChanged > Enabled is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(value, null);
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Rule')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
                     .on('get', this.getSwitchState.bind(this))
                     .on('set', this.setSwitchState.bind(this));

        this.dDevice.listen();
        return [this.informationService, this.switchService];
    }

    getSwitchState(callback) {
        this.apiGetSwitchState = this.dDevice.getEnabled();
        this.log.debug('%s (%s / %s) > getSwitchState is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetSwitchState);
        return callback(null, this.apiGetSwitchState);
    }

    setSwitchState(value, callback) {
        this.log.debug('%s (%s / %s) > setSwitchState to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        if(value==this.dDevice.getEnabled()) {
            callback();
            return;
        }
        callback('Rules cannot be switched right now.'); return;
    }
}