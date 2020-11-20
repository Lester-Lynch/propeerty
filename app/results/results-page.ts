import { NavigatedData, Page } from "@nativescript/core";
import { ResultsViewModel } from "./results-view-model";

export function onNavigatingTo(args: NavigatedData) {
    const page = <Page>args.object;
    page.bindingContext = new ResultsViewModel();
}
