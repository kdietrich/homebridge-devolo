import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloRule extends HBDevoloDevice {

    switchService;
    heartbeatsSinceLastStateSwitch: number = 1;

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

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        return [this.informationService, this.switchService];
    }

    /* HEARTBEAT */
    heartbeat(device) {
        this.log.debug('%s (%s) > Hearbeat', (this.constructor as any).name, device.id);
        this.heartbeatsSinceLastStateSwitch++;
        if(this.heartbeatsSinceLastStateSwitch <= 1) {
            this.log.debug('%s (%s) > Skip this heartbeat because of fast switching.', (this.constructor as any).name, device.id);
            return;
        }
        var self = this;
        /* Service.Switch */
        var oldEnabled = self.dDevice.getEnabled();
        if(device.getEnabled() != oldEnabled) {
            self.log.info('%s (%s) > Enabled %s > %s', (this.constructor as any).name, device.id, oldEnabled, device.getEnabled());
            self.dDevice.setEnabled(device.getEnabled(), function(err) {
                self.switchService.setCharacteristic(self.Characteristic.On, device.getEnabled());
            });
        }
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