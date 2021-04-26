export let Controller = class {
    constructor (model, view) {
        this.model = model;
        this.view = view;

        this.view.initializeView();
    }
}