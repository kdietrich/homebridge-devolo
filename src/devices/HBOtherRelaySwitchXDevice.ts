import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';
import { MeterSensor} from 'node-devolo/dist/DevoloSensor';


export class HBOtherRelaySwitchXDevice extends HBDevoloDevice {

    manufacturers = {
        "0x010f" : "Fibaro",
        "0x0175" : "Devolo",
        "0x0130" : "Qubino",
        "0x0060" : "Everspring"
    };

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
        if (this.manufacturers[this.dDevice.manID]) {
            this.log.info('manufacturer: %s ', this.manufacturers[this.dDevice.manID]);
            this.informationService.setCharacteristic(this.Characteristic.Manufacturer, this.manufacturers[this.dDevice.manID]);
        } else {
            this.informationService.setCharacteristic(this.Characteristic.Manufacturer, 'Other');
        }

        this.informationService
            .setCharacteristic(this.Characteristic.Model, 'Single-Double-Triple-Quattro Relay-Switch')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'));

        var services = [this.informationService];

        let sensorCount = 0;
        for(let i=0; i<this.dDevice.sensors.length; i++) {
            let sensor = this.dDevice.sensors[i];
            if(sensor.id.indexOf('BinarySwitch') > -1) {
                this.switchServices.push(new this.Service.Outlet(this.name + ' ' + (sensorCount+1), this.name + ' ' + (sensorCount+1)));
                this.switchServices[sensorCount].getCharacteristic(this.Characteristic.On)
                             .on('get', this.getSwitchState.bind([this, (sensorCount+1)]))
                             .on('set', this.setSwitchState.bind([this, (sensorCount+1)]));

                var meterSensor: MeterSensor = this.dDevice.getSensor(MeterSensor, 'energy', sensorCount+1) as MeterSensor;

                if (meterSensor) {
                    this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
                        .on('get', this.getDevoloCurrentConsumption.bind([this, (sensorCount+1)]))
                    this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumption)
                        .on('get', this.getDevoloTotalConsumption.bind([this, (sensorCount+1)]))
                    this.switchServices[sensorCount].addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
                        .on('get', this.getDevoloTotalConsumptionSince.bind([this, (sensorCount+1)]))
                }

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
        try {
            //self.log.debug('will read current consumption for %s (id: %s num: [%s] / dDevice.name: %s)', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name);
            this.apiGetDevoloCurrentConsumption = self.dDevice.getCurrentValue('energy', num)
            self.log.debug('%s (%s [%s] / %s) > getDevoloCurrentConsumption is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloCurrentConsumption);
            return callback(null, this.apiGetDevoloCurrentConsumption);
        }
        catch (e) {
            self.log.warn('Error reading current consumption for %s (id: %s [%s])', self.dDevice.name, self.dDevice.id, num);
            return callback(e, null);
        }
    }

    getDevoloTotalConsumption(callback) {
        var self = this[0];
        var num = this[1];
        try {
            this.apiGetDevoloTotalConsumption = self.dDevice.getTotalValue('energy', num)
            self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumption is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloTotalConsumption);
            return callback(null, this.apiGetDevoloTotalConsumption);
        }
        catch (e) {
            self.log.warn('Error reading total consumption for %s (id: %s [%s])', self.dDevice.name, self.dDevice.id, num);
            return callback(e, null);
        }
    }

    getDevoloTotalConsumptionSince(callback) {
        var self = this[0];
        var num = this[1];
        try {
            this.apiGetDevoloTotalConsumptionSince = new Date(self.dDevice.getSinceTime('energy', num)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
            self.log.debug('%s (%s [%s] / %s) > getDevoloTotalConsumptionSince is %s', (self.constructor as any).name, self.dDevice.id, num, self.dDevice.name, this.apiGetDevoloTotalConsumptionSince);
            return callback(null, this.apiGetDevoloTotalConsumptionSince);
        }
        catch (e) {
            self.log.warn('Error reading total consumption since for %s (id: %s [%s])', self.dDevice.name, self.dDevice.id, num);
            return callback(e, null);
        }
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