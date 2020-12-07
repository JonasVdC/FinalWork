const environment = require('./environment');
const Fitbit = require('./fitbit');
const ClientOAuth2 = require('client-oauth2');
const express = require('express');


this.oFitbit = null;
let app = express();

const port = process.env.PORT || 3000;


app.listen(port, async () => {
    console.log('Fitbit Authorizer  is listening on port: ' + port);

    // Get the environment variables
    const oEnvironmentVariables = await environment.getVariables();
    this.oFitbit = new Fitbit(oEnvironmentVariables);

    console.log(this.oFitbit);
});




app.get("/", function (req, res) {
    res.send("Welcome to the Fitbit authorization Node.js app of my Final work!");
});


app.get("/login", function (req, res) {
    this.oFitbit.login(req, res)
}.bind(this));

app.get("/auth/fitbit/callback", function (req, res) {
    return this.oFitbit.loginCallback(req, res);
}.bind(this));

app.get('/getProfile', function (req, res) {
    return this.oFitbit.getProfile(req, res);
}.bind(this));

app.get("/getHeartrate", function (req, res) {
    return this.oFitbit.getHeartrate(req, res)
}.bind(this));



