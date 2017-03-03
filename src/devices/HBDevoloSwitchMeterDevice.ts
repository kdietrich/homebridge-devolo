import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloSwitchMeterDevice extends HBDevoloDevice {

    switchService;
    heartbeatsSinceLastStateSwitch: number = 1;

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Smart Metering Plug')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

        this.switchService = new this.Service.Outlet(this.name);
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
        /* Service.Outlet */
        var oldState = self.dDevice.getState();
        if(device.getState() != oldState) {
            self.log.info('%s (%s) > State %s > %s', (this.constructor as any).name, device.id, oldState, device.getState());
            self.dDevice.setState(device.getState(), function(err) {
                self.switchService.setCharacteristic(self.Characteristic.On, (device.getState()==1));
            });
        }
    }

    getSwitchState(callback) {
        this.log.debug('%s (%s) > getSwitchState', (this.constructor as any).name, this.dDevice.id);
        return callback(null, this.dDevice.getState()!=0);
    }

    setSwitchState(value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', (this.constructor as any).name, this.dDevice.id, value);
        if(value==this.dDevice.getState()) {
            callback();
            return;
        }
        var self = this;
        if(value) {
            this.dDevice.turnOn(function(err) {
                self.heartbeatsSinceLastStateSwitch = 0;
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function(err) {
                self.heartbeatsSinceLastStateSwitch = 0;
                callback();
            });
        }
    }

}