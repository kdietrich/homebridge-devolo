import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloSmokeDetectorDevice extends HBDevoloDevice {

    smokeSensorService;
    batteryService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > State > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
            self.smokeSensorService.getCharacteristic(self.Characteristic.SmokeDetected).updateValue(state, null);
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
            .setCharacteristic(this.Characteristic.Model, 'Smoke Detector')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.smokeSensorService = new this.Service.SmokeSensor();
        this.smokeSensorService.getCharacteristic(this.Characteristic.SmokeDetected)
                     .on('get', this.getSmokeDetected.bind(this));


        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
                     .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
                     .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
                     .on('get', this.getStatusLowBattery.bind(this));

        this.dDevice.listen();
        return [this.informationService, this.smokeSensorService, this.batteryService];
    }

    getSmokeDetected(callback) {
        this.log.debug('%s (%s / %s) > getSmokeDetected', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getState());
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