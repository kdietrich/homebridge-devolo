import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBPoppZWeatherDevice extends HBDevoloDevice {

    temperatureService;
    humidityService;
    lightService;
    airPressureService;
    windSpeedService;
    dewPointService;
    batteryService;

    apiGetCurrentTemperature;
    apiGetCurrentRelativeHumidity;
    apiGetCurrentAmbientLightLevel;
    apiGetCurrentAirPressure;
    apiGetCurrentWindSpeed;
    apiGetCurrentDewPoint;
    apiGetBatteryLevel;

    // FakeGato (eve app)
    lastTemperature;
    lastHumidity;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            if(type==='temperature') {
                self.log.info('%s (%s / %s) > onValueChanged > Temperature is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);

                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    self._addFakeGatoEntry({temp: value, humidity: self.lastHumidity});
                    self.log.info("%s (%s / %s) > onStateChanged FakeGato > CurrentTemperature changed to %s, LastHumidity is %s", (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, self.lastHumidity);
                    self.lastTemperature = value;
                }
                // END FakeGato (eve app)

            }
            else if(type==='humidity') {
                self.log.info('%s (%s / %s) > onValueChanged > Humidity is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.humidityService.getCharacteristic(self.Characteristic.CurrentRelativeHumidity).updateValue(value, null);

                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    self._addFakeGatoEntry({temp: self.lastTemperature, humidity: value});
                    self.log.info("%s (%s / %s) > onStateChanged FakeGato > CurrentHumidity changed to %s, LastTemperature is %s", (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, self.lastTemperature);
                    self.lastHumidity = value;
                }
                // END FakeGato (eve app)

            }
            else if(type==='light') {
                self.log.info('%s (%s / %s) > onValueChanged > Light is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.lightService.getCharacteristic(self.Characteristic.CurrentAmbientLightLevel).updateValue(value/100*500, null); //convert percentage to lux
            }
            else if(type==='Barometric Preassure') {
                self.log.info('%s (%s / %s) > onValueChanged > Barometric Preassure is %s in kpa, %s in hpa', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, value*10);
                self.airPressureService.getCharacteristic(self.Characteristic.AirPressure).updateValue(value*10, null);
            }
            else if(type==='Velocity') {
                self.log.info('%s (%s / %s) > onValueChanged > Wind Speed is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.windSpeedService.getCharacteristic(self.Characteristic.WindSpeed).updateValue(value, null);
            }
            else if(type==='Dew Point') {
                self.log.info('%s (%s / %s) > onValueChanged > Dew Point is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.dewPointService.getCharacteristic(self.Characteristic.DewPoint).updateValue(value, null);
            }

        });
        self.dDevice.events.on('onBatteryLevelChanged', function(value: number) {
            self.log.info('%s (%s / %s) > onBatteryLevelChanged > Battery level is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.BatteryLevel).updateValue(value, null);
        });
        self.dDevice.events.on('onBatteryLowChanged', function(value: boolean) {
            self.log.info('%s (%s / %s) > onBatteryLowChanged > Battery is low (%s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.batteryService.getCharacteristic(self.Characteristic.StatusLowBattery).updateValue(!value, null);
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Popp')
            .setCharacteristic(this.Characteristic.Model, 'Z-Weather')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.temperatureService = new this.Service.TemperatureSensor(this.name + ' Temperature');
        this.temperatureService.getCharacteristic(this.Characteristic.CurrentTemperature)
                     .on('get', this.getCurrentTemperature.bind(this));

        this.humidityService = new this.Service.HumiditySensor(this.name + ' Humidity');
        this.humidityService.getCharacteristic(this.Characteristic.CurrentRelativeHumidity)
                     .on('get', this.getCurrentRelativeHumidity.bind(this));

        this.lightService = new this.Service.LightSensor(this.name + ' Light Level');
        this.lightService.getCharacteristic(this.Characteristic.CurrentAmbientLightLevel)
                    .on('get', this.getCurrentAmbientLightLevel.bind(this));

        this.airPressureService = new this.Service.AirPressure(this.name + ' Air Pressure');
        this.airPressureService.getCharacteristic(this.Characteristic.AirPressure)
                     .on('get', this.getCurrentAirPressure.bind(this));

        this.windSpeedService = new this.Service.WindSpeed(this.name + ' Wind Speed');
        this.windSpeedService.getCharacteristic(this.Characteristic.WindSpeed)
                     .on('get', this.getCurrentWindSpeed.bind(this));

        this.dewPointService = new this.Service.DewPoint(this.name + ' Dew Point');
        this.dewPointService.getCharacteristic(this.Characteristic.DewPoint)
                     .on('get', this.getCurrentDewPoint.bind(this));

        this.batteryService = new this.Service.BatteryService(this.name);
        this.batteryService.getCharacteristic(this.Characteristic.BatteryLevel)
                     .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.ChargingState)
                     .on('get', this.getChargingState.bind(this));
        this.batteryService.getCharacteristic(this.Characteristic.StatusLowBattery)
                     .on('get', this.getStatusLowBattery.bind(this));

        this.lastTemperature = this.dDevice.getValue('temperature');
        this.lastHumidity = this.dDevice.getValue('humidity');

        var services = [this.informationService, this.temperatureService, this.humidityService, this.lightService, this.airPressureService, this.windSpeedService, this.dewPointService, this.batteryService];

        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('weather',false);
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)

        this.dDevice.listen();
        return services;
    }

    getCurrentTemperature(callback) {
        this.apiGetCurrentTemperature = this.dDevice.getValue('temperature');
        this.log.debug('%s (%s / %s) > getCurrentTemperature is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentTemperature);
        return callback(null, this.apiGetCurrentTemperature);
    }

    getCurrentRelativeHumidity(callback) {
        this.apiGetCurrentRelativeHumidity = this.dDevice.getValue('humidity');
        this.log.debug('%s (%s / %s) > getCurrentRelativeHumidity is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentRelativeHumidity);
        return callback(null, this.apiGetCurrentRelativeHumidity);
    }

    getCurrentAmbientLightLevel(callback) {
        this.apiGetCurrentAmbientLightLevel = this.dDevice.getValue('light')/100*500;
        this.log.debug('%s (%s / %s) > getCurrentAmbientLightLevel is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentAmbientLightLevel);
        return callback(null, this.apiGetCurrentAmbientLightLevel); //convert percentage to lux
    }

    getCurrentAirPressure(callback) {
        this.apiGetCurrentAirPressure = this.dDevice.getValue('Barometric Preassure')*10;
        this.log.debug('%s (%s / %s) > getCurrentAirPressure is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentAirPressure);
        return callback(null, this.apiGetCurrentAirPressure); // old devolo hpa, new devolo kpa
    }

    getCurrentWindSpeed(callback) {
        this.apiGetCurrentWindSpeed = this.dDevice.getValue('Velocity');
        this.log.debug('%s (%s / %s) > getCurrentWindSpeed is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentWindSpeed);
        return callback(null, this.apiGetCurrentWindSpeed);
    }

    getCurrentDewPoint(callback) {
        this.apiGetCurrentDewPoint = this.dDevice.getValue('Dew Point');
        this.log.debug('%s (%s / %s) > getCurrentDewPoint is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentDewPoint);
        return callback(null, this.apiGetCurrentDewPoint);
    }

    getBatteryLevel(callback) {
        this.apiGetBatteryLevel = this.dDevice.getBatteryLevel();
        this.log.debug('%s (%s / %s) > getBatteryLevel is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetBatteryLevel);
        return callback(null, this.apiGetBatteryLevel)
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