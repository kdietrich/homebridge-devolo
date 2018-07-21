import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBQubinoShutterDevice extends HBDevoloDevice {

    windowCoveringService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > Position value > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.windowCoveringService.getCharacteristic(self.Characteristic.CurrentPosition).updateValue(value, null);
        });
        self.dDevice.events.on('onTargetValueChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > Target position value > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.windowCoveringService.getCharacteristic(self.Characteristic.TargetPosition).updateValue(value, null);
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Qubino')
            .setCharacteristic(this.Characteristic.Model, 'Flush Shutter')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.windowCoveringService = new this.Service.WindowCovering();
        this.windowCoveringService.getCharacteristic(this.Characteristic.CurrentPosition)
                     .on('get', this.getValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition)
                     .on('get', this.getTargetValue.bind(this))
                     .on('set', this.setTargetValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition).setProps({
            minValue: 0,
            maxValue: 100,
            minStep: 5
        });

        this.dDevice.listen();
        return [this.informationService, this.windowCoveringService];
    }

    getValue(callback) {
        this.log.debug('%s (%s / %s) > getValue', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('blinds'));
    }

    getTargetValue(callback) {
        this.log.debug('%s (%s / %s) > getTargetValue', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getTargetValue('blinds'));
    }

    setTargetValue(value, callback) {
        this.log.debug('%s (%s / %s) > setTargetValue to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        if(value==this.dDevice.getTargetValue('blinds')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setTargetValue('blinds', value, function(err) {
            if(err) {
                callback(err); return;
            }
            callback();
        }, true);
    }
}