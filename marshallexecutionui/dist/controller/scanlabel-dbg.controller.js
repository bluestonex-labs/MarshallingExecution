sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("com.sysco.wm.marshallexecutionui.marshallexecutionui.controller.scanlabel", {
        onInit() {
            // var resultA = await this._callCreatePalletService();
            var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            this.appModulePath = jQuery.sap.getModulePath(appPath);
            var oLocale = sap.ui.getCore().getConfiguration().getLocale();
            var lang = oLocale.language;
            var that = this;
            var sDest = "/marshallingservices";
            var sUrl = this.appModulePath + sDest + "/Marshalling/PickTaskHeaders" +
                "?$filter=To_Marshalling/ID ne null" +
                "&$select=ID,Route,PickJob" +
                "&$expand=To_Marshalling($expand=MarshallingBinID($select=ID,Description),SuggestedBinID($select=ID,Description)),Status,Media";

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