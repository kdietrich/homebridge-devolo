import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloSwitchMeterDevice extends HBDevoloDevice {

    switchService;

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
        this.log.debug('%s > Hearbeat', (this.constructor as any).name);
        var self = this;
        /* Service.Outlet */
        var oldState = self.dDevice.getState();
        if(device.getState() != oldState) {
            self.log.info('%s > State %s > %s', (this.constructor as any).name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function(err) { });
            self.switchService.setCharacteristic(self.Characteristic.On, (device.getState()==1));
        }
    }

    getSwitchState(callback) {
        this.log.debug('%s > getSwitchState', (this.constructor as any).name);
        return callback(null, this.dDevice.getState()!=0);
    }

    setSwitchState(value, callback) {
        this.log.debug('%s > setSwitchState to %s', (this.constructor as any).name, value);
        if(value==this.dDevice.getState())
            return;
        if(value) {
            this.dDevice.turnOn(function(err) {
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function(err) {
                callback();
            });
        }
    }

}