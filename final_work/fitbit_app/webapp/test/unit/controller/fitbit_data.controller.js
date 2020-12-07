/*global QUnit*/

sap.ui.define([
	"cap/jonas/fitbit_app/controller/fitbit_data.controller"
], function (Controller) {
	"use strict";

	QUnit.module("fitbit_data Controller");

	QUnit.test("I should test the fitbit_data controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
