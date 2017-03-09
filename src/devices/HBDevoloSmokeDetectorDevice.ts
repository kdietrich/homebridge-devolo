import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloSmokeDetectorDevice extends HBDevoloDevice {

    smokeSensorService;
    batteryService;

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Smoke Detector')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

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

        return [this.informationService, this.smokeSensorService, this.batteryService];
    }

    /* HEARTBEAT */
    heartbeat(device) {
        this.log.debug('%s > Hearbeat', (this.constructor as any).name);
        var self = this;
        /* Service.SmokeSensor */
        var oldState = self.dDevice.getState();
        if(device.getState() != oldState) {
            self.log.info('%s > State %s > %s', (this.constructor as any).name, oldState, device.getState());
            self.dDevice.setState(device.getState(), function(err) { });
            self.smokeSensorService.setCharacteristic(self.Characteristic.SmokeDetected, device.getState());
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

    getSmokeDetected(callback) {
        this.log.debug('%s > getSmokeDetected', (this.constructor as any).name);
        return callback(null, this.dDevice.getState());
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