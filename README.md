# homebridge-devolo

## Homebridge plugin for Devolo Home Control
(C) 2017-2018, Kevin Dietrich

This homebridge plugin allows you to control your Devolo Home Control devices via Apple's homekit. The following devices are currently supported:

- Devolo Smart Metering Plug (v1/v2)
- Devolo Motion Sensor
- Devolo Humidity Sensor
- Devolo Motion Sensor
- Devolo Door Sensor / Window Contact
- Devolo Thermostat Valve
- Devolo Smoke Detector
- Devolo Room Thermostat
- Devolo Leak Sensor
- Devolo Wall Switch
- Devolo Remote Control
- Devolo Alarm Siren (has no function until Apple improves their alarm system implementation)
- Devolo Flush Relay
- Devolo Flush Dimmer
- Devolo Flush Shutter
- Danfoss Thermostat Valve (LC-13)
- Qubino Flush 1
- Qubino Flush 1D
- Qubino Flush 2
- Qubino Flush Dimmer
- Qubino Flush Shutter

![homekit-macos_180713](pictures/_homekit-macos_180713.png)

Feel free to submit an issue or pull request to add more.

## How-to

1. Install homebridge: `npm install -g homebridge`
2. Install homebridge-devolo plugin: `npm install -g homebridge-devolo`
3. Modify your `config.json`. Host is the IP address of your Devolo Home Control central unit. Email and password are your mydevolo.com credentials.

```
"platforms": [
  {
    "platform" : "Devolo",
    "name" : "Devolo",
    "host" : "x.x.x.x",
    "email" : "mail@host.com",
    "password" : "topsecret123"
  }
]
```

Important: If you are using multiple central units with the same myDevolo account, please follow the special install instructions described below.

## Optional parameters

| Name of parameter | Default value | Notes |
|---|---|---|
| `ruleWhitelist`  | `['MyRule1', 'MyRule2']` | specify the rules which you want to use in Apple Home by their exact names. By default no rule is exported. |
| `sceneWhitelist`  | `['MyScene1', 'MyScene2']` | specify the scenes which you want to use in Apple Home by their exact names. By default no scene is exported. |
| `deviceBlacklist`  | `['BlockedDevice1', 'BlockedDevice2']` | specify the devices which you DON'T want to use in Apple Home by their exact names. By default all devices are exported. |
| `deviceDebugging`  | `false` | when set to true homebridge-devolo will output some debugging information and terminate afterwards. This is helpful to get information for new device integrations. |
| `fakeGato`  | `false` | when set to true homebridge-devolo will save history data for some devices, these will reported in the eve app ([screenshots here](pictures/fakegato/)) |
| `lightBlacklist`  | `['BlockedLightDevice1', 'BlockedLightDevice2']` | specify door or motion devices which you DON'T want to use his light/lux sensor in Apple Home by their exact names. By default all devices are exported. |
| `tempBlacklist`  | `['BlockedTempDevice1', 'BlockedTempDevice2']` | specify door or motion devices which you DON'T want to use his temperature sensor in Apple Home by their exact names. By default all devices are exported. |
| `fakeGaragedoor`  | `false` | when set to true homebridge-devolo will emulate a full compatible garage door (more info [here](#garage-door)) |

## Multiple central units

If you have multiple central units with the same myDevolo account you will likely receive the following error message when starting up homebridge: "[Devolo] HBDevoloPlatform > SyntaxError: Unexpected token U in JSON at position 0". Please follow the following instructions to resolve this: Log in to your myDevolo account and click on the pen icon beneath the central unit you want to use. Note the serial number of the central unit. Add the following entry to your config.json (beside host, email, password etc.):

```
    ...
    "gateway" : "your_serial_number"
    ...
```

## Garage Door

You need a devolo door/window contact (garage door) and a qubino flush 1d (garage door motor) - [pictures & screenshots](pictures/garagedoor/). ~~Addition you still need a myDevolo rule: If the qubino flush 1d turn on for 1 second, then turn off.~~

Add the following entry to your config.json

```
    ...
    "fakeGaragedoor": true,
    "fakeGaragedoorParams": {
        "openTime": 15,
        "doorDevice": "garage door contact",
        "relayDevice": "garage door motor"
    ...
```

| Name of parameter | Notes |
|---|---|
| `openTime`  | specify the time until the garage door is completely open. |
| `doorDevice`  | specify the door contact by their exact names in myDevolo. |
| `relayDevice`  | specify the relay device by their exact names in myDevolo. |

## Credits

Powered by [node-devolo](https://github.com/kdietrich/node-devolo).
Thanks to [@nicoh88](https://github.com/nicoh88).

## Support of new devices

I'm happy to provide support for new devices. If you own an unsupported device you can provide me a debug log making the device integration easier for me. In order to do so set the config parameter `deviceDebugging` to `true` and run the following command: `homebridge -D | tee debugoutput.log`. The command will auto-finish after a while and create a textfile named `debugoutput.log`. Please attach this log file to your github issue.

## Troubleshooting

If you run into issues related to this plugin, feel free to open an issue. Please start your homebridge installation with the command `homebridge -D > logfile.txt 2>&1` and attach the generated logfile.

## Changes

#### v0.1.11-dev
- Devolo flush shutter supported
- add a full compatible garage door with one Devolo Door Sensor / Window Contact and one Qubino Flush 1D

#### v0.1.10 (2018-08-03)
- add `lightBlacklist` (light/lux sensor) and `tempBlacklist` (temperature sensor) for Devolo Door Sensor / Window Contact and Devolo Motion Sensor
- add FakeGato History (Eve App) DOOR for Devolo Door Sensor / Window Contact
- add FakeGato History (Eve App) MOTION for Devolo Motion Sensor
- add FakeGato History (Eve App) ENERGY for Devolo Smart Metering (v1/v2), Devolo Flush Relay, Devolo Flush Dimmer, Qubino Flush 1 and Qubino Flush Dimmer

#### v0.1.9 (2018-07-16)
- Devolo flush relay & dimmer supported
- Qubino flush X relay & dimmer supported
- Danfoss thermostat valve (LC-13) supported
- Bugfix for 2 websocket reconnect issues

#### v0.1.8 (2018-04-20)
- Alarm siren supported
- Bugfix: Device debugging

#### v0.1.7 (2018-02-27)
- Remote control supported
- Bugfix: Status of rules is displayed correctly
- Device debugging for faster support of new devices

#### v0.1.6 (2018-01-18)
- Wall Switch supported
- Filter devices with deviceBlacklist
- Bugfix: Increased max listeners

#### v0.1.5 (2017-09-29)
- Qubino Flush Shutter supported
- Sockets instead of slow polling
- Various bugfixes
- Performance improvements

#### v0.1.4 (2017-07-15)
- Smoke Detector supported
- Thermostat Valve supported
- Room Thermostat supported
- Smart Metering Plug v2 supported
- Support of Rules and Scenes via whitelist
- Performance optimizations
- Bugfix: Restart heartbeat in case of an error
- Bugfix: Renew session if it has gone invalid

#### v0.1.3 (2017-03-06)
- Switch Meter Device does not switch if disabled in devolo webgui.
- Switch Meter Device shows current consumption and total consumption.
- Door Sensor / Window Contact and Motion Device show light level.
- Heartrate interval can be specified in config.
- Bugfix: Fast switching of Switch Meter Device.

#### v0.1.2 (2017-02-22)
- Bugfix: Switching of Switch Meter Device.

#### v0.1.1 (2017-02-21)
- First version.

## License

The MIT License (MIT)

Copyright (c) 2017-2018 Kevin Dietrich

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
