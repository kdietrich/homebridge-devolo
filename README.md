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
- Danfoss Thermostat Valve (LC-13)
- Qubino Flush 1
- Qubino Flush 1D
- Qubino Flush 2
- Qubino Flush Dimmer
- Qubino Flush Shutter

![homekit-macos_180713](homekit-macos_180713.png)

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

## Optional parameters

| Name of parameter | Default value | Notes |
|---|---|---|
| `ruleWhitelist`  | `['MyRule1', 'MyRule2']` | specify the rules which you want to use in Apple Home by their exact names. By default no rule is exported. |
| `sceneWhitelist`  | `['MyScene1', 'MyScene2']` | specify the scenes which you want to use in Apple Home by their exact names. By default no scene is exported. |
| `deviceBlacklist`  | `['BlockedDevice1', 'BlockedDevice2']` | specify the devices which you DON'T want to use in Apple Home by their exact names. By default all devices are exported. |
| `deviceDebugging`  | `false` | when set to true homebridge-devolo will output some debugging information and terminate afterwards. This is helpful to get information for new device integrations. |
| `fakeGato`  | `false` | when set to true homebridge-devolo will save history data for some devices, these will reported in the eve app ([screenshot here - coming soon](https://www.google.de)) |

## Credits

Powered by [node-devolo](https://github.com/kdietrich/node-devolo).
Thanks to [@nicoh88](https://github.com/nicoh88).

## Support of new devices

I'm happy to provide support for new devices. If you own an unsupported device you can provide me a debug log making the device integration easier for me. In order to do so set the config parameter `deviceDebugging` to `true` and run the following command: `homebridge -D | tee debugoutput.log`. The command will auto-finish after a while and create a textfile named `debugoutput.log`. Please attach this log file to your github issue.

## Troubleshooting

If you run into issues related to this plugin, feel free to open an issue. Please start your homebridge installation with the command `homebridge -D > logfile.txt 2>&1` and attach the generated logfile.

## Changes

#### v0.1.10-dev
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
