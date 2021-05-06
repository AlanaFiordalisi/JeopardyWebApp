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

    document.getElementById("log_out").addEventListener("click", async () => {
        firebase.auth().signOut();
        window.location.replace("./index.html")
    });

    document.getElementById("color_switch").addEventListener("click", async (e) => {
        await view.colorSwitchClickHandler(e);
    });

    // // Set up the buttons on the modal, which don't appear yet but exists hidden
    document.getElementById("close_button").addEventListener("click", () => {
        view.removeModal();
    });

    document.getElementById("correct_button").addEventListener("click", () => {
        view.updateScore(1);
        view.removeModal();
    });
    
    document.getElementById("incorrect_button").addEventListener("click", () => {
        view.updateScore(-1);
        view.removeModal();
    });

    document.getElementById("wiki_button").addEventListener("click", (e) => {
        view.wikiClickHandler(e);
    });
});