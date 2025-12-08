/*global QUnit*/

sap.ui.define([
	"com/sysco/wm/marshallexecutionui/marshallexecutionui/controller/scanlabel.controller"
], function (Controller) {
	"use strict";

	QUnit.module("scanlabel Controller");

	QUnit.test("I should test the scanlabel controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
