import { NavigatedData, Page } from "@nativescript/core";
import { ScanViewModel } from "./scan-view-model";

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new ScanViewModel();
}
