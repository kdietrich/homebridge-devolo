import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

const moment = require('moment');

export class HBDevoloDoorWindowDevice extends HBDevoloDevice {

    contactSensorService;
    temperatureService;
    batteryService;
    lightSensorService;

    apiGetContactSensorState;
    apiGetCurrentTemperature;
    apiGetCurrentAmbientLightLevel;
    apiGetBatteryLevel;
    apiGetStatusLowBattery;
    apiGetChargingState;

    // FakeGato (eve app)
    lastActivation;
    lastReset;
    lastChange;
    timesOpened;
    timeOpen;
    timeClose;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;

        self.dDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > onStateChanged > SensorState is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
            self.contactSensorService.getCharacteristic(self.Characteristic.ContactSensorState).updateValue(state, null);

            // START FakeGato (eve app)
            if (self.config.fakeGato) {
                if (self.loggingService.isHistoryLoaded()) {
                    self._addFakeGatoEntry({status: state});
                    if (state == 0) {
                        // CLOSED
                        self.timeOpen = self.timeOpen + (moment().unix() - self.lastChange);
                    } else {
                        // OPEN
                        self.timeClose = self.timeClose + (moment().unix() - self.lastChange);
                        self.timesOpened = self.timesOpened + 1;
                        self.lastActivation = moment().unix() - self.loggingService.getInitialTime();

                        self.contactSensorService.getCharacteristic(self.Characteristic.TimesOpened).updateValue(self.timesOpened, null)
                        self.contactSensorService.getCharacteristic(self.Characteristic.LastActivation).updateValue(self.lastActivation, null)
                    }
                    self.lastChange = moment().unix();
                    self.log.info("%s (%s / %s) > onStateChanged FakeGato > SensorState changed to %s, lastActivation is %s, lastReset is %s, lastChange is %s timesOpened is %s, timeOpen is %s, timeClose is %s", (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state, self.lastActivation, self.lastReset, self.lastChange, self.timesOpened, self.timeOpen, self.timeClose);
                    self.loggingService.setExtraPersistedData([{"lastActivation": self.lastActivation, "lastReset": self.lastReset, "lastChange": self.lastChange, "timesOpened": self.timesOpened, "timeOpen": self.timeOpen, "timeClose": self.timeClose}]);
                } else {
                    self.log.info("%s (%s / %s) > onStateChanged FakeGato > SensorState %s not added - FakeGato history not yet loaded", (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
                }
            }
            // END FakeGato (eve app)

        });
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            if(type==='temperature') {
                self.log.info('%s (%s / %s) > onValueChanged > Temperature is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.temperatureService.getCharacteristic(self.Characteristic.CurrentTemperature).updateValue(value, null);
            }
            else if(type==='light') {
                self.log.info('%s (%s / %s) > onValueChanged > Light is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.lightSensorService.getCharacteristic(self.Characteristic.CurrentAmbientLightLevel).updateValue(value/100*500, null); //convert percentage to lux
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
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Door Window Contact')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.contactSensorService = new this.Service.ContactSensor();
        this.contactSensorService.getCharacteristic(this.Characteristic.ContactSensorState)
                     .on('get', this.getContactSensorState.bind(this));

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

        this.temperatureService = new this.Service.TemperatureSensor(this.name);
        this.temperatureService.getCharacteristic(this.Characteristic.CurrentTemperature)
                     .on('get', this.getCurrentTemperature.bind(this));

        var services = [this.informationService, this.contactSensorService, this.batteryService];

        if(!this.config.lightBlacklist || !this._isInList(this.dDevice.name, this.config.lightBlacklist)) {
            services = services.concat([this.lightSensorService]);
        }

        if(!this.config.tempBlacklist || !this._isInList(this.dDevice.name, this.config.tempBlacklist)) {
            services = services.concat([this.temperatureService]);
        }

        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('door',false);
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)

        this.dDevice.listen();
        return services;
    }

    getContactSensorState(callback) {
        this.apiGetContactSensorState = this.dDevice.getState();
        this.log.debug('%s (%s / %s) > getContactSensorState is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetContactSensorState);
        return callback(null, this.apiGetContactSensorState);
    }

    getCurrentTemperature(callback) {
        this.apiGetCurrentTemperature = this.dDevice.getValue('temperature');
        this.log.debug('%s (%s / %s) > getCurrentTemperature is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentTemperature);
        return callback(null, this.apiGetCurrentTemperature);
    }

    getCurrentAmbientLightLevel(callback) {
        this.apiGetCurrentAmbientLightLevel = this.dDevice.getValue('light')/100*500; //convert percentage to lux
        this.log.debug('%s (%s / %s) > getCurrentAmbientLightLevel is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetCurrentAmbientLightLevel);
        return callback(null, this.apiGetCurrentAmbientLightLevel);
    }

    getBatteryLevel(callback) {
        this.apiGetBatteryLevel = this.dDevice.getBatteryLevel();
        this.log.debug('%s (%s / %s) > getBatteryLevel is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetBatteryLevel);
        return callback(null, this.apiGetBatteryLevel)
    }

    getStatusLowBattery(callback) {
        this.apiGetStatusLowBattery = !this.dDevice.getBatteryLow();
        this.log.debug('%s (%s / %s) > getStatusLowBattery is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetStatusLowBattery);
        return callback(null, this.apiGetStatusLowBattery)
    }

    getChargingState(callback) {
        this.apiGetChargingState = false;
        this.log.debug('%s (%s / %s) > getChargingState is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetChargingState);
        return callback(null, this.apiGetChargingState)
    }

    // START FakeGato (eve app)
    gettimesOpened(callback) {
        this.log.debug('%s (%s / %s) > gettimesOpened will report %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.timesOpened);
        this.contactSensorService.getCharacteristic(this.Characteristic.TimesOpened).updateValue(this.timesOpened, null);
        return callback(null, this.timesOpened);
    }

    getLastActivation(callback) {
        this.log.debug('%s (%s / %s) > getLastActivation will report %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.lastActivation);
        this.contactSensorService.getCharacteristic(this.Characteristic.LastActivation).updateValue(this.lastActivation, null);
        return callback(null, this.lastActivation);
    }

    getOpenDuration(callback) {
        this.log.debug('%s (%s / %s) > getOpenDuration will report %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.timeOpen);
        this.contactSensorService.getCharacteristic(this.Characteristic.OpenDuration).updateValue(this.timeOpen, null);
        return callback(null, this.timeOpen);
    }

    getClosedDuration(callback) {
        this.log.debug('%s (%s / %s) > getCloseDuration will report %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.timeClose);
        this.contactSensorService.getCharacteristic(this.Characteristic.ClosedDuration).updateValue(this.timeClose, null);
        return callback(null, this.timeClose);
    }

    getReset(callback) {
        this.log.debug('%s (%s / %s) > getResetTime will report %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.lastReset);
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback(null, this.lastReset);
    }

    setReset(value, callback) {
        this.log.debug('%s (%s / %s) > setResetTime to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        this.timesOpened = 0;
        this.lastReset = value;
        this.loggingService.setExtraPersistedData([{"lastActivation": this.lastActivation, "lastReset": this.lastReset, "lastChange": this.lastChange, "timesOpened": this.timesOpened, "timeOpen": this.timeOpen, "timeClose": this.timeClose}]);
        if (this.contactSensorService.getCharacteristic(this.Characteristic.TimesOpened)) {
            this.contactSensorService.getCharacteristic(this.Characteristic.TimesOpened).updateValue(this.timesOpened, null)
        }
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback();
    }

    onAfterFakeGatoHistoryLoaded() {
        this.contactSensorService.addCharacteristic(this.Characteristic.LastActivation)
            .on('get', this.getLastActivation.bind(this));
        this.contactSensorService.addCharacteristic(this.Characteristic.TimesOpened)
            .on('get', this.gettimesOpened.bind(this));
        this.contactSensorService.addCharacteristic(this.Characteristic.OpenDuration)
            .on('get', this.getOpenDuration.bind(this));
        this.contactSensorService.addCharacteristic(this.Characteristic.ClosedDuration)
            .on('get', this.getClosedDuration.bind(this));
        this.loggingService.addCharacteristic(this.Characteristic.ResetTotal)
            .on('get', this.getReset.bind(this))
            .on('set', this.setReset.bind(this));

        if (this.loggingService.getExtraPersistedData() == undefined) {
            this.lastActivation = 0;
            this.lastReset = moment().unix() - moment('2001-01-01T00:00:00Z').unix();
            this.lastChange = moment().unix();
            this.timesOpened = 0;
            this.timeOpen = 0;
            this.timeClose = 0;

            this.loggingService.setExtraPersistedData([{"lastActivation": this.lastActivation, "lastReset": this.lastReset, "lastChange": this.lastChange, "timesOpened": this.timesOpened, "timeOpen": this.timeOpen, "timeClose": this.timeClose}]);

        } else {
            this.lastActivation = this.loggingService.getExtraPersistedData()[0].lastActivation;
            this.lastReset = this.loggingService.getExtraPersistedData()[0].lastReset;
            this.lastChange = this.loggingService.getExtraPersistedData()[0].lastChange;
            this.timesOpened = this.loggingService.getExtraPersistedData()[0].timesOpened;
            this.timeOpen = this.loggingService.getExtraPersistedData()[0].timeOpen;
            this.timeClose = this.loggingService.getExtraPersistedData()[0].timeClose;
        }

        // initial state post homebridge-restart, otherwise no graph
        this._addFakeGatoEntry({status: this.dDevice.getState()});

        this.log.debug("%s (%s / %s) > FakeGato Characteristic loaded.", (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
    }
    // END FakeGato (eve app)
}