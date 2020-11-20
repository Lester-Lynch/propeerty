/*
    16 Nov 2020
    - Trying dialogs to set search properties
    30 June 2020
    - Using eert-dev.ddns.net instead of 192.168.0.13 for Sync URL
    23 June 2020
    - Add search property options, set hint based upon option.
    - Still trying to hide keyboard
    - Still trying to get search to start providing "like" response
    19 June 2020
    - Search working using Query on PROP_ID.
    - Get the keyboard to hide!
    - Try to get it to start pulling up results as typing?
    - Try to get all property search?
    10 June 2020
    - Switched Couchbase plugin
*/

import { Observable, ObservableArray, PropertyChangeData, EventData, Dialogs, isAndroid, isIOS } from "@nativescript/core";
import { ObservableProperty } from "../observable-property-decorator";
import * as utils from "@nativescript/core/utils/utils";
import { Couchbase } from "nativescript-couchbase-plugin";

export function dismissSoftInput(args: EventData) {
    utils.ad.dismissSoftInput();
}

export class HraViewModel extends Observable {

    public searchPhrase: string;
    public hraDatabase: Couchbase;

    public items: ObservableArray<any>;
    public allItems: ObservableArray<any>;
    public testItems: ObservableArray<any>;

    @ObservableProperty() searchHint = "Enter a Barcode";
    @ObservableProperty() searchDisplay = "Barcode";
    @ObservableProperty() searchProperty = "PROP_ID";

    constructor() {
        super();

        this.items = new ObservableArray<any>([]);
        this.allItems = new ObservableArray<any>([]);

        // HRA database local store 
        this.hraDatabase = new Couchbase("hra-database");
        // var pullHra = this.hraDatabase.createPullReplication("ws://eert-dev.ddns.net:4984/hra949");
        var pullHra = this.hraDatabase.createPullReplication("ws://192.168.0.13:4984/hra949");
        // pullHra.setContinuos(true);
        pullHra.start();

        this.on(Observable.propertyChangeEvent, (propertyChangeData: PropertyChangeData) => {
            if (propertyChangeData.propertyName == "searchPhrase") {
                this.onSearchSubmit();
                console.log("Search changed! " + propertyChangeData.value);
            }
        });

        // Load and Display the HRA Database upon navigating to the HRA tab.
        this.pullHraDatabase();
        this.dismissKeyboard();
    }

    public pullHraDatabase() {
        console.log("HRA: Pull");

        // clear the array
        this.items.length = 0;

        var rows = this.hraDatabase.query({
            select: []
        });

        console.log("HRA: Rows:" + rows.length);

        for (var r = 0; r < rows.length; r++) {
            this.items.push(rows[r]);
            // console.log(this.items.length);
        }
        
        console.log("HRA: pullHraDatabase done");        
    }

    // Select search properties dialog
    onSearchProperty() {
        console.log("onSearchProperty: Dialogs");
        Dialogs.action({
            message: "Search on",
            cancelButtonText: "Cancel text",
            actions: ["Barcode", "Serial Number"]
        }).then(result => {
            console.log("Dialog result: " + result);
            if(result == "Barcode"){
                this.searchHint = "Enter Barcode";
                this.searchDisplay = "Barcode";
                this.searchProperty = "PROP_ID";
            }else if(result == "Serial Number"){
                this.searchHint = "Enter Serial Number";
                this.searchDisplay = "Serial Number";
                this.searchProperty = "PROP_SERIAL_NO";
            }
        });
    }

    onSearchSubmit() {
        // searchIndex = searchProperties.getIndex("Barcode");
        // this.searchProperty = this.searchProperties.getValue(this.searchIndex);
        const query = this.hraDatabase.query({
            select: [],
            where: [{
                property: this.searchProperty,
                comparison: 'in',
                value: this.searchPhrase
            }]
        });
        this.set('items', new ObservableArray([...query]));
    }

    onClear() {
        this.pullHraDatabase();
        // this.searchBar.dismissSoftInput();
        console.log("Seachbar cleared")
    }

    dismissKeyboard() {
        if (isAndroid) {
            utils.ad.dismissSoftInput();
        }
        if (isIOS) {
            // UIApplication.sharedApplication.keyWindow.endEditing(true);
        }
    }
    



}