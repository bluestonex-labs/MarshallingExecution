sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox"
], (Controller, JSONModel, MessageToast, BusyIndicator, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.marshallexecutionui.marshallexecutionui.controller.scanlabel", {

        onInit() {
            BusyIndicator.show(500);
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var that = this;
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;

            $.ajax({
                url: this.appModulePath + "/marshallingservices/CloudWM/getPlantListForUser()",
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                async: true,
                success: function (oData, response) {
                    BusyIndicator.hide();
                    const assignedPlants = oData.value;
                    assignedPlants.forEach(function (assignedPlant, index) {
                        if (assignedPlant.DefaultPlant)
                            that.plant = assignedPlant.Plant;
                    });

                    that.getMarshallingData(that.plant);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    BusyIndicator.hide();
                    MessageToast.show(jqXHR.responseText); //, "ERROR", "Service call error");
                }
            }, this);
        },

        getMarshallingData: function (plant) {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var currentDateUTC = new Date().toISOString().split('T')[0]
            var lang = oLocale.language;
            var that = this;
            var sDest = "/marshallingservices";
            var path = "/Marshalling/PickTaskHeaders?$filter=Plant eq '" + plant + "' and DeliveryDate eq '" + currentDateUTC + "' and To_Marshalling/ID ne null and To_Marshalling/Status_ID ne 'PALLETISED' and To_Marshalling/Status_ID ne 'LOADED'&$select=ID,Route,PickJob&$expand=To_Marshalling($expand=MarshallingBinID($select=ID,Description),SuggestedBinID($select=ID,Description)),Status,Media";
            var sUrl = this.appModulePath + sDest + path;
            
            $.ajax({
                url: sUrl,
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function (data) {
                    var oSuggestedMoveData = new sap.ui.model.json.JSONModel({ data });
                    that.getOwnerComponent().setModel(oSuggestedMoveData, "SuggestedMoveData");
                },
                error: function (textStatus, errorThrown) {
                    console.log("Error:", textStatus, errorThrown);
                }
            });
        },

        onSuggestedMoves: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("suggestedmoves");
        },

        onScanPallet: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("scanpallet");
        },

        onScanLabel: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("scanninglabel");
        },

        navBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Routescanlabel");
        }
    });
});