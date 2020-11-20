/*
    30 June 2020
    - Using eert-dev.ddns.net instead of 192.168.0.13 for Sync URL
    20 June 2020
    - Implement cont pull on db
    - Implement listner to update array
    10 June 2020
    - Switched Couchbase plugin

    scanData is a local database that should only have locally scanned result info
*/

import { Observable, ObservableArray } from "@nativescript/core"
import { Couchbase } from "nativescript-couchbase-plugin";

export class ResultsViewModel extends Observable {
    public scannedDatabase: Couchbase;

    public scannedDocuments: ObservableArray<any>;

    constructor() {
        super();

        this.scannedDocuments = new ObservableArray([]);

        this.scannedDatabase = new Couchbase("scanned-database");
        // var pullScanned = this.scannedDatabase.createPullReplication("ws://eert-dev.ddns.net:4984/scanned");
        var pullScanned = this.scannedDatabase.createPullReplication("ws://192.168.0.13:4984/scanned");
        pullScanned.setContinuous(true);
        pullScanned.start();

        this.scannedDatabase.addDatabaseChangeListener(function(changes) {
            for (var i = 0; i < changes.length; i++) {
              const documentId = changes[i];
              console.log("Results: scanned db listener update: " + documentId);
            }
        });

        // Load and Display the Reults Database upon navigating to the Results tab.
        this.getScannedDatabase();
    }

    public getScannedDatabase() {
        console.log("Results: listScannedDatabase");
        // clear the array
        this.scannedDocuments.length = 0;
        var rows = this.scannedDatabase.query({
            select: []
        });

        console.log("Results: Scanned length: " + rows.length);
        console.log(rows);

        for (var r = 0; r < rows.length; r++) {
            this.scannedDocuments.push(rows[r]);
            console.log(rows[r]);
        }
        console.log("Results: Items Length: " + this.scannedDocuments.length);
        // console.log(this.items);
    }
    
}
