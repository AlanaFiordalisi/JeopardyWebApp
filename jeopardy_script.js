import { Model } from "./jeopardy_model.js";
import { View } from "./jeopardy_view.js";
import { Controller } from "./jeopardy_controller.js";

window.addEventListener("load", async () => {
    let model = new Model();
    let view = new View(model);
    let controller = new Controller(model, view);
    let body = document.querySelector('body');
    body.append(view.div);

    // Set up the initial buttons for this screen
    document.getElementById("game_setup_button").addEventListener("click", () => {
        view.formSubmitClickHandler();
    });

    document.getElementById("start_game_button").addEventListener("click", () => {
        view.initializeBoardView();
    });

    document.getElementById("color_switch").addEventListener("click", async (e) => {
        await view.colorSwitchClickHandler(e);
    });
});