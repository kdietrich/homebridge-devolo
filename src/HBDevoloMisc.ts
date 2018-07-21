export interface HBIDevoloDevice {

    log;
    name: string;
    informationService;

    setHomebridge(homebridge);
    getServices();
}

export class HBDevoloPlatformConfig {
    platform: string;
    name: string;
    email: string;
    host: string;
    password: string;
    uuid: string;
    gateway: string;
    passkey: string;
    heartrate: number;
    ruleWhitelist?: string[];
    sceneWhitelist?: string[];
    deviceBlacklist?: string[];
    deviceDebugging?: boolean = false;
    fakeGato?: boolean = false;
}