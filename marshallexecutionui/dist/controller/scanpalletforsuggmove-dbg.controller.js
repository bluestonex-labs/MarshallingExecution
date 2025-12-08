sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox"
], (Controller,MessageBox) => {
    "use strict";

    return Controller.extend("com.sysco.wm.marshallexecutionui.marshallexecutionui.controller.scanpalletforsuggmove", {
        onInit() {
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oRouter = this.getOwnerComponent().getRouter();
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            this.getOwnerComponent().getRouter().getRoute("scanpalletforsuggmove").attachPatternMatched(this._onPalletIdMatched, this);
        },
        navBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("suggestedmoves");
        },
        _onPalletIdMatched: function () {

            var SuggSelectedMoveData = this.getOwnerComponent().getModel("scanPalletForSuggMove").getData().fil[0];
            var scanPalMove = new sap.ui.model.json.JSONModel(SuggSelectedMoveData);
            this.getView().setModel(scanPalMove, "scanPalMove");
            // this.getView().byId("scanPalMoveID").setValue(SuggSelectedMoveData.To_Marshalling.CageID);
            // this.getView().byId("scanPalMoveID").setEnabled(false);
            // this.getView().byId("scanPalMoveSrc").setValue(SuggSelectedMoveData.To_Marshalling.MarshallingBinID.Description);
            // this.getView().byId("scanPalMoveSrc").setEnabled(false);
        },
        onConfirmMove: function (oEvent) {
            var oView = this.getView();

            // Check if fragment is already loaded
            if (!this._oWrapDialog) {
                // Load the fragment asynchronously
                this._oWrapDialog = sap.ui.xmlfragment(
                    oView.getId(),
                    "com.sysco.wm.marshallexecutionui.marshallexecutionui.fragment.wrapDialog",
                    this
                );
                oView.addDependent(this._oWrapDialog);
            }

            // Open the dialog
            this._oWrapDialog.open();
        },

        _closeWrapDialogAccept: async function (oEvent) {
            var that = this;
            if (this._oWrapDialog) {

                this._oWrapDialog.close();
                var result = that.callConfirmMoves();
                sap.m.MessageBox.information(
                that.oBundle.getText("lbl"),
                {
                    actions: [sap.m.MessageBox.Action.OK],
                    onClose: function (sAction) {
                        if (sAction === sap.m.MessageBox.Action.OK) {
                           sap.ui.core.UIComponent.getRouterFor(this).navTo("suggestedmoves");
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
                var oData = this.getView().getModel("scanPalMove").oData;
                var sUrl = this.appModulePath + "/marshallingservices/Marshalling/confirmMove";
                var oPayload = {
                    "IDs": [
                        oData.To_Marshalling.ID
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
            if (this._oWrapDialog) {
                this._oWrapDialog.close();
            }

        },


    });
});