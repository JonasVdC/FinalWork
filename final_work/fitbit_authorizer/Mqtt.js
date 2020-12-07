const mqtt = require('mqtt');
const fs = require('fs');

module.exports = class MQTT {


    constructor(config) {
        this.config = config;
        let cleanUrl = this.UrlCleaning();
        this.HOST_ADDRESS = cleanUrl;
        this.DEVICE_ALTERNATE_ID = config.mqtt.Device;
        this.SENSOR_ALTERNATE_ID = config.mqtt.Sensor;
        this.CAPABILITY_ALTERNATE_ID = config.mqtt.Capability;
        this.CERTIFICATE_FILE = "certificates/fitbit_certificate.pem";
        this.PASSPHRASE_FILE = "certificates/fitbit_passphrase.txt";
        this.mqttClient = this.connectToMQTT();
        this.lastData = {
            OoR: "Out of Range",
            minutesOoR: 512,
            FB: "Fat Burn",
            minutesFB: 46,
            C: "Cardio",
            minutesC: 0,
            P: "Peak",
            minutesP: 0
        }

        setInterval(() => {
            this.lastData = this.generateData()
            this.sendDataViaMQTT()
        }, 30000);
    };


    getIoTCockpitURL() {
        return `${this.config.destinations.find(oDest => oDest.destinationConfiguration.Name === "final_work-IOT").destinationConfiguration.URL}`;
    };

    UrlCleaning() {
        let IncomingUrl = this.getIoTCockpitURL();
        let cleanedUrl = IncomingUrl.substr(8);
        return cleanedUrl;
    };

    generateData() {
        this.lastData.minutesC = this.lastData.minutesC + this.randomInteger(0, 20);
        return this.lastData;
    };

    randomInteger(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    connectToMQTT() {
        let options = {
            keepalive: 10,
            clientId: this.DEVICE_ALTERNATE_ID,
            clean: true,
            reconnectPeriod: 2000,
            connectTimeout: 2000,
            cert: fs.readFileSync(this.CERTIFICATE_FILE),
            key: fs.readFileSync(this.CERTIFICATE_FILE),
            passphrase: fs.readFileSync(this.PASSPHRASE_FILE).toString(),
            rejectUnauthorized: false
        }

        let mqttClient = mqtt.connect(`mqtts://${this.HOST_ADDRESS}:8883`, options);

        mqttClient.subscribe('ack/' + this.DEVICE_ALTERNATE_ID);
        mqttClient.on('connect', () => console.log("Connection established!"));
        mqttClient.on("error", err => console.log("Unexpected error occurred:", err));
        mqttClient.on('reconnect', () => console.log("Reconnected!"));
        mqttClient.on('close', () => console.log("Disconnected!"));
        mqttClient.on('message', (topic, msg) => console.log("Received acknowledgement for message:", msg.toString()));

        return mqttClient
    };

    sendDataViaMQTT() {
        var payload = {
            sensorAlternateId: this.SENSOR_ALTERNATE_ID,
            capabilityAlternateId: this.CAPABILITY_ALTERNATE_ID,
            measures: [
                this.lastData.OoR, this.lastData.minutesOoR, this.lastData.FB, this.lastData.minutesFB, this.lastData.C, this.lastData.minutesC, this.lastData.P, this.lastData.minutesP
            ]
        }

        var topicName = 'measures/' + this.DEVICE_ALTERNATE_ID;

        this.mqttClient.publish(topicName, JSON.stringify(payload), [], error => {
            if (!error) {
                console.log("Data successfully sent!");
            } else {
                console.log("An unecpected error occurred:", error);
            }
        });
    };
} 