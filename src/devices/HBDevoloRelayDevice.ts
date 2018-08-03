import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

const moment = require('moment');

export class HBDevoloRelayDevice extends HBDevoloDevice {

    switchService;

    // FakeGato (eve app)
    totalConsumption;
    lastValue;
    lastChange;
    totalConsumptionSincelastChange;
    secondsSincelastChange;
    lastReset;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onStateChanged', function(state: number) {
            self.log.info('%s (%s / %s) > State > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        self.dDevice.events.on('onCurrentValueChanged', function(type: string, value: number) {
            if(type==='energy') {
                self.log.info('%s (%s / %s) > CurrentConsumption > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloCurrentConsumption).updateValue(value, null);

                // START FakeGato (eve app)
                if (self.config.fakeGato) {
                    self._addFakeGatoEntry({power: value});
                    self.secondsSincelastChange = moment().unix() - self.lastChange;
                    self.totalConsumptionSincelastChange = +(self.lastValue * (self.secondsSincelastChange / 3600) / 1000).toFixed(6); // kWh
                    self.totalConsumption = +(self.totalConsumption + self.totalConsumptionSincelastChange).toFixed(6); // kWh

                    self.switchService.getCharacteristic(self.Characteristic.CurrentConsumption).updateValue(value, null)
                    self.switchService.getCharacteristic(self.Characteristic.TotalConsumption).updateValue(self.totalConsumption, null)

                    self.log.info("%s (%s / %s) > FakeGato > CurrentConsumption changed to %s W > lastValue was %s, totalConsumption set to %s kWh, lastChange set to %s, secondsSincelastChange was %s, totalConsumptionSincelastChange was %s kWh, lastReset is %s", (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, self.lastValue,  self.totalConsumption, self.lastChange, self.secondsSincelastChange, self.totalConsumptionSincelastChange, self.lastReset)

                    self.lastChange = moment().unix();
                    self.lastValue = value;
                    self.loggingService.setExtraPersistedData([{"totalConsumption": self.totalConsumption, "lastValue": self.lastValue, "lastChange": self.lastChange, "lastReset": self.lastReset}]);
                }
                // END FakeGato (eve app)

            }
        });
        self.dDevice.events.on('onTotalValueChanged', function(type: string, value: number) {
            if(type==='energy') {
                self.log.info('%s (%s / %s) > DevoloTotalConsumption > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloTotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function(type: string, value: number) {
            if(type==='energy') {
                self.log.info('%s (%s / %s) > DevoloTotalConsumptionSince > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.switchService.getCharacteristic(self.Characteristic.DevoloTotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Relay')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.switchService = new this.Service.Outlet(this.name);
        this.switchService.getCharacteristic(this.Characteristic.On)
                     .on('get', this.getSwitchState.bind(this))
                     .on('set', this.setSwitchState.bind(this));
        this.switchService.addCharacteristic(this.Characteristic.DevoloCurrentConsumption)
                    .on('get', this.getDevoloCurrentConsumption.bind(this))
        this.switchService.addCharacteristic(this.Characteristic.DevoloTotalConsumption)
                    .on('get', this.getDevoloTotalConsumption.bind(this))
        this.switchService.addCharacteristic(this.Characteristic.DevoloTotalConsumptionSince)
                    .on('get', this.getDevoloTotalConsumptionSince.bind(this))

        var services = [this.informationService, this.switchService];

        // START FakeGato (eve app)
        if (this.config.fakeGato) {
            this._addFakeGatoHistory('energy',false);
            this.CheckFakeGatoHistoryLoaded();
            services = services.concat([this.loggingService]);
        }
        // END FakeGato (eve app)

        this.dDevice.listen();
        return services;
    }

    getSwitchState(callback) {
        this.log.debug('%s (%s / %s) > getSwitchState', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getState()!=0);
    }

    getDevoloCurrentConsumption(callback) {
        this.log.debug('%s (%s / %s) > getDevoloCurrentConsumption', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    }

    getDevoloTotalConsumption(callback) {
        this.log.debug('%s (%s / %s) > getDevoloTotalConsumption', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getTotalValue('energy'));
    }

    getDevoloTotalConsumptionSince(callback) {
        this.log.debug('%s (%s / %s) > getDevoloTotalConsumptionSince', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, new Date(this.dDevice.getSinceTime('energy')).toISOString().replace(/T/, ' ').replace(/\..+/, ''));
    }

    setSwitchState(value, callback) {
        this.log.debug('%s (%s / %s) > setSwitchState to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        if(value==this.dDevice.getState()) {
            callback();
            return;
        }
        var self = this;
        if(value) {
            this.dDevice.turnOn(function(err) {
                if(err) {
                    callback(err); return;
                }
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function(err) {
                if(err) {
                    callback(err); return;
                }
                callback();
            });
        }
    }

    // START FakeGato (eve app)
    getCurrentConsumption(callback) {
        this.log.debug('%s (%s / %s) > getCurrentConsumption', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.dDevice.getCurrentValue('energy'));
    }

    getTotalConsumption(callback) {
        this.log.debug('%s (%s / %s) > getTotalConsumption', (this.constructor as any).name, this.dDevice.id, this.dDevice.name);
        return callback(null, this.totalConsumption);
    }

    getReset(callback) {
        this.log.debug('%s (%s / %s) > getResetTime will report %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.lastReset);
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback(null, this.lastReset);
    }

    setReset(value, callback) {
        this.log.debug('%s (%s / %s) > setResetTime to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        this.totalConsumption = 0;
        this.lastReset = value;
        this.loggingService.setExtraPersistedData([{"totalConsumption": this.totalConsumption, "lastValue": this.lastValue, "lastChange": this.lastChange, "lastReset": this.lastReset}]);
        if (this.switchService.getCharacteristic(this.Characteristic.TotalConsumption)) {
            this.switchService.getCharacteristic(this.Characteristic.TotalConsumption).updateValue(this.totalConsumption, null)
        }
        this.loggingService.getCharacteristic(this.Characteristic.ResetTotal).updateValue(this.lastReset, null);
        return callback();
    }

    CheckFakeGatoHistoryLoaded() {
        if(this.loggingService.isHistoryLoaded() == false) {
              setTimeout(this.CheckFakeGatoHistoryLoaded.bind(this), 100);
        } else {
            this.switchService.addCharacteristic(this.Characteristic.CurrentConsumption)
                .on('get', this.getCurrentConsumption.bind(this));
            this.switchService.addCharacteristic(this.Characteristic.TotalConsumption)
                .on('get', this.getTotalConsumption.bind(this));
            this.loggingService.addCharacteristic(this.Characteristic.ResetTotal)
                .on('get', this.getReset.bind(this))
                .on('set', this.setReset.bind(this));

            if (this.loggingService.getExtraPersistedData() == undefined) {
                this.totalConsumption = 0;
                this.lastValue = 0;
                this.lastChange = moment().unix();
                this.totalConsumptionSincelastChange = 0;
                this.secondsSincelastChange = 0;
                this.lastReset = moment().unix() - moment('2001-01-01T00:00:00Z').unix();

                this.loggingService.setExtraPersistedData([{"totalConsumption": this.totalConsumption, "lastValue": this.lastValue, "lastChange": this.lastChange, "lastReset": this.lastReset}]);

            } else {
                this.totalConsumption = this.loggingService.getExtraPersistedData()[0].totalConsumption;
                this.lastValue =  this.loggingService.getExtraPersistedData()[0].lastValue;
                this.lastChange = this.loggingService.getExtraPersistedData()[0].lastChange;
                this.totalConsumptionSincelastChange = 0;
                this.secondsSincelastChange = 0;
                this.lastReset = this.loggingService.getExtraPersistedData()[0].lastReset;

            }
        }
    }
    // END FakeGato (eve app)
}