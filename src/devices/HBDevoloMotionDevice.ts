import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

const moment = require('moment');

export class HBDevoloMotionDevice extends HBDevoloDevice {

    motionSensorService;
    temperatureService;
    batteryService;
    lightSensorService;

    // FakeGato (eve app)
    lastActivation;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;

        self.dDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > State > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
            self.motionSensorService.getCharacteristic(self.Characteristic.MotionDetected).updateValue(state, null);

            // START FakeGato (eve app)
            if (self.config.fakeGato) {
                self.AddFakeGatoEntry({status: state});
                if (state == 0) {
                    // NO MOTION
                } else {
                    // MOTION
                    self.lastActivation = moment().unix() - self.loggingService.getInitialTime();
                    self.motionSensorService.getCharacteristic(self.Characteristic.LastActivation).updateValue(self.lastActivation, null)
                }
                self.log.info("%s (%s / %s) > FakeGato > MotionState changed to %s > lastActivation is %s", (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state, self.lastActivation)
                self.loggingService.setExtraPersistedData([{"lastActivation": self.lastActivation}]);
            }
            // END FakeGato (eve app)

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
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

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

        var services = [this.informationService, this.motionSensorService, this.batteryService, this.lightSensorService, this.temperatureService ];

        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this.AddFakeGatoHistory('motion',false);
            this.CheckFakeGatoHistoryLoaded();
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)

        this.dDevice.listen();
        return services;
    }

    getMotionDetected(callback) {
        this.log.debug('%s (%s / %s) > getMotionDetected', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getState());
    }

    getCurrentTemperature(callback) {
        this.log.debug('%s (%s / %s) > getCurrentTemperature', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('temperature'));
    }

    getCurrentAmbientLightLevel(callback) {
        this.log.debug('%s (%s / %s) > getCurrentAmbientLightLevel', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getValue('light')/100*500); //convert percentage to lux
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

    getlastActivation(callback) {
        this.log.debug('%s (%s / %s) > getlastActivation will report %s', (this.constructor as any).name, this.lastActivation);
        this.motionSensorService.getCharacteristic(this.Characteristic.LastActivation).updateValue(this.lastActivation, null);
        return callback(null, this.lastActivation);
    }

    CheckFakeGatoHistoryLoaded() {
        if(this.loggingService.isHistoryLoaded() == false) {
              setTimeout(this.CheckFakeGatoHistoryLoaded.bind(this), 100);
        } else {
            this.motionSensorService.addCharacteristic(this.Characteristic.LastActivation)
                .on('get', this.getlastActivation.bind(this));

            if (this.loggingService.getExtraPersistedData() == undefined) {
                this.lastActivation = 0;
                this.loggingService.setExtraPersistedData([{"lastActivation": this.lastActivation}]);

            } else {
                this.lastActivation = this.loggingService.getExtraPersistedData()[0].lastActivation;
            }
        }
    }
    // END FakeGato (eve app)
}