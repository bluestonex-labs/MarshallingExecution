sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
], (Controller, BusyIndicator, MessageToast) => {
    "use strict";

    return Controller.extend("com.sysco.wm.marshallexecutionui.marshallexecutionui.controller.suggestedmoves", {


        //ctm test
        onInit: function () {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("suggestedmoves").attachPatternMatched(this._onRouteMatched, this);
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            
        },

        _onRouteMatched: function () {

            this.getPlantData();

            this._pageSize = 5;
            this._currentPage = 0;
            this._currentIndex = 0;

            

        },

        getPlantData: function () {
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
            var currentDateUTC = new Date().toISOString().split('T')[0];
            var dateAfterAWeek = new Date();
            dateAfterAWeek.setDate(dateAfterAWeek.getDate() + 7);
            var toDate = dateAfterAWeek.toISOString().split('T')[0];
            var lang = oLocale.language;
            var that = this;
            var sDest = "/marshallingservices";
            var path = "/Marshalling/PickTaskHeaders?$filter=Plant eq '" + plant + "' and DeliveryDate ge '" + currentDateUTC + "' and DeliveryDate le '" + toDate + "' and To_Marshalling/ID ne null and To_Marshalling/Status_ID ne 'PALLETISED' and To_Marshalling/Status_ID ne 'LOADED' and Status_ID eq 'COMPLETED'&$select=ID,Route,PickJob&$expand=To_Marshalling($expand=MarshallingBinID($select=ID,Description),SuggestedBinID($select=ID,Description)),Status,Media";
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
                    that.suggestedMovesList();
                },
                error: function (textStatus, errorThrown) {
                    console.log("Error:", textStatus, errorThrown);
                }
            });
        },

        suggestedMovesList: function () {

            var oSuggestedMoveData = this.getOwnerComponent().getModel("SuggestedMoveData").getData();
            var aFlattenedData = [];
            var createPalletData = [];
            var oData = oSuggestedMoveData.data.value;

            oData.forEach(cage => {
                aFlattenedData.push({
                    CageID: cage?.To_Marshalling?.CageID || "",
                    PalletID:cage?.To_Marshalling?.PalletID || "",
                    Media: cage?.Media?.Description || "",
                    Status: cage?.Status?.Description || "",
                    Source: cage?.To_Marshalling?.MarshallingBinID?.Description || ""
                });
            });

            // Create a new model for the flattened data
            var oFlatModel = new sap.ui.model.json.JSONModel({ results: aFlattenedData });
            this.getView().setModel(oFlatModel, "flattened");
            this._allData = aFlattenedData;
            this._updatePagedData();
        },

        _updatePagedData: function () {
            var start = this._currentPage * this._pageSize;
            var end = start + this._pageSize;
            var visibleData = this._allData.slice(start, end);
            var oFlatModel = new sap.ui.model.json.JSONModel({ visibleResults: visibleData });
            this.getView().setModel(oFlatModel, "flattened");
            // Manage button visibility
            this.getView().byId("btnUp").setVisible(this._currentPage > 0);
            this.getView().byId("btnDown").setVisible(end < this._allData.length);
        },

        onShowMore: function () {
            var totalPages = Math.ceil(this._allData.length / this._pageSize);
            if (this._currentPage < totalPages - 1) {
                this._currentPage++;
                this._updatePagedData();
            }
        },

        onShowLess: function () {
            if (this._currentPage > 0) {
                this._currentPage--;
                this._updatePagedData();
            }
        },

        onItemPress: function (oEvent) {

            var oSuggestedMoveData = this.getOwnerComponent().getModel("SuggestedMoveData").getData();
            var oData = oSuggestedMoveData.data.value;
            var oItem = oEvent.getSource();
            var selectedData = this.getView().getModel("flattened").getData().visibleResults[oEvent.getSource()._aSelectedPaths[0].split('/')[oEvent.getSource()._aSelectedPaths[0].split('/').length - 1]];
            var fil = oData.filter((item) => {
                return item.To_Marshalling.CageID == selectedData.CageID||
                item.To_Marshalling.PalletID === selectedData.PalletID;
            })
            var oScanPalletForSuggMove = new sap.ui.model.json.JSONModel({ fil });
            this.getOwnerComponent().setModel(oScanPalletForSuggMove, "scanPalletForSuggMove");
            sap.ui.core.UIComponent.getRouterFor(this).navTo("scanpalletforsuggmove");
        },

        onsortIds: function (oEvent) {
            // Get the button
            var oButton = oEvent.getSource();

            // Get current icon
            var sIcon = oButton.getIcon();

            // Determine the new sort order and icon
            var bAscending = sIcon.includes("ascending");
            var sNewIcon = bAscending ? "sap-icon://sort-descending" : "sap-icon://sort-ascending";

            // Update the icon on the button
            oButton.setIcon(sNewIcon);

            // Get the talistble
            var oList1 = this.byId("suggestMovesList");
            var oList2 = this.byId("suggestMovesLists");

            // Assuming you're sorting by a specific column, e.g., "Name"
            var oSorter = new sap.ui.model.Sorter("id", !bAscending);  // !bAscending toggles

            // Apply the sorter to the table's binding
            oList1.getBinding("items").sort(oSorter);
            oList2.getBinding("items").sort(oSorter);
        },
        navBack: function () {
            sap.ui.core.UIComponent.getRouterFor(this).navTo("Routescanlabel");
        },

        onListItemPress: function (oEvent) {
            var oRouter = this.getOwnerComponent().getRouter();

            // Get the selected item's context
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext();
            var oData = oContext.getObject();

            var scanPalMove = new sap.ui.model.json.JSONModel(oData);
            this.getOwnerComponent().setModel(scanPalMove, "scanPalMove");

            // Example: navigating to 'detail' route with parameter 'id'
            oRouter.navTo("scanpalletforsuggmove", {
                id: oData.id
            });
        }



    });
});