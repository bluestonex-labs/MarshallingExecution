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
        },
        navBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Routescanlabel");
        },
        onScanSuccess: function (oEvent) {
            var oBundle = this.getView().getModel("i18n").getResourceBundle();
            var sText = oBundle.getText("scanCancelled");

            if (oEvent.getParameter("cancelled")) {
                sap.m.MessageToast.show(sText, { duration: 1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    var oInpCageFld = this.getView().byId("inCageID");
                    oInpCageFld.setValue(oEvent.getParameter("text"));
                    oInpCageFld.fireSubmit();
                }
            }
        },

        onScanFail: function (oEvent) {
            sap.m.MessageBox.show("Scan failed: " + oEvent.getParameter("message"));
        },

        onCageIDInput: function (oEvent) {
            var aData = [];
            var selectedData = this.getView().byId("inCageID").getValue();
            if (selectedData == "") {
                return;
            }
            var oSuggestedMoveData = this.getOwnerComponent().getModel("SuggestedMoveData").getData();
            var oData = oSuggestedMoveData.data.value;
            var fil = oData.filter((item) => {
                return item.To_Marshalling.ID == selectedData;
            })

            fil.forEach(cage => {
                aData.push(
                    cage?.To_Marshalling?.ID
                );
            });

            // Create a new model for the flattened data
            // var oFlatModel = new sap.ui.model.json.JSONModel({ results: aData });
            //this.getView().setModel(oFlatModel, "flattened");
            this._allData = aData;

            var oScanPalletForConfirmMove = new sap.ui.model.json.JSONModel({ fil });
            this.getView().setModel(oScanPalletForConfirmMove, "oScanPalletForConfirmMove");

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
                sap.m.MessageBox.information(
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

        },



    });
});