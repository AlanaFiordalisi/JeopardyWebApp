import { fb } from './firebase_init.js';

export let View = class {
    constructor(model) {
        this.model = model;
        this.div = document.createElement('div');
    }

    async loadingView() {
        // Put the loading message on the screen
        let loading = document.createElement('div');
        loading.id = "loading";
        loading.innerHTML = "Logging you in...";
        this.div.append(loading);

        // Wait until auth state is changed, when callback will 
        // remove loading message and populate the board
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                console.log("Signed in!")
                this.model.user = user;
                this.model.setUpUser(user);
                loading.remove();
                this.initializeView();
            }
            else {
                console.log("Signed out.")
            }
        });
    };

    async initializeView() {
        // Header with page title and color theme switch button
        let title = document.createElement('h1');
        title.innerHTML = "Jeopardy!";

        let color_switch = document.createElement('button');
        color_switch.classList.add("color_switch");
        color_switch.innerHTML = "Dark";
        color_switch.addEventListener("click", (e) => {
            document.querySelector("body").classList.toggle("dark_theme");
            if (e.target.innerHTML == "Dark") {
                e.target.innerHTML = "Light";
            } else {
                e.target.innerHTML = "Dark";
            }
        });
        
        let header = document.createElement('div');
        header.id = "header_div";
        header.append(title, color_switch);
        this.div.append(header);

        // Game Board
        let board_div = document.createElement('div');
        board_div.id = "board_div";

        let board = await this.buildBoard(this.model.qvalues);

        board_div.append(board);
        this.div.append(board_div);

        // Put the Modal there but in secret!
        this.buildModal();
    };

    async buildBoard(qvalues) {
        // Get 6 categories based on random offset
        let offset = this.model.rng(0, 18300);
        console.log(offset);

        await this.model.setUpBoard(offset);
        console.log(this.model.gamestate);

        // Build board
        let board = document.createElement('table');
        board.id = "game_board";

        for (let row = 0; row < 6; row++) {
            let trow = document.createElement('tr');
            let question_value = qvalues[row - 1];
            for (let col = 0; col < 6; col++) {
                let tcell = document.createElement('td');
                tcell.id = `tile${row}_${col}`;
                tcell.classList.add("tile");

                if (row == 0) {
                    tcell.classList.add("category_tile");
                    tcell.innerHTML = `${this.model.gamestate.categories[col]}`
                } else {
                    tcell.classList.add("question_tile");
                    tcell.innerHTML = `$${question_value}`;
                    tcell.addEventListener("click", async () => {
                        await this.tileClickHandler(row, col);
                    });
                }

                trow.append(tcell);
            }
            board.append(trow);
        }

        return board;
    };

    async tileClickHandler(row, col) {
        console.log(`clicked on cell ${row}, ${col}`);
        console.log(this.model.gamestate.clues[col][row]);

        // Make Modal visible
        let modal = document.querySelector('.modal');
        modal.style.display = "flex";

        // Update Category
        let cat = document.querySelector("span.category");
        cat.innerHTML = this.model.gamestate.categories[col];

        // Update Question
        let question = document.querySelector("p.question");
        question.innerHTML = this.model.gamestate.clues[col][row - 1].question;

        // Update Answer, but though it is hidden at first
        let answer = document.querySelector("span.answer");
        answer.innerHTML = this.model.gamestate.clues[col][row - 1].answer;

        // Create and append new/unique Reveal button
        let reveal_button = document.createElement('button');
        reveal_button.classList.add("reveal");
        reveal_button.innerHTML = "Reveal Answer";
        reveal_button.addEventListener("click", () => {
           this.revealAnswerClickHandler();
        });

        modal.append(reveal_button);

        // Query Wikipedia for information on the answer
        // If valid information exists, append it to answer description on modal, reveal Wiki button
        let result = await this.model.getExtract(this.model.gamestate.clues[col][row - 1].answer);
        console.log(result);
        let page = result.data.query.pages;
        if (!page["-1"]) {                                      // 'extract' property exists
            let extract = page[Object.keys(page)[0]].extract;
            if (!extract.includes("NewPP limit report")) {      // 'extract' actually contains useful info
                let answer_description = document.querySelector(".answer_description");
                answer_description.innerHTML = extract;
                let wiki_button_div  = document.querySelector(".wiki_button");
                wiki_button_div.style.display = "flex";
            }
        }
    };

    revealAnswerClickHandler() {
        // Put answer text in view
        let answer = document.querySelector("p.answer");
        answer.style.display = "block";

        // Remove Reveal button 
        let reveal_button = document.querySelector("button.reveal");
        reveal_button.remove();
        
        // Put buttons div in view
        // (will only include Correct/Incorrect initially) 
        let buttons_div = document.querySelector(".post_reveal_buttons_div");
        buttons_div.style.display = "block";
    };

    buildPostRevealButtons() {
        // Create the Correct/Incorrect buttons and append them to their own div
        let correct_button = document.createElement('button');
        correct_button.classList.add("correct");
        correct_button.innerHTML = "I got the answer correct!";
        correct_button.addEventListener("click", () => {
            this.updateScore();
            this.removeModal();
        });

        let incorrect_button = document.createElement('button');
        incorrect_button.classList.add("incorrect");
        incorrect_button.innerHTML = "I got the answer incorrect";
        incorrect_button.addEventListener("click", () => {
            this.removeModal();
        });

        let answer_buttons_div = document.createElement('div');
        answer_buttons_div.classList.add('answer_buttons', 'buttons');
        answer_buttons_div.append(correct_button, incorrect_button);

        // Create the Reveal A Short Description button and append it to its own div
        let wiki_button = document.createElement('button');
        wiki_button.innerHTML = "Tell me about this answer!";
        wiki_button.value = "REVEAL";
        wiki_button.addEventListener("click", (e) => {
            let answer_description = document.querySelector(".answer_description");
            if (e.target.value == "REVEAL") {
                e.target.value = "HIDE";
                e.target.innerHTML = "Hide description";
                answer_description.style.display = "flex";
            } else {
                e.target.value = "REVEAL";
                e.target.innerHTML = "Tell me about this answer!";
                answer_description.style.display = "none";
            }
        });

        let wiki_button_div = document.createElement('div');
        wiki_button_div.classList.add('wiki_button', 'buttons');
        wiki_button_div.append(wiki_button);

        // Append the two sub-divs to the buttons div, which is returned
        let buttons_div = document.createElement('div');
        buttons_div.classList.add('post_reveal_buttons_div');
        buttons_div.append(answer_buttons_div, wiki_button_div);

        return buttons_div;
    };

    buildModal() {
        // Create Modal wrapper
        let modal = document.createElement('div');
        modal.classList.add("modal");

        // Create div and all modal content elements
        let modal_content = document.createElement('div');
        modal_content.classList.add("modal_content");

        let category = document.createElement('p');
        category.classList.add("category", "large");
        category.innerHTML = `Category: <span class="category"></span>`;

        let question = document.createElement('p');
        question.classList.add("question", "large");

        let hr = document.createElement('hr');
        let answer = document.createElement('p');
        answer.classList.add("answer", "large");
        answer.innerHTML = `Answer: <span class="answer"></span>`;

        let answer_description = document.createElement('div');
        answer_description.classList.add("answer_description");

        // Append
        modal_content.append(category, question, hr, answer, answer_description);
        let buttons_div = this.buildPostRevealButtons(); // Must append answer description before building/appending buttons
        modal_content.append(buttons_div);
        modal.append(modal_content);
        board_div.append(modal);
    };

    removeModal() {
        // Remove Answer & Correct/Incorrect buttons from view
        document.querySelector("p.answer").style.display = "none";
        document.querySelector(".post_reveal_buttons_div").style.display = "none";
        document.querySelector(".answer_description").style.display = "none";
        document.querySelector(".answer_description").innerHTML = "";
        document.querySelector(".wiki_button").style.display = "none";

        // Remove Modal from view
        document.querySelector(".modal").style.display = "none";
    };

    updateScore() {

    };
};