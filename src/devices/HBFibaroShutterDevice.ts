import {HBDevoloDevice} from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBFibaroShutterDevice extends HBDevoloDevice {

    windowCoveringService;

    apiGetValue;
    apiGetTargetValue;
    apiCurrentPosition;

    shutterLastPosition;
    shutterLastConsumption;
    shutterLastCurrentValue;
    shutterLastTargetValue;
    shutterLastPositionState;
    shutterLastOperationStatus;

    _delayedInterval;

    constructor(log, dAPI: Devolo, dDevice: Device, storage, config) {
        super(log, dAPI, dDevice, storage, config);

        var self = this;
        self.dDevice.events.on('onValueChanged', function(type: string, value: number) {
            if (type==='Power') {
                self.log.info('%s (%s / %s) > onValueChanged > Current power consumption was %s, now set to %s (sensor type: %s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastConsumption, value, type);
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloCurrentConsumption).updateValue(value, null);
                self.shutterLastConsumption = value;
                if(value < 1) {
                    self.shutterLastPositionState = self.Characteristic.PositionState.STOPPED
                    self.shutterLastPosition = 99 - self.dDevice.getValue('base');
                    self.shutterLastTargetValue = 99 - self.dDevice.getTargetValue('base');

                    self.log.info('%s (%s / %s) is not using power --> Target position %s, Current position is %s, setting position state to stopped',
                        (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastTargetValue, self.shutterLastPosition);

                    self.windowCoveringService.getCharacteristic(self.Characteristic.PositionState).updateValue(self.Characteristic.PositionState.STOPPED, null);
                    self.windowCoveringService.getCharacteristic(self.Characteristic.CurrentPosition).updateValue(self.shutterLastPosition, null);
                    self.windowCoveringService.getCharacteristic(self.Characteristic.TargetPosition).updateValue(self.shutterLastTargetValue, null);
            
                } else {
                    self.apiCurrentPosition = 99 - self.dDevice.getValue('base');
                    if (self.shutterLastPosition < self.apiCurrentPosition) {
                        // open
                        self.windowCoveringService.getCharacteristic(self.Characteristic.PositionState).updateValue(self.Characteristic.PositionState.INCREASING, null);
                        self.log.info('%s (%s / %s) is using power --> Last position %s < Current position is %s, set position state to increasing',
                            (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastPosition, self.apiCurrentPosition);
                        self.shutterLastPositionState = self.Characteristic.PositionState.INCREASING;
                    } else
                    if (self.shutterLastPosition > self.apiCurrentPosition) {
                        // close
                        self.windowCoveringService.getCharacteristic(self.Characteristic.PositionState).updateValue(self.Characteristic.PositionState.DECREASING, null);
                        self.log.info('%s (%s / %s) is using power --> Last position %s > Current position is %s, set position state to decreasing',
                            (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastPosition, self.apiCurrentPosition);
                        self.shutterLastPositionState = self.Characteristic.PositionState.DECREASING;
                    } else {
                        self.log.info('%s (%s / %s) is using power --> Last position %s == Current position is %s - IGNORING!',
                            (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastPosition, self.apiCurrentPosition);
                    }
                }
            }
            else if (type==='base') {
                if (self.shutterLastOperationStatus && (self.shutterLastOperationStatus == 1)) {
                    self.log.info('%s (%s / %s) > onValueChanged > Position was %s, should set to %s (sensor type: %s) but will be IGNORED (LastOperationStatus == 1)',
                            (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastPosition, 99 - value, type);
                } else {
                    self.log.info('%s (%s / %s) > onValueChanged > Position was %s, now set to %s (sensor type: %s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastPosition, 99 - value, type);
                    self.shutterLastPosition = 99 - value;
                }
            }
            else {
                self.log.info('%s (%s / %s) > onValueChanged (UNKNOWN TYPE) > value set to %s (sensor type: %s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, type);
            }
        });
        self.dDevice.events.on('onTargetValueChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > onTargetValueChanged > TargetPosition was %s and is now set to %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, self.shutterLastTargetValue, 99 - value);
            self.shutterLastTargetValue = 99 - value;
        });
        self.dDevice.events.on('onOperationStatusChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > onOperationStatusChanged > OperationStatus is now %s (sensor type: %s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, type);
            self.shutterLastOperationStatus = value;
        });
        self.dDevice.events.on('onCurrentValueChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > onCurrentValueChanged > DevoloCurrentConsumption now set to %s (sensor type: %s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, type);
            if(type==='energy') {
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloCurrentConsumption).updateValue(value, null);
                self.log.info('%s (%s / %s) > onCurrentValueChanged > CurrentConsumption is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            }
        });
        self.dDevice.events.on('onTotalValueChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > onTotalValueChanged > DevoloTotalConsumption is %s (type %s)', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value, type);
            if(type==='energy') {
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloTotalConsumption).updateValue(value, null);
            }
        });
        self.dDevice.events.on('onSinceTimeChanged', function(type: string, value: number) {
            self.log.info('%s (%s / %s) > onSinceTimeChanged > DevoloTotalConsumptionSince is %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            if(type==='energy') {
                self.windowCoveringService.getCharacteristic(self.Characteristic.DevoloTotalConsumptionSince).updateValue(new Date(value).toISOString().replace(/T/, ' ').replace(/\..+/, ''), null);
            }
        });
    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Fibaro')
            .setCharacteristic(this.Characteristic.Model, 'Shutter')
            .setCharacteristic(this.Characteristic.SerialNumber, this.dDevice.id.replace('/','-'))

        this.windowCoveringService = new this.Service.WindowCovering();
        this.windowCoveringService.getCharacteristic(this.Characteristic.CurrentPosition)
                     .on('get', this.getValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.PositionState).updateValue(this.Characteristic.PositionState.STOPPED, null);
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition)
                     .on('get', this.getTargetValue.bind(this))
                     .on('set', this.setTargetValue.bind(this));
        this.windowCoveringService.getCharacteristic(this.Characteristic.TargetPosition).setProps({
            minValue: 0,
            maxValue: 99,
            minStep: 1
        });

        this.windowCoveringService.getCharacteristic(this.Characteristic.DevoloTotalConsumption).updateValue(this.dDevice.getTotalValue('energy'), null);
        this.windowCoveringService.getCharacteristic(this.Characteristic.DevoloCurrentConsumption).updateValue(0, null);

        this.shutterLastPosition = 99 - this.dDevice.getValue('base');
        this.shutterLastTargetValue = 99 - this.dDevice.getTargetValue('base');
        this.shutterLastPositionState = this.Characteristic.PositionState.STOPPED;

        //this.log.info("--> ShutterDevice %s: ", JSON.stringify(this.dDevice,null,2));

        this.dDevice.listen();
        return [this.informationService, this.windowCoveringService];
    }

    getValue(callback) {
        this.apiGetValue = 99 - this.dDevice.getValue('base')
        this.log.debug('%s (%s / %s) > getValue is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetValue);
        return callback(null, this.apiGetValue);
    }

    getTargetValue(callback) {
        this.apiGetTargetValue = 99 - this.dDevice.getTargetValue('base')
        this.log.debug('%s (%s / %s) > getTargetValue is %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, this.apiGetTargetValue);
        return callback(null, this.apiGetTargetValue);
    }

    setTargetValue(value, callback) {
        //this.log.debug('%s (%s / %s) > setTargetValue to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, value);
        if(value==this.dDevice.getTargetValue('base')) {
            callback();
            return;
        }
        if(value==0 || value==99) {
            this.log.debug('%s (%s / %s) > setTargetValue to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, 99 - value);
            this.dDevice.setTargetValue('base', 99 - value, function(err) {}, true);
        } else {
            this.log.debug('%s (%s / %s) > setTargetValue delayed to %s', (this.constructor as any).name, this.dDevice.id, this.dDevice.name, 99 - value);
            this._setTargetValueDelayed(1500, 99 - value);
        }
        callback();
    }

    _setTargetValueDelayed(delay, value) {
        var self = this;
        if(self._delayedInterval) {
            clearTimeout(self._delayedInterval);
        }
        self._delayedInterval = setTimeout(function() {
            self.log.debug('%s (%s / %s) > setTargetValue now to %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
            self.dDevice.setTargetValue('base', value, function(err) {}, true);
        }, delay);
    }
}