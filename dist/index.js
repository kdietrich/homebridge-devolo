"use strict";
var util = require('util');
var HBDevoloCentralUnit_1 = require("./HBDevoloCentralUnit");
var Devolo_1 = require("node-devolo/dist/Devolo");
var Homebridge;
var Service;
var Characteristic;
var HBDevoloPlatform = (function () {
    function HBDevoloPlatform(log, config) {
        this.version = '201702221607';
        this.log = log;
        this.log.debug('%s > Initializing (Version: %s)', this.constructor.name, this.version);
        this.config = config;
        this.config.platform = config.platform || 'Devolo';
        this.config.name = config.name || 'Devolo';
        this.config.heartrate = config.heartrate || 3;
        var debugconfig = JSON.parse(JSON.stringify(this.config));
        if (debugconfig.email)
            debugconfig.email = 'xxx';
        if (debugconfig.password)
            debugconfig.password = 'xxx';
        if (debugconfig.uuid)
            debugconfig.uuid = 'xxx';
        if (debugconfig.gateway)
            debugconfig.gateway = 'xxx';
        if (debugconfig.passkey)
            debugconfig.passkey = 'xxx';
        this.log.debug('%s > Configuration:\n%s', this.constructor.name, util.inspect(debugconfig, false, null));
    }
    HBDevoloPlatform.prototype.accessories = function (callback) {
        if (!this.config.email || !this.config.password || !this.config.host) {
            this.log.error('%s > Email, password and/or host missing in config.json.', this.constructor.name);
            return;
        }
        this.log.info('%s > Searching for Devolo Central Unit.', this.constructor.name);
        var self = this;
        this.findCentralUnit(function (err, dOptions) {
            if (err) {
                self.log.error('%s > %s', self.constructor.name, err);
                return;
            }
            self.log.info('%s > Central Unit found.', self.constructor.name);
            if (!self.config.uuid || !self.config.gateway || !self.config.passkey) {
                var s = '\n';
                s += '  "platforms": [\n';
                s += '    {\n';
                s += '      "platform": "' + self.config.platform + '",\n';
                s += '      "name": "' + self.config.name + '",\n';
                s += '      "host": "' + self.config.host + '",\n';
                s += '      "email": "' + self.config.email + '",\n';
                s += '      "password": "' + self.config.password + '",\n';
                s += '      "uuid": "' + dOptions.uuid + '",\n';
                s += '      "gateway": "' + dOptions.gateway + '",\n';
                s += '      "passkey": "' + dOptions.passkey + '"\n';
                s += '    }\n';
                s += '  ]';
                self.log.info('%s > Please edit config.json and restart homebridge.%s', self.constructor.name, s);
                return;
            }
            self.log.debug('%s > SessionID: %s', self.constructor.name, dOptions.sessionid);
            var accessoryList = [];
            accessoryList.push(self.centralUnit);
            self.centralUnit.accessories(function (err, accessories) {
                if (err) {
                    throw err;
                }
                for (var i = 0; i < accessories.length; i++) {
                    accessoryList.push(accessories[i]);
                }
                /* HEARTBEAT */
                var beat = -1;
                setInterval(function () {
                    beat += 1;
                    beat %= 7 * 24 * 3600;
                    self.log.debug('%s > Beat: %s', self.constructor.name, beat);
                    self.centralUnit.heartbeat(beat);
                }.bind(this), 1000);
                callback(accessoryList);
            });
        });
    };
    HBDevoloPlatform.prototype.findCentralUnit = function (callback) {
        var self = this;
        var options = {
            email: self.config.email,
            password: self.config.password,
            centralHost: self.config.host,
            uuid: self.config.uuid,
            gateway: self.config.gateway,
            passkey: self.config.passkey,
            sessionid: '' //renew?
        };
        new Devolo_1.Devolo(options, function (err, d) {
            if (err) {
                callback(err);
                return;
            }
            self.log.debug('%s > Devolo API Version: %s', self.constructor.name, d.version);
            self.centralUnit = new HBDevoloCentralUnit_1.HBDevoloCentralUnit(self.log, self.config, d);
            self.centralUnit.setHomebridge(Homebridge);
            callback(null, d._options);
        });
    };
    return HBDevoloPlatform;
}());
module.exports = function (homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    Characteristic.CurrentConsumption = function () {
        Characteristic.call(this, 'CurrentConsumption', '00000010-0000-0000-0000-199207310822');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'W',
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = 0;
    };
    util.inherits(Characteristic.CurrentConsumption, Characteristic);
    Characteristic.TotalConsumption = function () {
        Characteristic.call(this, 'TotalConsumption', '00000011-0000-0000-0000-199207310822');
        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'W',
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = 0;
    };
    util.inherits(Characteristic.TotalConsumption, Characteristic);
    Characteristic.TotalConsumptionSince = function () {
        Characteristic.call(this, 'TotalConsumptionSince', '00000012-0000-0000-0000-199207310822');
        this.setProps({
            format: Characteristic.Formats.STRING,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });
        this.value = '';
    };
    util.inherits(Characteristic.TotalConsumptionSince, Characteristic);
    homebridge.registerPlatform("homebridge-devolo", "Devolo", HBDevoloPlatform, false);
};
