import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloScene extends HBDevoloDevice {

    switchService;

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Scene')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.switchService = new this.Service.Switch(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
                     .on('get', this.getSwitchState.bind(this))
                     .on('set', this.setSwitchState.bind(this));

        return [this.informationService, this.switchService];
    }

    getSwitchState(callback) {
        this.log.debug('%s (%s / %s) > getSwitchState', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, false);
    }

    setSwitchState(value, callback) {
        this.log.debug('%s (%s / %s) > setSwitchState to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        var self = this;
        if(value) {
            this.dDevice.invoke(function(err) {
                if(err) {
                    callback(err); return;
                }
                setTimeout(function() {
                    self.switchService.setCharacteristic(self.Characteristic.On, false);
                }, 100);
                callback();
            });
        }
        else
            callback();
    }
}