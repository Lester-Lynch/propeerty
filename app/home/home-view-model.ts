/*
    17 Nov 2020
    - Use dialogs for location
    3 Sep 2020
    - Migrate to NS 7
    - Migrate to @nativescript/core
    25 Aug 2020
    - Set minsdk to 25, 
    - Added usesCleartextTraffic to manifes and 
    - Added network_security_config.xml to allow cleartext 
    31 July 2020
    - Testing using wss for couchbase
    - Webserver now running ssl
    30 July 2020
    - Test using IP and local lan to validate on S10
    - Test android:usesCleartextTraffic="true" in manifest
    29 July 2020
    - Added connection monitoring
    - Profile changes now working with button, selection, and done
    - Samsung S10 not working with SGW?  Web testing works through?
    - HTTP to SGW not returning?  Will try to webserver...
    27 July 2020
    - Adjusted for creating new profile
    - Add profileName to try and get that working with onProfile
    21 July 2020
    - Profile db is now push/pull
    - Still working on updating profile
    20 Jule 2020
    - Check if propeerty db is loaded by checking for query results and locations.
    - If now profile found, then add current UUID
    - Allow editing of profile.name
    9 July 2020
    - Using Async-Await to get timing right so all fields fill out on 1st run
    1 July 2020
    - Added connection check
    - Added db server check.
    30 June 2020
    - Switched from 192.168.0.13 to eert-dev.ddns.net for Sync URL
    - Connecting Android to MiFi for testing
    * UUID changed after factory reset of Android
    - Looking at using Async Promis Await
    - Using a constant in Sync_GW isn't working.
    20 June 2020
    - Use listener on propeerty db to make sure sync happens before trying to do anything
    16J une 2020
    - Adding propeerty database
    - Get profile, locations, and hra information from database
*/

import { Observable, Http, Connectivity, Device, Dialogs } from "@nativescript/core";
import { ObservableProperty } from "../observable-property-decorator";
import { Couchbase } from "nativescript-couchbase-plugin";

export class HomeViewModel extends Observable {
    public propeertyDatabase: Couchbase;
    public scannedDatabase: Couchbase;
    public hraDatabase: Couchbase;

    isNew = false;              // New Profile
    isBusy = true;              // Activity indicator

    @ObservableProperty() versionId = "PropEERTy 19Nov20 1615";

    @ObservableProperty() connectionType = "None";
    @ObservableProperty() sgwState = "unknown";
    @ObservableProperty() uuid = Device.uuid;
    @ObservableProperty() profileName = null;
    @ObservableProperty() scanType = ["Inventory", "Any"];
    @ObservableProperty() defaultLocation = "Event";
    @ObservableProperty() scannedLength = 0;
    @ObservableProperty() hraLength = 0;

    // define propeerty database document format
    @ObservableProperty() profile = { "type": "Profile", "UUID": this.uuid, "Name": null, "HRA": "949", "defaultLocation": "Alexandria" };
    @ObservableProperty() hra = { "type": "string", "hraNumber": "string", "hraHolder": "string" };
    @ObservableProperty() locations = { "type": "string", "Names": "Array<string>" };

    constructor() {
        super();

        this.propeertyDatabase = new Couchbase("propeerty-database");
        // var syncPropeerty = this.propeertyDatabase.createReplication("ws://eert-dev.ddns.net:4984/propeerty", "both");
        var syncPropeerty = this.propeertyDatabase.createReplication("wss://192.168.0.13:4984/propeerty", "both");
        // pullPropeerty.setUserNameAndPassword("sync_gateway", "password")
        syncPropeerty.setContinuous(true);
        syncPropeerty.start();

        // Listen for changes.  Right now to make sure theres data to display and use
        this.propeertyDatabase.addDatabaseChangeListener(function(changes) {
            for (var i = 0; i < changes.length; i++) {
              const documentId = changes[i];
              console.log("Home: propeerty db update for: " + documentId);
            }
        });
        
        // Scan results database with sync
        this.scannedDatabase = new Couchbase("scanned-database");
        // var syncScanned = this.scannedDatabase.createReplication("ws://eert-dev.ddns.net:4984/scanned", "both");
        var syncScanned = this.scannedDatabase.createReplication("wss://192.168.0.13:4984/scanned", "both");
        syncScanned.setContinuous(true);
        syncScanned.start();

        this.scannedDatabase.addDatabaseChangeListener(function(changes) {
            for (var i = 0; i < changes.length; i++) {
              const documentId = changes[i];
              console.log("Home: scanned db listener update: " + documentId);
            }
        });
        
        // HRA database with a pull to ensure db exists and is loaded
        this.hraDatabase = new Couchbase("hra-database");
        // var pullHra = this.hraDatabase.createPullReplication("ws://eert-dev.ddns.net:4984/hra949");
        var pullHra = this.hraDatabase.createPullReplication("ws://192.168.0.13:4984/hra949");
        pullHra.start();

        this.init();

        this.isBusy = false;
    };

    async init() {
        await this.getConnectionState();
        if (this.connectionType != "None") {
            console.log("Home: Connected... check sgwState...");
            await this.getSgwState();
        }

        // await this.getPropEERTy();
        // await this.getScanned();
        // await this.getHra();

        this.isBusy = false;
    }

    async getConnectionState() {
        // Take from Nativescript Core Connectivity.
        const type = Connectivity.getConnectionType();
    
        switch (type) {
            case Connectivity.connectionType.none:
                console.log("No connection");
                this.connectionType = "None";
                break;
            case Connectivity.connectionType.wifi:
                console.log("WiFi connection");
                this.connectionType = "Wi-Fi";
                break;
            case Connectivity.connectionType.mobile:
                console.log("Mobile connection");
                this.connectionType = "Mobile";
                break;
            case Connectivity.connectionType.ethernet:
                console.log("Ethernet connection");
                this.connectionType = "Ethernet";
                break;
            case Connectivity.connectionType.bluetooth:
                console.log("Bluetooth connection");
                this.connectionType = "Bluetooth";
                break;
            default:
                break;
        }

        Connectivity.startMonitoring((newConnectionType) => {
            switch (newConnectionType) {
                case Connectivity.connectionType.none:
                    console.log("Connection type changed to none.");
                    this.connectionType = "None";
                    break;
                case Connectivity.connectionType.wifi:
                    console.log("Connection type changed to WiFi.");
                    this.connectionType = "Wi-Fi";
                    break;
                case Connectivity.connectionType.mobile:
                    console.log("Connection type changed to mobile.");
                    this.connectionType = "Mobile";
                    break;
                case Connectivity.connectionType.ethernet:
                    console.log("Connection type changed to ethernet.");
                    this.connectionType = "Ethernet";
                    break;
                case Connectivity.connectionType.bluetooth:
                    console.log("Connection type changed to bluetooth.");
                    this.connectionType = "Bluetooth";
                    break;
                default:
                    break;
            }
        });
    };

    async getSgwState() {
        console.log("Home: Gateway State ------------");
        console.log("Home: sgwState: " + this.sgwState);
        // "http://eert-dev.ddns.net:4984" or "http://192.168.0.13:4984"
        await Http.request({
            url: "http://192.168.0.13:4984",
            method: "GET"
        }).then((response) => {
            
            console.log("Home: HTTP Response: " + response.statusCode);
            if (response.statusCode == 200) { 
                this.sgwState = "Ready";
                console.log("Home: sgwState: " + this.sgwState);
            };

            return this.sgwState;
        }, (e) => {
            console.log("===> " + e);
        });
    };

    async getPropEERTy() {
        console.log("Get Propeerty -------------");
        // console.log("Home: sgwState: " + this.sgwState);
        var x = 0;
        do {
            console.log("Query ---------------");
            var propeertyDocuments = this.propeertyDatabase.query({
                select: []
            });
            console.log(propeertyDocuments);
            console.log("Home: propeerty length: " + propeertyDocuments.length);
            console.log("Loop: " + x++);
        } while ( propeertyDocuments.length == 0 );
        console.log("Query End ---------------");
            
        console.log("Profile -------------------");
        console.log(this.uuid);
        this.profile = this.propeertyDatabase.getDocument(this.uuid);
        this.profileName = this.profile.Name;
        console.log("Name: " + this.profile.Name + " UUID: " + this.profile.UUID);
        console.log("profile is: " + typeof(this.profile));

            if (this.profile == null) {
                console.log("No profile found!");
                this.isNew = true;
            } else {
                console.log("Hra -------------------");
                const hraDocument = "HRA" + this.profile.HRA;
                console.log("HRA Document: " + hraDocument);
                this.hra = this.propeertyDatabase.getDocument("HRA" + this.profile.HRA);
                console.log("hraHolder: " + this.hra.hraHolder);
                console.log("hra is: " + typeof(this.hra));
            }

            console.log("Locations -------------------");
            this.locations = this.propeertyDatabase.getDocument("Locations");
            console.log(this.locations);
            console.log("locations is: " + typeof(this.locations));
    };

    async getScanned() {
        // Query the Scanned db to have a total document count
        do { 
            var scannedDocuments = this.scannedDatabase.query({
                select: []
                });
        } while ( scannedDocuments.length == null );
            
        this.scannedLength = scannedDocuments.length;
        console.log("Home: Scanned Length: " + this.scannedLength);
    };

    async getHra() {
        // Query the HRA db to have a total document count
        do { 
            var hraDocuments = this.hraDatabase.query({
                select: []
                });
        } while ( hraDocuments.length == null );
            
        this.hraLength = hraDocuments.length;
        console.log("Home: HRA Length: " + this.hraLength);
    };

    onProfile() {
        if (this.isNew) {
            console.log("Call newProfile");
            // this.newProfile();
        } else {
            console.log("Call updateProfile");
            // this.updateProfile();
        }
    }

    newProfile() {
        // No profile in propeerty db found
        // Create new profile document
        // HRA hardcoded for now
        console.log("Create new profile for " + this.uuid)
        console.log(this.profile.Name);
        this.propeertyDatabase.createDocument({
            "type": "Profile",
            "UUID": this.uuid, 
            "Name": this.profileName, 
            "HRA": 949, 
            "defaultLocation": this.defaultLocation,
        },this.uuid)
    }

    updateProfile() {
        // profile is a 2-way, why can't I just read it??
        // Update profile if name or default location changes
        // Using a button
        console.log("updateProfile -----");
        console.log(this.profile.Name);
        console.log(this.locations)
        // console.log(args);
        console.log("updateProfile -----");
        this.propeertyDatabase.updateDocument(this.uuid,{
            "Name": this.profileName,
            "defaultLocation": this.defaultLocation
        })
    }

    onDefaultLocation() {
        console.log("onDefaultLocation: Dialogs");
        Dialogs.action({
            message: "Default Location",
            cancelButtonText: "Cancel text",
            actions: ["One", "Two"]
        }).then(result => {
            console.log("Dialog result: " + result);
            if(result == "One"){
                this.defaultLocation = "One";
            }else if(result == "Two"){
                this.defaultLocation = "Two";
            }
        });
    }

    public destroyScanDatabase() {
        console.log("Destroy Scan Database");
        const isDestroyed = this.scannedDatabase.destroyDatabase();
        console.log(isDestroyed);
    }

    public destroyHraDatabase() {
        console.log("Destroy HRA Database");
        const isDestroyed = this.hraDatabase.destroyDatabase();
        console.log(isDestroyed);
    }
}