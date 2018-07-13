import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBQubinoRelay2Device extends HBDevoloDevice {

    switchServices = [];

    constructor(log, dAPI: Devolo, dDevice: Device, storage) {
        super(log, dAPI, dDevice, storage);
        var self = this;
        self.dDevice.events.on('onStateChanged', function(state: number, num:number) {
            self.log.info('%s (%s [%s] / %s) > State > %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, state);
            self.switchServices[num-1].getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function(type: string, value: number, num:number) {
            if(type==='energy') {
                self.log.info('%s (%s [%s] / %s) > CurrentConsumption > %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num-1].getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function(type: string, value: number, num:number) {
            if(type==='energy') {
                self.log.info('%s (%s [%s] / %s) > TotalConsumption > %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num-1].getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function(type: string, value: number, num:number) {
            if(type==='energy') {
                self.log.info('%s (%s [%s] / %s) > TotalConsumptionSince > %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num-1].getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });

    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Qubino')
            .setCharacteristic(this.Characteristic.Model, 'Flush x')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

        let sensorCount = 0;
        for(let i=0; i<this.dDevice.sensors.length; i++) {
            let sensor = this.dDevice.sensors[i];
            if(sensor.id.indexOf('BinarySwitch') > -1) {
                this.switchServices.push(new this.Service.Outlet(this.name + ' ' + (sensorCount+1), this.name + ' ' + (sensorCount+1)));
                this.switchServices[sensorCount].getCharacteristic(this.Characteristic.On)
                             .on('get', this.getSwitchState.bind([this, (sensorCount+1)]))
                             .on('set', this.setSwitchState.bind([this, (sensorCount+1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.CurrentConsumption)
                            .on('get', this.getCurrentConsumption.bind([this, (sensorCount+1)]))
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.TotalConsumption)
                            .on('get', this.getTotalConsumption.bind([this, (sensorCount+1)]))
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.TotalConsumptionSince)
                            .on('get', this.getTotalConsumptionSince.bind([this, (sensorCount+1)]))

                sensorCount++;
            }
        }

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        this.dDevice.listen();

        return [this.informationService].concat(this.switchServices);
    }

    getSwitchState(callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getSwitchState', (self.constructor as any).name, self.dDevice.id, num);
        return callback(null, self.dDevice.getState(num)!=0);
    }

    getCurrentConsumption(callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getCurrentConsumption', (self.constructor as any).name, self.dDevice.id, num);
        return callback(null, self.dDevice.getCurrentValue('energy', num));
    }

    getTotalConsumption(callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getTotalConsumption', (self.constructor as any).name, self.dDevice.id, num);
        return callback(null, self.dDevice.getTotalValue('energy', num));
    }

    getTotalConsumptionSince(callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > getTotalConsumptionSince', (self.constructor as any).name, self.dDevice.id, num);
        return callback(null, new Date(self.dDevice.getSinceTime('energy', num)).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    }

    setSwitchState(value, callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s]) > setSwitchState to %s', (self.constructor as any).name, self.dDevice.id, num, value);
        if(value==self.dDevice.getState(num)) {
            callback();
            return;
        }
        if(value) {
            self.dDevice.turnOn(function(err) {
                if(err) {
                    callback(err); return;
                }
                callback();
            }, num);
        }
        else {
            self.dDevice.turnOff(function(err) {
                if(err) {
                    callback(err); return;
                }
                callback();
            }, num);
        }
    }

}