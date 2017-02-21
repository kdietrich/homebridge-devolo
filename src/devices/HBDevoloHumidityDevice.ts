import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloHumidityDevice extends HBDevoloDevice {

    humidityService;
    temperatureService;
    batteryService;

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Humidity Sensor')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

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

        //this.updateReachability(false);
        //this.switchService.addCharacteristic(Characteristic.StatusActive, false);
        //switchService.addCharacteristic(Consumption);
        //switchService.addCharacteristic(Characteristic.TargetTemperature);

        return [this.informationService, this.humidityService, this.temperatureService, this.batteryService];
    }

    /* HEARTBEAT */
    heartbeat(device) {
        this.log.debug('%s > Hearbeat', (this.constructor as any).name);
        var self = this;
        /* Service.HumiditySensor */
        var oldHumidity = self.dDevice.getValue('humidity');
        if(device.getValue('humidity') != oldHumidity) {
            self.log.info('%s > Humidity %s > %s', (this.constructor as any).name, oldHumidity, device.getValue('humidity'));
            self.dDevice.setValue('humidity', device.getValue('humidity'));
            self.humidityService.setCharacteristic(self.Characteristic.CurrentRelativeHumidity, device.getValue('humidity'));
        }

        /* Service.TemperatureSensor */
        var oldTemperature = self.dDevice.getValue('temperature');
        if(device.getValue('temperature') != oldTemperature) {
            self.log.info('%s > Temperature %s > %s', (this.constructor as any).name, oldTemperature, device.getValue('temperature'));
            self.dDevice.setValue('temperature', device.getValue('temperature'));
            self.temperatureService.setCharacteristic(self.Characteristic.CurrentTemperature, device.getValue('temperature'));
        }

        /* Service.BatteryService */
        var oldBatteryLevel = self.dDevice.getBatteryLevel();
        if(device.getBatteryLevel() != oldBatteryLevel) {
            self.log.info('%s > Battery level %s > %s', (this.constructor as any).name, oldBatteryLevel, device.getBatteryLevel());
            self.dDevice.setBatteryLevel(device.getBatteryLevel());
            self.batteryService.setCharacteristic(self.Characteristic.BatteryLevel, device.getBatteryLevel());
        }
        var oldBatteryLow = self.dDevice.getBatteryLow();
        if(device.getBatteryLow() != oldBatteryLow) {
            self.log.info('%s > Battery low %s > %s', (this.constructor as any).name, oldBatteryLow, device.getBatteryLow());
            self.dDevice.setBatteryLow(device.getBatteryLow());
            self.batteryService.setCharacteristic(self.Characteristic.StatusLowBattery, !device.getBatteryLow());
        }

    }

    getCurrentRelativeHumidity(callback) {
        this.log.debug('%s > getCurrentRelativeHumidity', (this.constructor as any).name);
        return callback(null, this.dDevice.getValue('humidity'));
    }

    getCurrentTemperature(callback) {
        this.log.debug('%s > getCurrentTemperature', (this.constructor as any).name);
        return callback(null, this.dDevice.getValue('temperature'));
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