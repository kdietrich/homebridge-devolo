import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloSwitchMeterDevice extends HBDevoloDevice {

    switchService;

    constructor(log, dAPI: Devolo, dDevice: Device) {
        super(log, dAPI, dDevice);

        var self = this;
        self.dDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > State > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function(type: string, value: number) {
            if(type==='energy') {
                self.log.info('%s (%s / %s) > CurrentConsumption > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function(type: string, value: number) {
            if(type==='energy') {
                self.log.info('%s (%s / %s) > TotalConsumption > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function(type: string, value: number) {
            if(type==='energy') {
                self.log.info('%s (%s / %s) > TotalConsumptionSince > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });

    }

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
        this.switchService.addCharacteristic(this.Characteristic.CurrentConsumption)
                    .on('get', this.getCurrentConsumption.bind(this))
        this.switchService.addCharacteristic(this.Characteristic.TotalConsumption)
                    .on('get', this.getTotalConsumption.bind(this))
        this.switchService.addCharacteristic(this.Characteristic.TotalConsumptionSince)
                    .on('get', this.getTotalConsumptionSince.bind(this))

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        this.dDevice.listen();

        return [this.informationService, this.switchService];
    }

    getSwitchState(callback) {
        this.log.debug('%s (%s) > getSwitchState', (this.constructor as any).name, this.dDevice.id);
        return callback(null, this.dDevice.getState()!=0);
    }

    getCurrentConsumption(callback) {
        this.log.debug('%s > getCurrentConsumption', (this.constructor as any).name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    }

    getTotalConsumption(callback) {
        this.log.debug('%s > getTotalConsumption', (this.constructor as any).name);
        return callback(null, this.dDevice.getTotalValue('energy'));
    }

    getTotalConsumptionSince(callback) {
        this.log.debug('%s > getTotalConsumptionSince', (this.constructor as any).name);
        return callback(null, new Date(this.dDevice.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
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
                if(err) {
                    callback(err); return;
                }
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function(err) {
                if(err) {
                    callback(err); return;
                }
                callback();
            });
        }
    }

}