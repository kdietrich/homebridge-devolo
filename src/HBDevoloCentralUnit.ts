import {HBIDevoloDevice} from './HBDevoloMisc';
import {HBDevoloDevice} from './HBDevoloDevice';
import {HBDevoloSwitchMeterDevice} from './devices/HBDevoloSwitchMeterDevice';
import {HBDevoloHumidityDevice} from './devices/HBDevoloHumidityDevice';
import {HBDevoloDoorWindowDevice} from './devices/HBDevoloDoorWindowDevice';
import {HBDevoloMotionDevice} from './devices/HBDevoloMotionDevice';
import {HBDevoloFloodDevice} from './devices/HBDevoloFloodDevice';
import {Devolo} from 'node-devolo/dist/Devolo';
import {Device,SwitchMeterDevice,HumidityDevice,DoorWindowDevice,MotionDevice,FloodDevice} from 'node-devolo/dist/DevoloDevice';

let Homebridge;
let Service;
let Characteristic;

export class HBDevoloCentralUnit implements HBIDevoloDevice {

    log;
    name: string;
    informationService;
    accessoryList: HBIDevoloDevice[] = [];
    dAPI: Devolo;
    heartrate: number;
    heartBeating: boolean = false;

    constructor(log, dAPI: Devolo) {
        this.log = log;
        this.dAPI = dAPI;
        this.log.debug('%s > Initializing', (this.constructor as any).name);
        this.name = 'Devolo Central Unit';
        this.heartrate = 3;
    }

    setHomebridge(homebridge) {
        Homebridge = homebridge;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
    }

    accessories(callback : (err:string, accessories?: HBIDevoloDevice[]) => void) {
        var self = this;
        this.findAccessories(function(err) {
            if(err) {
                callback(err); return;
            }
            callback(null, self.accessoryList);
        });
    }

    getServices() {
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(Characteristic.Model, 'Central Unit')
            //.setCharacteristic(Characteristic.SerialNumber, 'ABCDEFGHI')

        return [this.informationService];
    }

    /* HEARTBEAT */
    heartbeat(beat: number) : void {
        var self = this;
        if((beat % this.heartrate)===0 && !self.heartBeating) {

            this.log.debug('%s > Heartbeat', (this.constructor as any).name);
            self.heartBeating = true;

            var deviceIDs = [];
            for(var i=0; i<this.accessoryList.length; i++) {
                deviceIDs.push((this.accessoryList[i] as HBDevoloDevice).dDevice.id);
            }

            self.dAPI.getDevices(deviceIDs, function(err, devices) {
                if(err) {
                    self.log.error(err);
                }
                else {
                    var itemsProcessed = 0;
                    devices.forEach(function(refreshedDevice: Device) {

                        var oldDevice = null;
                        for(var i=0; i<self.accessoryList.length; i++) {
                            if(refreshedDevice.id == (self.accessoryList[i] as HBDevoloDevice).dDevice.id) {
                                oldDevice = self.accessoryList[i];
                            }
                        }

                        if(oldDevice) {
                            oldDevice.heartbeat(refreshedDevice);
                        }

                        itemsProcessed++;
                        if(itemsProcessed === self.accessoryList.length) {
                          self.heartBeating = false;
                          self.log.debug('%s > Heartbeat: %s done', (self.constructor as any).name, beat);
                        }

                    });
                }
                self.heartBeating = false;
            });
        }
    }

    private findAccessories(callback: (err:string) => void) : void {
        //this.accessoryList.push(new HBDevoloDevice(this.log));
        var self = this;
        this.dAPI.getAllDevices(function(err: string, devices?: Device[]) {
            if(err) {
                callback(err); return;
            }
            //console.log(JSON.stringify(devices, null, 4));

            for(var i=0; i<devices.length; i++) {
                var d = null;
                if((devices[i].constructor as any).name == (SwitchMeterDevice as any).name) {
                    d = new HBDevoloSwitchMeterDevice(self.log, self.dAPI, devices[i]);
                }
                else if((devices[i].constructor as any).name == (HumidityDevice as any).name) {
                    d = new HBDevoloHumidityDevice(self.log, self.dAPI, devices[i]);
                }
                else if((devices[i].constructor as any).name == (DoorWindowDevice as any).name) {
                    d = new HBDevoloDoorWindowDevice(self.log, self.dAPI, devices[i]);
                }
                else if((devices[i].constructor as any).name == (MotionDevice as any).name) {
                    d = new HBDevoloMotionDevice(self.log, self.dAPI, devices[i]);
                }
                else if((devices[i].constructor as any).name == (FloodDevice as any).name) {
                    d = new HBDevoloFloodDevice(self.log, self.dAPI, devices[i]);
                }
                else {
                    self.log.info("%s > Device \"%s\" is not supported (yet). Open an issue on github and ask for adding it.", (self.constructor as any).name, devices[i].model);
                }
                if(d) {
                    d.setHomebridge(Homebridge);
                    self.accessoryList.push(d);
                }
            }

            callback(null);
        });
    }
}