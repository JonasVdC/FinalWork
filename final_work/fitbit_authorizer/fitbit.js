'use strict';
const ClientOAuth2 = require('client-oauth2')
const url = require('url');
const axios = require('axios');
const Mqtt = require('./Mqtt');


module.exports = class Fitbit {

    constructor(config) {
        this.oMqtt = new Mqtt(config);
        this.config = config;
        this.fitbitAuth = this.FillFitbitAuth(config);
        this.accesToken = "INVALID";
        this.userId = "";
    }
    FillFitbitAuth(config) {
        let accesURL = this.getAccessURL();
        let AuthUrl = this.getAuthorizeURL();
        let CallbackURL = this.getLoginCallbackURL();
        let fitbitAuth = new ClientOAuth2({
            clientId: config.fitbitApiClientId,
            clientSecret: config.fitbitApiClientSecret,
            accessTokenUri: accesURL,
            authorizationUri: AuthUrl,
            redirectUri: CallbackURL,
            scopes: config.fitbitApiScope
        });
        return fitbitAuth;
    }

    getAccessURL() {
        return `${this.config.destinations.find(oDest => oDest.destinationConfiguration.Name === "FitbitAPI").destinationConfiguration.URL}/oauth2/token`;
    }

    getAuthorizeURL() {
        return `${this.config.destinations.find(oDest => oDest.destinationConfiguration.Name === "FitbitOauth").destinationConfiguration.URL}/oauth2/authorize`;
    }

    getLoginCallbackURL() {
        return `${this.config.destinations.find(oDest => oDest.destinationConfiguration.Name === "final_work-authorizer").destinationConfiguration.URL}/auth/fitbit/callback`;
    }

    // Login and fetch tokens (authenticate and authorize)
    login(req, res) {
        let uri = this.fitbitAuth.code.getUri()
        console.log("rediring to " + uri);
        res.redirect(uri)
    }


    loginCallback(req, res) {
        console.log("Got into callback!");

        this.fitbitAuth.code.getToken(req.originalUrl)
            .then(function (user) {
                console.log("got Usertoken")
                // Refresh the current users access token.
                user.refresh().then(function (updatedUser) {
                    // console.log(updatedUser !== user) //=> true
                    //console.log(updatedUser.accessToken)
                })
                console.log("refreshed")
                // Sign API requests on behalf of the current user.
                user.sign({
                    method: 'get',
                    url: 'https://f4132480trial-dev-fitbit-authorizer.cfapps.eu10.hana.ondemand.com/login'
                })
                console.log("signed")

                // We should store the token into a database.

                this.userId = user.data.user_id;
                this.accesToken = user.accessToken;

                axios.defaults.headers.common['AUTHORIZATION'] = 'Bearer ' + this.accesToken;

                return res.send(user.accessToken);
            }.bind(this)
            ).catch(oError => console.log("Failed to sign app: " + oError));
    }

    // Get the userInfo
    getProfile(req, res) {
        return axios.get('https://api.fitbit.com/1/user/' + this.userId + '/profile.json')
            .then(response => {
                return res.send(response.data.user);
            })
            .catch(error => {
                console.log(error);
            });
    }

    // Get all the boards
    getHeartrate(req, res) {
        setInterval(() => {
            return axios.get('https://api.fitbit.com/1/user/' + this.userId + '/activities/heart/date/today/1d/1min.json')


                .then(response => {
                    let HRData = {
                        HeartRateZone1: response.data["activities-heart"][0].value["heartRateZones"][0].name,
                        MinutesZone1: response.data["activities-heart"][0].value["heartRateZones"][0].minutes,
                        HeartRateZone2: response.data["activities-heart"][0].value["heartRateZones"][1].name,
                        MinutesZone2: response.data["activities-heart"][0].value["heartRateZones"][1].minutes,
                        HeartRateZone3: response.data["activities-heart"][0].value["heartRateZones"][2].name,
                        MinutesZone3: response.data["activities-heart"][0].value["heartRateZones"][2].minutes,
                        HeartRateZone4: response.data["activities-heart"][0].value["heartRateZones"][3].name,
                        MinutesZone4: response.data["activities-heart"][0].value["heartRateZones"][3].minutes,


                    }
                    this.oMqtt.sendDataViaMQTT(HRData);
                    return res.send(HRData);
                })
                .catch(error => {
                    console.log(error);
                });
        }, 30000);
    }



}