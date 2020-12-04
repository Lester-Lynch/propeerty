/* 
  23 Nov 2020
  - Location to use Button and Dialogs
  3 Sep 2020
  - Migrate to NS 7
  - Migrate to @nativescript/core
  30 June 2020
  - Using eert-dev.ddns.net instead of 192.168.0.13 for sync URL
  20 June 2020
  - Use propeerty db to set locations
  20 May 2020
  - Made Manual input controllable by setting isManual to control visibility and enabled
  28 April 2020
  - Moved to Tab template
  - Dropping RadListView from Scan pages due to Exceptions thrown and not showing results.

  Scan Barcodes thru camera.
  Manual entry if allowed
  Verify against HRA local copy of HRA database if desired
  Save results into local database and sync to server database

  Scan-View-Model is based upon demos found in nativescript-barcode scanner by
  Eddie Verbruggen found at https://github.com/EddyVerbruggen/nativescript-barcodescanner
*/ 

import { Observable, ObservableArray, Device, Dialogs } from "@nativescript/core";
import { ObservableProperty } from "../observable-property-decorator";
import { BarcodeScanner } from "nativescript-barcodescanner";
import { Couchbase } from "nativescript-couchbase-plugin";

class Item {
  isHra: boolean;
  Barcode: string;
  Format: string;
  Location: string;
  Date: any;

  constructor(isHra: boolean, Barcode: string, Format: string, Location: string) {
    this.isHra = isHra;
    this.Barcode = Barcode;
    this.Format = Format;
    this.Location = Location;
    this.Date = new Date();
  }
}

export class ScanViewModel extends Observable {
  public propeertyDatabase: Couchbase;
  public scannedDatabase: Couchbase;
  public hraDatabase: Couchbase;

  public profile = { "type": "string", "UUID": "string", "Name": "string", "HRA": "string", "defaultLocation": "string" };
  public hra = { "type": "string", "hraNumber": "string", "hraHolder": "string" };
  public locations = { "type": "string", "Names": ["Array<string>"] };
  public scanDocument = { "id": "any", "isHra": "any", "Format": "any", "Barcode": "any", "UUID": "any", "Date": "any", "Location": "any" };

  public items: ObservableArray<Item>;
  newItem: string = '';

  public message: string;
  // public location: string;
  private barcodeScanner: BarcodeScanner;

  @ObservableProperty() location = "default"

  // Manual input defaults
  // public isVisible: string = "collapsed";  // visible, hidden, collapse
  private isManual: boolean = false;

  private isHra: boolean;

  // private locationsIndex = 0;
  private uuid = Device.uuid;
  private scanType = ["Inventory", "Any"]

  constructor() {
    super();

    this.barcodeScanner = new BarcodeScanner();

    this.items = new ObservableArray<Item>([]);
    /*
      new Item(false, "1234A", "-Test-", "Moonbase Alpha"),
      new Item(false, "0987Z", "-Test-", "Moonbase Alpha"),
      new Item(false, "11111", "-Test-", "Moonbase Alpha")
    ]);
    */

    this.propeertyDatabase = new Couchbase("propeerty-database");
    this.profile = this.propeertyDatabase.getDocument(this.uuid);
    this.hra = this.propeertyDatabase.getDocument("HRA");
    this.locations = this.propeertyDatabase.getDocument("Locations");
    // this.locationsIndex = this.locations.Names.indexOf(this.profile.defaultLocation);
    this.location = this.profile.defaultLocation;

    // Scan results database with push sync
    this.scannedDatabase = new Couchbase("scanned-database");
    // var pushScanned = this.scannedDatabase.createPushReplication("ws://eert-dev.ddns.net:4984/scanned");
    var pushScanned = this.scannedDatabase.createPushReplication("ws://192.168.0.13:4984/scanned");
    pushScanned.setContinuous(true);
    pushScanned.start();

    // HRA database local store and view
    this.hraDatabase = new Couchbase("hra-database");
    // var pullHra = this.hraDatabase.createPullReplication("ws://eert-dev.ddns.net:4984/hra949");   
    var pullHra = this.hraDatabase.createPullReplication("ws://192.168.0.13:4984/hra949");
    pullHra.start();

  };

  addItem() {
    this.items.push(new Item(true, this.newItem, "*Manual*", this.location));
    this.set('newItem','');
  };

  /*
    Scan options:
      formats: "Code_39", // QR_Code, EAN_13 (Code_39) PDF_417
      cancelLabel: "EXIT. Also, try the volume buttons!", // iOS only, default 'Close'
      cancelLabelBackgroundColor: "#333333",              // iOS only, default '#000000' (black)
      message: "Use the volume buttons for extra light",  // Android only, default is 'Place a barcode inside the viewfinder rectangle to scan it.'
      preferFrontCamera: false,     // Android only, default false
      showFlipCameraButton: true,   // default false
      showTorchButton: true,       // iOS only, default false
      torchOn: false,               // launch with the flashlight on (default false)
      resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
      orientation: 'portrait',     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
      beepOnScan: true,             // Play or Suppress beep on scan (default true)
      openSettingsIfPermissionWasPreviouslyDenied: true, // On iOS you can send the user to the settings app if access was previously denied
  */

 onLocation() {
  console.log("onLocation: Dialogs");
  console.log(this.locations.Names);
  Dialogs.action({
      message: "Select scaning Location",
      cancelButtonText: "Cancel",
      actions: this.locations.Names
  }).then(result => {
      this.location = result;
      console.log("Dialog location: " + this.location);
      console.log("Dialog result: " + result);
  });
}

 
  public scanBarcode() {
    this.barcodeScanner.scan({
      formats: "Code_39", // QR_Code, EAN_13 (Code_39) PDF_417
      showFlipCameraButton: true,   // default false
      showTorchButton: true,       // iOS only, default false
      resultDisplayDuration: 500,   // Android only, default 1500 (ms), set to 0 to disable echoing the scanned text
      orientation: 'portrait',     // Android only, default undefined (sensor-driven orientation), other options: portrait|landscape
      closeCallback: () => {
        console.log("Scanner closed @ " + new Date().getTime());
      }
    }).then((result) => {
      // Note that this Promise is never invoked when a 'continuousScanCallback' function is provided
      console.log("ScanBarcode: " + result.format + " @ " + result.text);

      // Look for matching document in HRA database then set flag
      var hraDocument = this.hraDatabase.getDocument('key::' + result.text)
      console.log(hraDocument);
      if (hraDocument != null) {
        console.log("Scan: HRA Document found");
        this.isHra = true;
      } else {
        console.log("Scan: HRA Document not found!");
        this.isHra = false;
      };
            
      // Update array for scan-page tab display
      this.items.push(new Item(this.isHra, result.text, result.format, this.location));

      // Query this barcode
      console.log("Scan: Query Start ----------");
      var queryDocument = this.scannedDatabase.query({
        select: [],
        where: [{property: 'Barcode', comparison: 'equalTo' , value: result.text}],
      });
      console.log(queryDocument);
      console.log(queryDocument.length);
      console.log(typeof(queryDocument));
      console.log("Scan: Query End ----------");

      // See if this has been scanned before, then update or create new
      console.log("Scan: Get document test -----");
      var getDocument = this.scannedDatabase.getDocument(result.text);
      console.log(getDocument);
      console.log(getDocument);
      if (getDocument) {
        console.log("Scan: Update document in scanned database");
        // var updated =
        this.scannedDatabase.updateDocument( result.text, {
          "isHra": this.isHra,
          "Barcode": result.text,
          "Format": result.format,
          "UUID": this.uuid,
          "Location": this.location,
          "Date": new Date()
        })
        console.log("Scan: Updated document: " + result.text + " @ " + Date());
      } else {
        console.log("Scan: Create new document in scanned database");
        // var docId = this.scannedDatabase.createDocument({
        this.scannedDatabase.createDocument({
          "isHra": this.isHra,
          "Barcode": result.text,
          "Format": result.format,
          "UUID": this.uuid,
          "Location": this.location,
          "Date": new Date()
        }, result.text )
        console.log("Scan: Created new document: " + result.text + " @ " + Date());
      }
    }, (errorMessage) => {
      console.log("No scan. " + errorMessage);
    })
  }
} 