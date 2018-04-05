import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloRule extends HBDevoloDevice {

    switchService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage) {
        super(log, dAPI, dDevice, storage);

        var self = this;
        self.dDevice.events.on('onEnabledChanged', function(value: boolean) {
            self.log.info('%s (%s / %s) > Enabled > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(value, null);
        });

    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Rule')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
                     .on('get', this.getSwitchState.bind(this))
                     .on('set', this.setSwitchState.bind(this));

        this.dDevice.listen();

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        return [this.informationService, this.switchService];
    }

    getSwitchState(callback) {
        this.log.debug('%s (%s) > getSwitchState', (this.constructor as any).name, this.dDevice.id);
        return callback(null, this.dDevice.getEnabled());
    }

    setSwitchState(value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', (this.constructor as any).name, this.dDevice.id, value);
        if(value==this.dDevice.getEnabled()) {
            callback();
            return;
        }
        callback('Rules cannot be switched right now.'); return;
    }

}