import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloThermostatValveDevice extends HBDevoloDevice {

    thermostatService;
    batteryService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            if(type==='temperature') {
                self.log.info('%s (%s / %s) > Temperature > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.thermostatService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onTargetValueChanged', function(type: string, value: number) {
            if(type==='temperature') {
                self.log.info('%s (%s / %s) > TargetTemperature > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.thermostatService.getCharacteristic(self.Characteristic.TargetTemperature).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onBatteryLevelChanged', function(value: number) {
            self.log.info('%s (%s / %s) > Battery level > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.BatteryLevel).updateValue(value, null);
        });
        self.dDevice.events.on('onBatteryLowChanged', function(value: boolean) {
            self.log.info('%s (%s / %s) > Battery low > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.StatusLowBattery).updateValue(!value, null);
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Thermostat Valve')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.thermostatService = new this.Service.Thermostat(this.name);
        this.thermostatService.setCharacteristic(this.Characteristic.CurrentHeatingCoolingState, 1); //heating
        this.thermostatService.setCharacteristic(this.Characteristic.TargetHeatingCoolingState, 1); //heating
        this.thermostatService.setCharacteristic(this.Characteristic.TemperatureDisplayUnits, 0); //celcius
        this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature).setProps({
            minValue: 4,
            maxValue: 28,
            minStep: 0.5
        });
        this.thermostatService.getCharacteristic(this.Characteristic.CurrentTemperature)
                     .on('get', this.getCurrentTemperature.bind(this));
        this.thermostatService.getCharacteristic(this.Characteristic.TargetTemperature)
                     .on('get', this.getTargetTemperature.bind(this))
                     .on('set', this.setTargetTemperature.bind(this));

        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
                     .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
                     .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
                     .on('get', this.getStatusLowBattery.bind(this));

        this.dDevice.listen();
        return [this.informationService, this.thermostatService, this.batteryService];
    }

    getCurrentTemperature(callback) {
        this.log.debug('%s (%s / %s) > getCurrentTemperature', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('temperature'));
    }

    getTargetTemperature(callback) {
        this.log.debug('%s (%s / %s) > getTargetTemperature', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getTargetValue('temperature'));
    }


    setTargetTemperature(value, callback) {
        this.log.debug('%s (%s / %s) > setTargetTemperature to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        if(value==this.dDevice.getTargetValue('temperature')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setTargetValue('temperature', value, function(err) {
            if(err) {
                callback(err); return;
            }
            callback();
        }, true);
    }

    getBatteryLevel(callback) {
        this.log.debug('%s (%s / %s) > getBatteryLevel', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getBatteryLevel())
    }

    getStatusLowBattery(callback) {
        this.log.debug('%s (%s / %s) > getStatusLowBattery', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, !this.dDevice.getBatteryLow())
    }

    getChargingState(callback) {
        this.log.debug('%s (%s / %s) > getChargingState', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, false)
    }
}