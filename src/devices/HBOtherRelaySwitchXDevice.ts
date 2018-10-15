import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBOtherRelaySwitchXDevice extends HBDevoloDevice {

    switchServices = [];

    apiGetSwitchState;
    apiGetDevoloCurrentConsumption;
    apiGetDevoloTotalConsumption;
    apiGetDevoloTotalConsumptionSince;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);
        var self = this;
        self.dDevice.events.on('onStateChanged', function(state: number, num:number) {
            self.log.info('%s (%s [%s] / %s) > onStateChanged > State is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, state);
            self.switchServices[num-1].getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function(type: string, value: number, num:number) {
            if(type==='energy') {
                self.log.info('%s (%s [%s] / %s) > onCurrentValueChanged > CurrentConsumption is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num-1].getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function(type: string, value: number, num:number) {
            if(type==='energy') {
                self.log.info('%s (%s [%s] / %s) > onTotalValueChanged > TotalConsumption is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num-1].getCharacteristic(self.Characteristic.TotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function(type: string, value: number, num:number) {
            if(type==='energy') {
                self.log.info('%s (%s [%s] / %s) > onSinceTimeChanged > TotalConsumptionSince is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
                self.switchServices[num-1].getCharacteristic(self.Characteristic.TotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Other')
            .setCharacteristic(this.Characteristic.Model, 'Single-Double-Triple-Quattro Relay-Switch')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        var services = [this.informationService];

        let sensorCount = 0;
        for(let i=0; i<this.dDevice.sensors.length; i++) {
            let sensor = this.dDevice.sensors[i];
            if(sensor.id.indexOf('BinarySwitch') > -1) {
                this.switchServices.push(new this.Service.Outlet(this.name + ' ' + (sensorCount+1), this.name + ' ' + (sensorCount+1)));
                this.switchServices[sensorCount].getCharacteristic(this.Characteristic.On)
                             .on('get', this.getSwitchState.bind([this, (sensorCount+1)]))
                             .on('set', this.setSwitchState.bind([this, (sensorCount+1)]));
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
                            .on('get', this.getDevoloCurrentConsumption.bind([this, (sensorCount+1)]))
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumption)
                            .on('get', this.getDevoloTotalConsumption.bind([this, (sensorCount+1)]))
                this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
                            .on('get', this.getDevoloTotalConsumptionSince.bind([this, (sensorCount+1)]))

                if(!this.config.switchBlacklistDoubleRelaySwitch || !this._isInList(this.name + ' ' + (sensorCount+1), this.config.switchBlacklistDoubleRelaySwitch)) {
                    this.log.debug('Initializing platform accessory \'%s\' with switch %s', this.dDevice.name, (sensorCount+1));
                    services = services.concat([this.switchServices[sensorCount]]);
                }

                sensorCount++;
            }
        }

        this.dDevice.listen();
        return services;
    }

    getSwitchState(callback) {
        var self = this[0];
        var num = this[1];
        this.apiGetSwitchState = self.dDevice.getState(num)!=0
        self.log.debug('%s (%s [%s] / %s) > getSwitchState is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetSwitchState);
        return callback(null, this.apiGetSwitchState);
    }

    getDevoloCurrentConsumption(callback) {
        var self = this[0];
        var num = this[1];
        this.apiGetDevoloCurrentConsumption = self.dDevice.getCurrentValue('energy', num)
        self.log.debug('%s (%s [%s] / %s) > getDevoloCurrentConsumption is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloCurrentConsumption);
        return callback(null, this.apiGetDevoloCurrentConsumption);
    }

    getDevoloTotalConsumption(callback) {
        var self = this[0];
        var num = this[1];
        this.apiGetDevoloTotalConsumption = self.dDevice.getTotalValue('energy', num)
        self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumption is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloTotalConsumption);
        return callback(null, this.apiGetDevoloTotalConsumption);
    }

    getDevoloTotalConsumptionSince(callback) {
        var self = this[0];
        var num = this[1];
        this.apiGetDevoloTotalConsumptionSince = new Date(self.dDevice.getSinceTime('energy', num)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
        self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumptionSince is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloTotalConsumptionSince);
        return callback(null, this.apiGetDevoloTotalConsumptionSince);
    }

    setSwitchState(value, callback) {
        var self = this[0];
        var num = this[1];
        self.log.debug('%s (%s [%s] / %s) > setSwitchState to %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, value);
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