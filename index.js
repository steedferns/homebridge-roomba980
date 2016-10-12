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
    this.robotIP = config ["robotIP"];

    this.myRobotViaCloud = new dorita980.Cloud(this.blid, this.robotpwd);
    this.myRobotViaLocal = new dorita980.Local(this.blid, this.robotpwd, this.robotIP);
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

            this.myRobotViaLocal.pause().then((response) => {
                //console.log(response);
                this.log('Roomba is Paused!');

                callback();
                
                var checkStatus = function (time) {
                    setTimeout(
                        function () {
                            this.log('Roomba Checking the Status!');


                            this.myRobotViaLocal.getMission().then((function (data) {

                                var newData = JSON.stringify(data);
                                var status = JSON.parse(newData);

                                //console.log (status.ok.phase);
                                
                                switch (status.ok.phase) {
                                    case "stop":

                                        //var myRobotViaLocal = new dorita980.Local(this.blid, this.robotpwd, this.robotIP);

                                        this.myRobotViaLocal.dock().then(((response) => {
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
                                        this.log('Roomba is still Running... Waiting 1 second.');
                                        checkStatus(1000);
                                        break;
                                    default:
                                        this.log('Roomba is not Running....');
                                        callback();
                                        break;
                                }

                            }).bind(this)).catch(function (err) {
                                console.error(err);
                            });

                        }.bind(this), time
                    );
                }.bind(this);
                checkStatus(1000);


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
