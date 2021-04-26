import { Model } from "./jeopardy_model.js";
import { View } from "./jeopardy_view.js";
import { Controller } from "./jeopardy_controller.js";

window.addEventListener("load", async () => {
    let model = new Model();
    let view = new View(model);
    let controller = new Controller(model, view);
    let body = document.querySelector('body');
    body.append(view.div);
});