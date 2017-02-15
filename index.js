var Service, Characteristic;
var dorita980 = require('dorita980');


module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-roomba980", "Roomba980", RoombaAccessory);
}


function RoombaAccessory(log, config) {
    this.log = log;

    // url info
    this.blid = config["blid"];
    this.robotpwd = config["robotpwd"];
    this.name = config["name"];
    this.robotIP = config["robotIP"];

    // this.myRobotViaCloud = new dorita980.Cloud(this.blid, this.robotpwd);
}

RoombaAccessory.prototype = {

    getPowerState: function (callback) {
        var myRobotViaLocal = new dorita980.Local(this.blid, this.robotpwd, this.robotIP);
		var log = this.log;

        myRobotViaLocal.getMission().then((function (status) {
            myRobotViaLocal.end();

            switch (status.cleanMissionStatus.phase) {
                case "run":
                    log('Roomba is running');
                    callback(null, 1);
                    break;
                default:
                    log('Roomba is not running');
                    callback(null, 0);
                    break;
            }

        })).catch(function (err) {
            console.error(err);
        });
    },

    setPowerState: function (powerOn, callback) {
        var myRobotViaLocal = new dorita980.Local(this.blid, this.robotpwd, this.robotIP);
		var log = this.log;

        if (powerOn) {
            log("Roomba Start!");

            myRobotViaLocal.on('connect', function () {
                myRobotViaLocal.start().then((response) => {
                    myRobotViaLocal.end();
                    log('Roomba is Running!');
                    callback();

                }).catch((err) => {
                    log('Roomba Failed: %s', err.message);
                    log(response);
                    callback(err);

                });
            });

        } else {
            log("Roomba Pause & Dock!");

            myRobotViaLocal.on('connect', function () {
                myRobotViaLocal.pause().then((response) => {
                    log('Roomba is Paused!');

                    //We call back so Siri can show success.
                    callback();

                    //We still have to dock!
                    var checkStatus = function (time) {
                        setTimeout(
                            function () {
                                log('Checking Roomba Status..');

                                myRobotViaLocal.getMission().then((function (status) {

                                    //console.log (status.cleanMissionStatus.phase);

                                    switch (status.cleanMissionStatus.phase) {
                                        case "stop":
                                            myRobotViaLocal.dock().then(((response) => {
                                                myRobotViaLocal.end();
                                                log('Roomba Docking! Goodbye!');
                                                //callback();
                                            })).catch((err) => {
                                                log('Roomba Failed: %s', err.message);
                                                log(response);
                                                console.log(err);
                                                //callback(err);
                                            });
                                            break;
                                        case "run":
                                            log('Roomba is still Running... Waiting 3 seconds');
                                            checkStatus(3000);
                                            break;
                                        default:
                                            myRobotViaLocal.end();
                                            log('Roomba is not Running....');
                                            //callback();
                                            break;
                                    }

                                })).catch(function (err) {
                                    console.error(err);
                                });

                            }, time
                        );
                    };
                    checkStatus(3000);

                }).catch((err) => {

                    log('Roomba Failed: %s', err.message);
                    log(response);
                    callback(err);

                });
			});
        }
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {
        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "Roomba Manufacturer")
            .setCharacteristic(Characteristic.Model, "Roomba Model")
            .setCharacteristic(Characteristic.SerialNumber, "Roomba Serial Number");

        var switchService = new Service.Switch(this.name);
        switchService
            .getCharacteristic(Characteristic.On)
            .on('get', this.getPowerState.bind(this))
            .on('set', this.setPowerState.bind(this));

        return [switchService];
    }
};
