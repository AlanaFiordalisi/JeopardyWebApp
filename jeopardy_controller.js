export let Controller = class {
    constructor (model, view) {
        this.model = model;
        this.view = view;

        this.view.loadingView();
        // this.view.initializeView();
    }
}