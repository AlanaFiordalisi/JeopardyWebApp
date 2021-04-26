export let View = class {
    constructor(model) {
        this.model = model;
        this.div = document.createElement('div');
    }

    async initializeView() {
        // Page title
        let title = document.createElement('h1');
        title.innerHTML = "Jeopardy!";
        this.div.append(title);

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
        this.div.append(color_switch);
        
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
                    tcell.addEventListener("click", () => {
                        this.tileClickHandler(row, col);
                    });
                }

                trow.append(tcell);
            }
            board.append(trow);
        }

        return board;
    };

    tileClickHandler(row, col) {
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
        question.innerHTML = this.model.gamestate.clues[col][row].question;

        // Update Answer, but though it is hidden at first
        let answer = document.querySelector("span.answer");
        answer.innerHTML = this.model.gamestate.clues[col][row].answer;

        // Create and append new/unique Reveal button
        let reveal_button = document.createElement('button');
        reveal_button.classList.add("reveal");
        reveal_button.innerHTML = "Reveal Answer";
        reveal_button.addEventListener("click", () => {
           this.revealAnswerClickHandler(row, col);
        });

        modal.append(reveal_button);
    };

    revealAnswerClickHandler(row, col) {
        // Put answer text in view
        let answer = document.querySelector("p.answer");
        answer.style.display = "block";

        // Remove Reveal button 
        let reveal_button = document.querySelector("button.reveal");
        reveal_button.remove();
        
        // Put Correct/Incorrect buttons in view
        let buttons_div = document.querySelector(".correct_buttons");
        buttons_div.style.display = "flex";
    };

    buildCorrectButtons() {
        let buttons_div = document.createElement('div');
        buttons_div.classList.add('correct_buttons');

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

        buttons_div.append(correct_button, incorrect_button);

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
        category.classList.add("category");
        category.innerHTML = `Category: <span class="category"></span>`;

        let question = document.createElement('p');
        question.classList.add("question");

        let hr = document.createElement('hr');
        let answer = document.createElement('p');
        answer.classList.add("answer");
        answer.innerHTML = `Answer: <span class="answer"></span>`

        let buttons_div = this.buildCorrectButtons();

        // Append
        modal_content.append(category, question, hr, answer, buttons_div);
        modal.append(modal_content);
        board_div.append(modal);
    };

    removeModal() {
        // Remove Answer & Correct/Incorrect buttons from view
        document.querySelector("p.answer").style.display = "none";
        document.querySelector(".correct_buttons").style.display = "none";

        // Remove Modal from view
        document.querySelector(".modal").style.display = "none";
    };

    updateScore() {

    };
};