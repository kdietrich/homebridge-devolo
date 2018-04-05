import { HBDevoloDevice } from '../HBDevoloDevice';
import { Devolo } from 'node-devolo/dist/Devolo';
import { Device } from 'node-devolo/dist/DevoloDevice';

export class HBDevoloRemoteControlDevice extends HBDevoloDevice {

    statelessProgrammableSwitchList = [];

    constructor(log, dAPI: Devolo, dDevice: Device, storage) {
        super(log, dAPI, dDevice, storage);

        var self = this;
        self.dDevice.events.on('onKeyPressedChanged', function(value: number) {
            if(value==3) {
                value = 2;
            }
            else if(value==2) {
                value = 3;
            }
            if(value != 0) {
                self.log.info('%s (%s / %s) > KeyPressed > %s', (self.constructor as any).name, self.dDevice.id, self.dDevice.name, value);
                self.statelessProgrammableSwitchList[value-1].getCharacteristic(self.Characteristic.ProgrammableSwitchEvent).emit('change', {newValue: 0});
            }
        });

    }

    getServices() {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(this.Characteristic.Model, 'Remote Control')
           // .setCharacteristic(Characteristic.SerialNumber, 'ABfCDEFGHI')

        for(var i=0; i<this.dDevice.getKeyCount(); i++) {
            var statelessProgrammableSwitch = new this.Service.StatelessProgrammableSwitch(this.name);
            statelessProgrammableSwitch.subtype = this.name + i;
            statelessProgrammableSwitch.getCharacteristic(this.Characteristic.ProgrammableSwitchEvent).setProps({
                maxValue: 0
            });
            this.statelessProgrammableSwitchList[this.dDevice.getKeyCount()-i-1] = statelessProgrammableSwitch;
        }

        this.dDevice.listen();

        return [this.informationService].concat(this.statelessProgrammableSwitchList);
    }

}