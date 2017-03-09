import {HBDevoloDevice} from '../HBDevoloDevice';

export class HBDevoloThermostatValveDevice extends HBDevoloDevice {

    thermostatService;
    heartbeatsSinceLastStateSwitch: number = 1;

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Thermostat Valve')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

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

        return [this.informationService, this.thermostatService];
    }

    /* HEARTBEAT */
    heartbeat(device) {
        this.log.debug('%s (%s) > Hearbeat', (this.constructor as any).name, device.id);
        this.heartbeatsSinceLastStateSwitch++;
        if(this.heartbeatsSinceLastStateSwitch <= 1) {
            this.log.debug('%s (%s) > Skip this heartbeat because of fast switching.', (this.constructor as any).name, device.id);
            return;
        }
        var self = this;

        /* Service.Thermostat */
        var oldCurrentTemperature = self.dDevice.getValue('temperature');
        if(device.getValue('temperature') != oldCurrentTemperature) {
            self.log.info('%s (%s) > CurrentTemperature %s > %s', (this.constructor as any).name, device.id, oldCurrentTemperature, device.getValue('temperature'));
            self.dDevice.setValue('temperature', device.getValue('temperature'), function(err) {
                self.thermostatService.setCharacteristic(self.Characteristic.CurrentTemperature, device.getValue('temperature'));
            });
        }
        var oldTargetTemperature = self.dDevice.getTargetValue('temperature');
        if(device.getTargetValue('temperature') != oldTargetTemperature) {
            self.log.info('%s (%s) > TargetTemperature %s > %s', (this.constructor as any).name, device.id, oldTargetTemperature, device.getTargetValue('temperature'));
            self.dDevice.setTargetValue('temperature', device.getTargetValue('temperature'), function(err) {
                self.thermostatService.setCharacteristic(self.Characteristic.TargetTemperature, device.getTargetValue('temperature'));
            }, false);
        }
    }

    getCurrentTemperature(callback) {
        this.log.debug('%s (%s) > getCurrentTemperature', (this.constructor as any).name, this.dDevice.id);
        return callback(null, this.dDevice.getValue('temperature'));
    }

    getTargetTemperature(callback) {
        this.log.debug('%s (%s) > getTargetTemperature', (this.constructor as any).name, this.dDevice.id);
        return callback(null, this.dDevice.getTargetValue('temperature'));
    }


    setTargetTemperature(value, callback) {
        this.log.debug('%s (%s) > setTargetTemperature to %s', (this.constructor as any).name, this.dDevice.id, value);
        if(value==this.dDevice.getTargetValue('temperature')) {
            callback();
            return;
        }
        var self = this;
        this.dDevice.setTargetValue('temperature', value, function(err) {
            if(err) {
                callback(err); return;
            }
            self.heartbeatsSinceLastStateSwitch = 0;
            callback();
        }, true);
    }

}