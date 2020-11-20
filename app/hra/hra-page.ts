/*
3 Sep 2020
- Migrate to NS 7
- Migrate to @nativescript/core
*/

import { NavigatedData, Page, EventData, SearchBar, isAndroid } from "@nativescript/core";
import { HraViewModel } from "./hra-view-model";

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new HraViewModel();
}

export function onLoaded(args: EventData){
    var page = <Page>args.object;
    var searchbarElement = <SearchBar>page.getViewById("searchBarId");
    if(isAndroid){
        searchbarElement.android.clearFocus();
    }
}