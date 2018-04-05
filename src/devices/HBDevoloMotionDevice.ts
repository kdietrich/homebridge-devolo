import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloMotionDevice extends HBDevoloDevice {

    motionSensorService;
    temperatureService;
    batteryService;
    lightSensorService;

    constructor(log, dAPI: Devolo, dDevice: Device, storage) {
        super(log, dAPI, dDevice, storage);

        var self = this;
        self.dDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > State > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
            self.motionSensorService.getCharacteristic(self.Characteristic.MotionDetected).updateValue(state, null);
        });
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            if(type==='temperature') {
                self.log.info('%s (%s / %s) > Temperature > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if(type==='light') {
                self.log.info('%s (%s / %s) > Light > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.lightSensorService.getCharacteristic(self.Characteristic.CurrentAmbientLightLevel).updateValue(value/100*500, null); //convert percentage to lux
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
            .setCharacteristic(this.Characteristic.Model, 'Motion Sensor')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

        this.motionSensorService = new this.Service.MotionSensor();
        this.motionSensorService.getCharacteristic(this.Characteristic.MotionDetected)
                     .on('get', this.getMotionDetected.bind(this));


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

        this.lightSensorService = new this.Service.LightSensor(this.name);
        this.lightSensorService.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel)
                    .on('get', this.getCurrentAmbientLightLevel.bind(this));

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        this.dDevice.listen();

        return [this.informationService, this.motionSensorService, this.temperatureService, this.batteryService, this.lightSensorService];
    }

    getMotionDetected(callback) {
        this.log.debug('%s > getMotionDetected', (this.constructor as any).name);
        return callback(null, this.dDevice.getState());
    }

    getCurrentTemperature(callback) {
        this.log.debug('%s > getCurrentTemperature', (this.constructor as any).name);
        return callback(null, this.dDevice.getValue('temperature'));
    }

    getCurrentAmbientLightLevel(callback) {
        this.log.debug('%s > getCurrentAmbientLightLevel', (this.constructor as any).name);
        return callback(null, this.dDevice.getValue('light')/100*500); //convert percentage to lux
    }

    getBatteryLevel(callback) {
        this.log.debug('%s > getBatteryLevel', (this.constructor as any).name);
        return callback(null, this.dDevice.getBatteryLevel())
    }

    getStatusLowBattery(callback) {
        this.log.debug('%s > getStatusLowBattery', (this.constructor as any).name);
        return callback(null, !this.dDevice.getBatteryLow())
    }

    getChargingState(callback) {
        this.log.debug('%s > getChargingState', (this.constructor as any).name);
        return callback(null, false)
    }

}