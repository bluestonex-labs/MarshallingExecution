sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], (Controller, MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.marshallexecutionui.marshallexecutionui.controller.scanpallet", {

        onInit() {
            this.getOwnerComponent().getRouter().getRoute("scanpallet").attachPatternMatched(this._onRouteMatched, this);
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        _onRouteMatched: function (oEvent) {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oRouter = this.getOwnerComponent().getRouter();
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.getView().byId("scanPalMovePalID1").setEnabled(true);
            this.getView().byId("scanPalMoveID1").setEnabled(true);
            this.getView().byId("scanPalMoveID1").setValue();
            this.getView().byId("scanPalMoveID1").setValueState("None");
            this.getView().byId("scanPalMovePalID1").setValue();
            this.getView().byId("scanPalMovePalID1").setValueState("None");
            this.getView().byId("scanPalMoveRoute1").setValue();
            this.getView().byId("scanPalMoveConsoRoute1").setValue();
            this.getView().byId("scanPalMoveSrc1").setValue();
            this.getView().byId("scanPalMoveDest1").setValue();

            var pickID = oEvent.getParameter("arguments").pickTaskID;
            if (pickID) {
                this.setPickTaskData();
            }
        },

        setPickTaskData: function () {
            var val = this.getOwnerComponent().getModel("oScannedLabelModel").getData();
            this.val = val[0]?.To_Marshalling?.ID || "";
            console.log(val);
            this.getView().byId("scanPalMoveID1").setValue(val[0].To_Marshalling.CageID || "");
            this.getView().byId("scanPalMovePalID1").setValue(val[0].To_Marshalling.PalletID || "");
            this.getView().byId("scanPalMoveRoute1").setValue(val[0]?.Route || "");
            this.getView().byId("scanPalMoveConsoRoute1").setValue(val[0]?.To_Marshalling?.Route || "");
            this.getView().byId("scanPalMoveSrc1").setValue(val[0]?.To_Marshalling?.MarshallingBinID?.Description || "");
            this.getView().byId("scanPalMoveDest1").setValue(val[0]?.To_Marshalling?.SuggestedBinID?.Description || "");
        },

        onConfirmMove: function (oEvent) {
            var oView = this.getView();

            // Check if fragment is already loaded
            if (!this._oWrapDialogs) {
                // Load the fragment asynchronously
                this._oWrapDialogs = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.sysco.wm.marshallexecutionui.marshallexecutionui.fragment.wrapDialog",
                    this
                );
                oView.addDependent(this._oWrapDialogs);
            }

            // Open the dialog
            this._oWrapDialogs.open();
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
                                sap.ui.core.UIComponent.getRouterFor(this).navTo("Routescanlabel");
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
                        that.val

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

        },

        bindCageData: function () {
            var oScannedCageData = this.getOwnerComponent().getModel("oScannedCageModel").getData();
            this.oData = oScannedCageData.value;
            this.getView().byId("scanPalMovePalID1").setValue();
            this.getView().byId("scanPalMoveID1").setValueState("None");
            if (this.oData.length === 0) {
                MessageBox.error(this.oBundle.getText("enter_correct_cage"));

                this.getView().byId("scanPalMoveID1").setValueState("Error");
                this.getView().byId("scanPalMoveRoute1").setValue();
                this.getView().byId("scanPalMoveConsoRoute1").setValue();
                this.getView().byId("scanPalMoveSrc1").setValue();
                this.getView().byId("scanPalMoveDest1").setValue();
                return;
            }
            this.val = this.oData[0]?.To_Marshalling?.ID || "";
            var scanPalMove1 = new sap.ui.model.json.JSONModel(this.oData);
            this.getView().setModel(scanPalMove1, "scanPalMove1");
            this.getView().byId("scanPalMoveRoute1").setValue(this.oData[0]?.Route || "");
            this.getView().byId("scanPalMoveConsoRoute1").setValue(this.oData[0]?.To_Marshalling?.Route || "");
            this.getView().byId("scanPalMoveSrc1").setValue(this.oData[0]?.To_Marshalling?.MarshallingBinID?.Description || "");
            this.getView().byId("scanPalMoveDest1").setValue(this.oData[0]?.To_Marshalling?.SuggestedBinID?.Description || "");

        },

        onCageIDInput: function (oEvent) {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var cageID = oEvent.getParameter("value").trim();
            var lang = oLocale.language;
            var that = this;
            var sDest = "/marshallingservices";
            var path = "/Marshalling/PickTaskHeaders?$filter=CageID eq '" + cageID + "' and To_Marshalling/ID ne null and To_Marshalling/Status_ID ne 'PALLETISED'&$select=ID,Route,PickJob&$expand=To_Marshalling($expand=MarshallingBinID($select=ID,Description),SuggestedBinID($select=ID,Description)),Status,Media";
            var sUrl = this.appModulePath + sDest + path;

            $.ajax({
                url: sUrl,
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function (data) {
                    var oScannedCageModel = new sap.ui.model.json.JSONModel(data);
                    that.getOwnerComponent().setModel(oScannedCageModel, "oScannedCageModel");
                    that.bindCageData();
                },
                error: function (textStatus, errorThrown) {
                    console.log("Error:", textStatus, errorThrown);
                }
            });
        },

        bindPalletData: function (oEvent) {
            var oScannedPalletData = this.getOwnerComponent().getModel("oScannedPalletModel").getData();
            this.oData = oScannedPalletData.value;
            this.getView().byId("scanPalMoveID1").setValue();
            this.getView().byId("scanPalMovePalID1").setValueState("None");
            if (this.oData.length === 0) {
                MessageBox.error(this.oBundle.getText("enter_correct_cage"));

                this.getView().byId("scanPalMovePalID1").setValueState("Error");
                this.getView().byId("scanPalMoveRoute1").setValue();
                this.getView().byId("scanPalMoveConsoRoute1").setValue();
                this.getView().byId("scanPalMoveSrc1").setValue();
                this.getView().byId("scanPalMoveDest1").setValue();
                return;
            }
            this.val = this.oData[0]?.To_Marshalling?.ID || "";
            var scanPalMove1 = new sap.ui.model.json.JSONModel(this.oData);
            this.getView().setModel(scanPalMove1, "scanPalMove1");
            this.getView().byId("scanPalMoveRoute1").setValue(this.oData[0]?.Route || "");
            this.getView().byId("scanPalMoveConsoRoute1").setValue(this.oData[0]?.To_Marshalling?.Route || "");
            this.getView().byId("scanPalMoveSrc1").setValue(this.oData[0]?.To_Marshalling?.MarshallingBinID?.Description || "");
            this.getView().byId("scanPalMoveDest1").setValue(this.oData[0]?.To_Marshalling?.SuggestedBinID?.Description || "");

        },

        onPalletIDInput: function (oEvent) {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var palletID = oEvent.getParameter("value").trim();
            var lang = oLocale.language;
            var that = this;
            var sDest = "/marshallingservices";
            var path = "/Marshalling/PickTaskHeaders?$filter=PalletID eq '" + palletID + "' and To_Marshalling/ID ne null and To_Marshalling/Status_ID ne 'PALLETISED'&$select=ID,Route,PickJob&$expand=To_Marshalling($expand=MarshallingBinID($select=ID,Description),SuggestedBinID($select=ID,Description)),Status,Media";
            var sUrl = this.appModulePath + sDest + path;

            $.ajax({
                url: sUrl,
                beforeSend: function (xhr) { xhr.setRequestHeader('Accept-Language', lang); },
                method: "GET",
                headers: {
                    "Accept": "application/json"
                },
                success: function (data) {
                    var oScannedPalletModel = new sap.ui.model.json.JSONModel(data);
                    that.getOwnerComponent().setModel(oScannedPalletModel, "oScannedPalletModel");
                    that.bindPalletData();
                },
                error: function (textStatus, errorThrown) {
                    console.log("Error:", textStatus, errorThrown);
                }
            });
        }

    });
});