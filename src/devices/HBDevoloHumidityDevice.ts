import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloHumidityDevice extends HBDevoloDevice {

    humidityService;
    temperatureService;
    batteryService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            if(type==='temperature') {
                self.log.info('%s (%s / %s) > Temperature > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if(type==='humidity') {
                self.log.info('%s (%s / %s) > Humidity > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.humidityService.getCharacteristic(self.Characteristic.CurrentRelativeHumidity).updateValue(value, null);
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
            .setCharacteristic(this.Characteristic.Model, 'Humidity Sensor')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.humidityService = new this.Service.HumiditySensor();
        this.humidityService.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
                     .on('get', this.getCurrentRelativeHumidity.bind(this));

        this.temperatureService = new this.Service.TemperatureSensor(this.name);
        this.temperatureService.getCharacteristic(this.Characteristic.CurrentTemperature)
                     .on('get', this.getCurrentTemperature.bind(this));

        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
                     .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
                     .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
                     .on('get', this.getStatusLowBattery.bind(this));

        this.dDevice.listen();
        return [this.informationService, this.humidityService, this.temperatureService, this.batteryService];
    }

    getCurrentRelativeHumidity(callback) {
        this.log.debug('%s (%s / %s) > getCurrentRelativeHumidity', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('humidity'));
    }

    getCurrentTemperature(callback) {
        this.log.debug('%s (%s / %s) > getCurrentTemperature', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('temperature'));
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