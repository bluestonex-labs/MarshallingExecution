sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ndc/BarcodeScanner",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
], (Controller, BarcodeScanner, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.marshallexecutionui.marshallexecutionui.controller.scanninglabel", {

        onInit() {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oRouter = this.getOwnerComponent().getRouter();
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getRouter().getRoute("scanninglabel").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function () {
            this.getView().byId("inCageID").setValue();
        },

        navBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Routescanlabel");
        },

        onScanSuccess: function (oEvent) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sText = oBundle.getText("scanCancelled");

            if (oEvent.getParameter("cancelled")) {
                MessageToast.show(sText, { duration: 1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    var oInpCageFld = this.getView().byId("inCageID");
                    oInpCageFld.setValue(oEvent.getParameter("text"));
                    oInpCageFld.fireSubmit();
                }
            }
        },

        onScanFail: function (oEvent) {
            MessageBox.show("Scan failed: " + oEvent.getParameter("message"));
        },

        onLabelInput: function (oEvent) {

            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var pickID = (oEvent.getParameter("value").trim()).split("|")[0];
            var lang = oLocale.language;
            var that = this;
            var sDest = "/marshallingservices";
            var path = "/Marshalling/PickTaskHeaders?$filter=ID eq '" + pickID + "' and To_Marshalling/ID ne null and To_Marshalling/Status_ID ne 'PALLETISED'&$select=ID,Route,PickJob&$expand=To_Marshalling($expand=MarshallingBinID($select=ID,Description),SuggestedBinID($select=ID,Description)),Status,Media";
            var sUrl = this.appModulePath + sDest + path;

            $.ajax({
                url: sUrl,
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function (data) {
                    if (data.value.length > 0) {
                        var oScannedLabelModel = new sap.ui.model.json.JSONModel(data.value);
                        that.getOwnerComponent().setModel(oScannedLabelModel, "oScannedLabelModel");
                        sap.ui.core.UIComponent.getRouterFor(that).navTo("scanpallet", { pickTaskID: pickID });
                    } else {
                        MessageToast.show(that.oBundle.getText("labelNotFound"));
                    }
                    
                },
                error: function (textStatus, errorThrown) {
                    console.log("Error:", textStatus, errorThrown);
                }
            });


        },

        _closeWrapDialogAccept: function (oEvent) {
            var that = this;
            if (this._oWrapDialogs) {
                this._oWrapDialogs.close();

                var result = that.callConfirmMoves();
                MessageBox.information(
                    that.oBundle.getText("lbl"),
                    {
                        actions: [sap.m.MessageBox.Action.OK],
                        onClose: function (sAction) {
                            if (sAction === sap.m.MessageBox.Action.OK) {
                                sap.ui.core.UIComponent.getRouterFor(this).navTo("scanninglabel");
                            }
                        }.bind(that)
                    }
                );

            }

        },

        callConfirmMoves: function () {
            return new Promise((resolve, reject) => {
                var that = this;
                var oLocale = sap.ui.getCore().getConfiguration().getLocale();
                var lang = oLocale.language;
                var sUrl = this.appModulePath + "/marshallingservices/Marshalling/confirmMove";
                var oPayload = {
                    "IDs": [
                        that._allData[0]
                    ]
                }
                $.ajax({
                    url: sUrl,
                    beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(oPayload),  // send JSON as string
                    headers: {
                        "Accept": "application/json"
                    },
                    success: function (data) {
                        resolve(data.value);

                    },
                    error: function (error) {
                        reject(error);
                    }

                });
            });
        },

        _closeWrapDialogDecline: function (oEvent) {
            if (this._oWrapDialogs) {
                this._oWrapDialogs.close();
            }

        }
    });
});