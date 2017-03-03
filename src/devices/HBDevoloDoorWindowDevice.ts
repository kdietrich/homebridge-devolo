import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloDoorWindowDevice extends HBDevoloDevice {

    contactSensorService;
    temperatureService;
    batteryService;
    lightSensorService;

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Door Sensor / Window Contact')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

        this.contactSensorService = new this.Service.ContactSensor();
        this.contactSensorService.getCharacteristic(this.Characteristic.ContactSensorState)
                     .on('get', this.getContactSensorState.bind(this));

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

        return [this.informationService, this.contactSensorService, this.temperatureService, this.batteryService];
    }

    /* HEARTBEAT */
    heartbeat(device) {
        this.log.debug('%s > Hearbeat', (this.constructor as any).name);
        var self = this;
        /* Service.ContactSensor */
        var oldState = self.dDevice.getState();
        if(device.getState() != oldState) {
            self.log.info('%s > State %s > %s', (this.constructor as any).name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function(err) { });
            self.contactSensorService.setCharacteristic(self.Characteristic.ContactSensorState, device.getState());
        }

        /* Service.TemperatureSensor */
        var oldTemperature = self.dDevice.getValue('temperature');
        if(device.getValue('temperature') != oldTemperature) {
            self.log.info('%s > Temperature %s > %s', (this.constructor as any).name, oldTemperature, device.getValue('temperature'));
            self.dDevice.setValue('temperature', device.getValue('temperature'));
            self.temperatureService.setCharacteristic(self.Characteristic.CurrentTemperature, device.getValue('temperature'));
        }

        /* Service.LightSensor */
        var oldLight = self.dDevice.getValue('light');
        if(device.getValue('light') != oldLight) {
            self.log.info('%s > Light %s > %s', (this.constructor as any).name, oldLight, device.getValue('light'));
            self.dDevice.setValue('light', device.getValue('light'));
            self.lightSensorService.setCharacteristic(self.Characteristic.CurrentAmbientLightLevel, device.getValue('light')/100*500); //convert percentage to lux
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

    getContactSensorState(callback) {
        this.log.debug('%s > getContactSensorState', (this.constructor as any).name);
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