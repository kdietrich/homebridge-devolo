export interface HBIDevoloDevice {

    log;
    name: string;
    informationService;

    setHomebridge(homebridge);
    getServices();
}