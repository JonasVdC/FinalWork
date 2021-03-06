// Require the required modules
const axios = require('axios');
const querystring = require('querystring');
const xsenv = require("@sap/xsenv");

// Load the environment variables
xsenv.loadEnv();

// Access the xsuaa and destination service and build the uaa credentials
const dest_service = xsenv.getServices({ dest: { tag: 'destination' } }).dest;
const uaa_service = xsenv.getServices({ uaa: { tag: 'xsuaa' } }).uaa;


const sUaaCredentials = dest_service.clientid + ':' + dest_service.clientsecret;


// Define the (async) functions to export
module.exports = {
    // Single function to retrieve all variables
    getVariables: async function () {
        const uaaAccessToken = await getUaaAccessToken();
        const aDestinations = await (await getDestinations(uaaAccessToken, ["final_work-authorizer", "FitbitAPI", "FitbitOauth", "final_work-IOT"])).map(oDestination => oDestination.data);
        const oEnvironmentVariables = getFitbitKeys();
        oEnvironmentVariables.mqtt = getMQTTValues();
        oEnvironmentVariables.destinations = aDestinations;
        return oEnvironmentVariables;
    },

};

// Get the UAA access token
async function getUaaAccessToken() {
    try {

        const response = await axios({
            method: "POST",
            url: uaa_service.url + '/oauth/token',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(sUaaCredentials).toString('base64'),
                'Content-type': 'application/x-www-form-urlencoded'
            },
            data: querystring.stringify({
                'client_id': dest_service.clientid,
                'grant_type': 'client_credentials'
            })
        })
        return response.data["access_token"];
    }
    catch (oError) {
        console.log(oError)
    }
}

// Get all destinations defined in the aDestinationNames
async function getDestinations(sAccessToken, aDestinationNames) {
    try {
        const aDestinationPromises = aDestinationNames.map(sDestinationName => new Promise((resolve, reject) => axios({
            method: "GET",
            url: dest_service.uri + '/destination-configuration/v1/destinations/' + sDestinationName,
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + sAccessToken
            }
        }).then(result => resolve(result)).catch(oError => reject(oError))));
        return Promise.all(aDestinationPromises);
    }
    catch (oError) {
        console.log(oError)
    }
}

function getFitbitKeys() {
    const services = xsenv.getServices({ "user-provided": { instance_name: "Fitbit-API-Keys" } });
    const fitbitApiClientId = services["user-provided"]["clientId"];
    const fitbitApiClientSecret = services["user-provided"]["clientsecret"];
    const fitbitApiAppName = services["user-provided"]["appName"];
    const fitbitApiScope = services["user-provided"]["scope"];
    const fitbitApiExpiration = services["user-provided"]["expiration"];
    return {
        fitbitApiClientId,
        fitbitApiClientSecret,
        fitbitApiAppName,
        fitbitApiScope,
        fitbitApiExpiration
    }
}

function getMQTTValues() {
    const MqttService = xsenv.getServices({ "user-provided": { instance_name: "MQTT-values" } });
    const Device = MqttService["user-provided"]["device"];
    const Sensor = MqttService["user-provided"]["sensor"];
    const Capability = MqttService["user-provided"]["capability"];
    return {
        Device,
        Sensor,
        Capability
    }
}