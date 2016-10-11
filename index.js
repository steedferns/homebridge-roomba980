var Service, Characteristic;
var request = require('request');
var dorita980 = require('dorita980');


module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-roomba", "Roomba", RoombaAccessory);
}


function RoombaAccessory(log, config) {
    this.log = log;

    // url info
    this.blid = config["blid"];
    this.robotpwd = config["robotpwd"];
    this.irobotapi = 'https://irobot.axeda.com/services/v1/rest/Scripto/execute/AspenApiRequest';
    this.name = config["name"];

    this.myRobotViaCloud = new dorita980.Cloud(this.blid, this.robotpwd);
}

RoombaAccessory.prototype = {

 
    setPowerState: function (powerOn, callback) {
        if (powerOn) {
            this.log("Roomba Start!");

            this.myRobotViaCloud.start().then((response) => {
                //console.log(response);
                this.log('Roomba is Running!');
                callback();

            }).catch((err) => {

                this.log('Roomba Failed: %s', err.message);
                this.log(response);

                callback(err);

            });

        } else {
            this.log("Roomba Pause & Dock!");

            this.myRobotViaCloud.pause().then((response) => {
                //console.log(response);
                this.log('Roomba is Paused!');

                var checkStatus = function (time) {
                    setTimeout(
                        function () {
                            this.log('Roomba Checking the Status!');


                            this.myRobotViaCloud.getStatus().then((function (data) {

                                //console.log(data);
                                
                                var status = JSON.parse(data.robot_status);

                                switch (status.phase) {
                                    case "stop":

                                        var myRobotViaCloud = new dorita980.Cloud(this.blid, this.robotpwd);

                                        this.myRobotViaCloud.dock().then(((response) => {
                                            this.log('Roomba Docking! Goodbye!');
                                            callback();

                                        }).bind(this)).catch((err) => {

                                            this.log('Roomba Failed: %s', err.message);
                                            this.log(response);
                                            console.log(err);
                                            callback(err);
                                            
                                        });

                                        break;
                                    case "run":
                                        this.log('Roomba is still Running... Wait a 3sec.');
                                        checkStatus(3000);
                                        break;
                                    default:
                                        this.log('Roomba is not Running...You Please Help.');
                                        callback();
                                        break;
                                }

                            }).bind(this)).catch(function (err) {
                                console.error(err);
                            });

                        }.bind(this), time
                    );
                }.bind(this);
                checkStatus(3000);


            }).catch((err) => {

                this.log('Roomba Failed: %s', err.message);
                this.log(response);
                callback(err);

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
            .on('set', this.setPowerState.bind(this));

        return [switchService];
    }
};