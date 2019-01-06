import {HBDevoloPlatformConfig,HBIDevoloDevice} from './HBDevoloMisc';
import {HBDevoloDevice} from './HBDevoloDevice';
import {HBFakeGarageDoor} from './HBFakeGarageDoor';
import {HBDevoloSwitchMeterDevice} from './devices/HBDevoloSwitchMeterDevice';
import {HBDevoloHumidityDevice} from './devices/HBDevoloHumidityDevice';
import {HBDevoloDoorWindowDevice} from './devices/HBDevoloDoorWindowDevice';
import {HBDevoloMotionDevice} from './devices/HBDevoloMotionDevice';
import {HBDevoloFloodDevice} from './devices/HBDevoloFloodDevice';
import {HBDevoloThermostatValveDevice} from './devices/HBDevoloThermostatValveDevice';
import {HBDevoloSmokeDetectorDevice} from './devices/HBDevoloSmokeDetectorDevice';
import {HBDevoloRoomThermostatDevice} from './devices/HBDevoloRoomThermostatDevice';
import {HBDevoloWallSwitchDevice} from './devices/HBDevoloWallSwitchDevice';
import {HBDevoloRemoteControlDevice} from './devices/HBDevoloRemoteControlDevice';
import {HBDevoloSirenDevice} from './devices/HBDevoloSirenDevice';
import {HBDevoloShutterDevice} from './devices/HBDevoloShutterDevice';
import {HBDevoloRelayDevice} from './devices/HBDevoloRelayDevice';
import {HBDevoloDimmerDevice} from './devices/HBDevoloDimmerDevice';
import {HBOtherRelaySwitchXDevice} from './devices/HBOtherRelaySwitchXDevice';
import {HBPoppZWeatherDevice} from './devices/HBPoppZWeatherDevice';
import {HBDevoloRule} from './devices/HBDevoloRule';
import {HBDevoloScene} from './devices/HBDevoloScene';
import {Devolo} from 'node-devolo/dist/Devolo';
import {Device,SwitchMeterDevice,HumidityDevice,DoorWindowDevice,MotionDevice,FloodDevice,ThermostatValveDevice,SmokeDetectorDevice,RoomThermostatDevice,ShutterDevice,WallSwitchDevice,RemoteControlDevice,SirenDevice,RelayDevice,DimmerDevice,RelaySwitchXDevice,ZWeatherDevice} from 'node-devolo/dist/DevoloDevice';
import {Rule,Scene} from 'node-devolo/dist/DevoloMisc';

const storage = require('node-persist');

let Homebridge;
let Service;
let Characteristic;

export class HBDevoloCentralUnit implements HBIDevoloDevice {

    log;
    config: HBDevoloPlatformConfig;
    name: string;
    informationService;
    accessoryList: HBIDevoloDevice[] = [];
    deviceList: HBIDevoloDevice[] = [];
    ruleList: HBIDevoloDevice[] = [];
    sceneList: HBIDevoloDevice[] = [];
    dAPI: Devolo;

    constructor(log, config: HBDevoloPlatformConfig, dAPI: Devolo) {
        this.log = log;
        this.dAPI = dAPI;
        this.config = config;
        this.log.debug('%s > Initializing', (this.constructor as any).name);
        this.name = 'Devolo Central Unit';
    }

    setHomebridge(homebridge) {
        Homebridge = homebridge;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
    }

    initStorage() {
        storage.initSync({dir: Homebridge.user.storagePath() + '/.homebridge-devolo/node-persist'});
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
                if(self.config.deviceBlacklist && self._isInList(devices[i].name, self.config.deviceBlacklist))
                    continue;

                if((devices[i].constructor as any).name == (SwitchMeterDevice as any).name) {
                    d = new HBDevoloSwitchMeterDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (HumidityDevice as any).name) {
                    d = new HBDevoloHumidityDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (DoorWindowDevice as any).name) {
                    d = new HBDevoloDoorWindowDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (MotionDevice as any).name) {
                    d = new HBDevoloMotionDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (FloodDevice as any).name) {
                    d = new HBDevoloFloodDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (ThermostatValveDevice as any).name) {
                    d = new HBDevoloThermostatValveDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (SmokeDetectorDevice as any).name) {
                    d = new HBDevoloSmokeDetectorDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (RoomThermostatDevice as any).name) {
                    d = new HBDevoloRoomThermostatDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (WallSwitchDevice as any).name) {
                    d = new HBDevoloWallSwitchDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (RemoteControlDevice as any).name) {
                    d = new HBDevoloRemoteControlDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (SirenDevice as any).name) {
                    d = new HBDevoloSirenDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (ShutterDevice as any).name) {
                    d = new HBDevoloShutterDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (RelayDevice as any).name) {
                    d = new HBDevoloRelayDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (DimmerDevice as any).name) {
                    d = new HBDevoloDimmerDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (RelaySwitchXDevice as any).name) {
                    d = new HBOtherRelaySwitchXDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else if((devices[i].constructor as any).name == (ZWeatherDevice as any).name) {
                    d = new HBPoppZWeatherDevice(self.log, self.dAPI, devices[i], storage, self.config);
                }
                else {
                    self.log.info("%s > Device \"%s\" is not supported (yet). Open an issue on github and ask for adding it.", (self.constructor as any).name, devices[i].model);
                }
                if(d) {
                    d.setHomebridge(Homebridge);
                    self.accessoryList.push(d);
                    self.deviceList.push(d);
                }
            }

            if(self.config.fakeGaragedoor) {
                var fakeGarageDoor = new HBFakeGarageDoor(self.log, self.dAPI, devices, storage, self.config);
                fakeGarageDoor.setHomebridge(Homebridge);
                self.accessoryList.push(fakeGarageDoor);
                self.deviceList.push(fakeGarageDoor);
            }

            self.dAPI.getRules(function(err: string, rules?: Rule[]) {
                if(err) {
                    callback(err); return;
                }
                for(var i=0; i<rules.length; i++) {
                    if(self.config.ruleWhitelist && self._isInList(rules[i].name, self.config.ruleWhitelist)) {
                        var d = new HBDevoloRule(self.log, self.dAPI, rules[i], storage, self.config);
                        d.setHomebridge(Homebridge);
                        self.accessoryList.push(d);
                        self.ruleList.push(d);
                    }
                }

                self.dAPI.getScenes(function(err: string, scenes?: Scene[]) {
                    if(err) {
                        callback(err); return;
                    }
                    for(var i=0; i<scenes.length; i++) {
                        if(self.config.sceneWhitelist && self._isInList(scenes[i].name, self.config.sceneWhitelist)) {
                            var d = new HBDevoloScene(self.log, self.dAPI, scenes[i], storage, self.config);
                            d.setHomebridge(Homebridge);
                            self.accessoryList.push(d);
                            self.sceneList.push(d);
                        }
                    }
                    callback(null);
                });

            });

        });
    }

    public startHeartbeatHandler() : void {
        var self = this;
        var interval = setInterval(function ping() {
            self.dAPI.getZones(function(err, zones) {
                if(err) {
                    self.log.info('Fetching new session...');
                    clearInterval(interval);
                    self.dAPI.auth(function(err) {
                        if(err) {
                            self.log.error(err);
                            self.startHeartbeatHandler();
                            return;
                        }
                        self.startHeartbeatHandler();
                        self.log.info('Session successfully renewed.');
                    }, true);
                }
            });
        }, 30000);
    }

    private _isInList(name: string, list: string[]) : boolean {
        for(var i=0; i<list.length; i++) {
            if(name===list[i])
                return true;
        }
        return false;
    }

}