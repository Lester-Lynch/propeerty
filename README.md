PropEERTy
3 December 2020
Lester Lynch

Propeerty is written to aid the EERT in managing property.

This app is written using NativeScript Core.  Code is written in Typescript.

At this time, only Android is supported since I had no Mac or iPhone to use for development.
This code has only been tested in a standalone environment, not in the enterprise.  This 
was done using a laptop running Ubuntu and Couchbase.  This system also served as the 
development workstation.  All development and testing used LAN and WiFi services with some
testing done using a WAN environment.

Couchbase Server and Gateway are used on the backend for database services.  A Couchbase
plugin is used in the application to provide local database access and to sync data with 
the server.  The HRA data is imported into Couchbase Server from a CSV of the HRA dumped
from the APPMS database.  Scan results are kept in a seperate database to keep updating
the HRA database to a simple export/import without have to worry about data merging.  The
intent is to import the scanned data into APPMS (after some data reformatting) using
processes much like those used with current scanned data.

