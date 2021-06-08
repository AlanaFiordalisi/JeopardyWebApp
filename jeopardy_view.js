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
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log("Signed in!")
                this.model.user = user;
                await this.model.setUpUser(user);
                loading.remove();
                this.setColorTheme();
            }
            else {
                console.log("Signed out.")
            }
        });
    };

    formSubmitClickHandler() {
        // Reset model information to start a new game from scratch
        this.model.resetModel();

        // Update team information in the model & view
        let scores_div = document.getElementById("scores");
        scores_div.innerHTML = "";
        let team_count = parseInt(document.querySelector('input[name="team_count"]:checked').value.slice(0, 1));
        for (let i = 1; i <= team_count; i++) {
            let team_name = document.getElementById(`${i}_name`).value;
            // Append team's name to model
            this.model.teams.push(team_name);
            // Append team's score to DOM 
            scores_div.append(this.buildTeamScore(i, team_name));
        }

        // Update the DOM to remove the setup form and show the rules
        document.getElementById("setup_div").style.display = "none";
        document.getElementById("rules_div").style.display = "flex";
    };

    buildTeamScore(team_number, team_name) {
        let p = document.createElement('p');
        p.id = `team${team_number}_score`;

        let name_span = document.createElement('span');
        name_span.id = `team${team_number}_name`;
        name_span.innerHTML = team_name;

        let score_span = document.createElement('span');
        score_span.id = `team${team_number}_score_value`;
        score_span.innerHTML = "0";

        p.append(name_span, ": ", score_span);

        return p;
    }

    async initializeBoardView() {
        // Remove rules from screen
        document.getElementById("rules_div").style.display = "none";

        // Generate and display board
        let board = await this.buildBoard(this.model.qvalues);
        document.getElementById("board_div").append(board);
        document.getElementById("board_div").style.display = "flex";
        document.getElementById("modal").style.display = "none";

        // Display score and direction divs
        document.getElementById("direction_div").style.display = "flex";
        document.getElementById("direction").innerHTML = `${this.model.teams[0]}, you go first! Choose a clue from the board.`
        document.getElementById("score_div").style.display = "flex";
    };

    setColorTheme() {
        // Set the color theme based on the user's last saved preference
        let color_switch = document.getElementById("color_switch");
        if (this.model.userDB.preferred_theme == "LIGHT") {
            color_switch.innerHTML = "Dark";
        } else {
            color_switch.innerHTML = "Light";
            document.querySelector("body").classList.toggle("dark_theme");
        }
    };

    async colorSwitchClickHandler(e) {
        // Change the color theme
        document.querySelector("body").classList.toggle("dark_theme");

        // Update the toggle button text
        let original_theme = e.target.innerHTML;
        if (original_theme == "Dark") {
            e.target.innerHTML = "Light";
        } else {
            e.target.innerHTML = "Dark";
        }

        // Save the new color theme as the user's preferred theme in the database
        await this.model.updatePreferredTheme(original_theme.toUpperCase());
    };

    async buildBoard(qvalues) {
        // Get 6 categories based on random offset
        let offset = this.model.rng(0, 18300);
        await this.model.setUpBoard(offset);

        // Get reference board and clear out any existing board
        let board = document.getElementById("game_board");
        board.innerHTML = "";

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
        console.log(this.model.gamestate.clues[col][row - 1]);
        
        // Set current clue as coordinates
        this.model.gamestate.current_clue = [col, row - 1];

        // Make Modal visible
        let modal = document.getElementById('modal');
        modal.style.display = "flex";

        // Update Category
        let cat = document.getElementById("category");
        cat.innerHTML = this.model.gamestate.categories[col];

        // Update Question
        let question = document.getElementById("question");
        question.innerHTML = this.model.gamestate.clues[col][row - 1].question;

        // Update Answer, but though it is hidden at first
        let answer = document.getElementById("answer");
        answer.innerHTML = this.model.gamestate.clues[col][row - 1].answer;

        let tile = document.getElementById(`tile${row}_${col}`);
        if (tile.classList.contains("used")) {
            answer.parentNode.style.display = "block";
            let close_button = document.getElementById("close_button_div");
            close_button.style.display = "flex";
        } else { // Create and append new, unique Reveal button
            let reveal_button = document.createElement('button');
            reveal_button.id = "reveal_button";
            // reveal_button.classList.add("reveal");
            // reveal_button.id = "reveal_button";
            reveal_button.innerHTML = "Reveal Answer";
            reveal_button.addEventListener("click", () => {
                this.revealAnswerClickHandler();
            });
            modal.append(reveal_button);
        }

        // Mark tile as used
        this.model.gamestate.clues_accessed[col][row - 1] = 1;
        tile.classList.add("used");

        // Query Wikipedia for information on the answer
        // If valid information exists, append it to answer description on modal, reveal Wiki button
        let result = await this.model.getExtract(this.model.gamestate.clues[col][row - 1].answer);
        console.log(result);
        let page = result.data.query.pages;
        if (!page["-1"]) {                                      // 'extract' property exists
            let extract = page[Object.keys(page)[0]].extract;
            if (!extract.includes("NewPP limit report")) {      // 'extract' actually contains useful info
                let answer_description = document.getElementById("answer_description");
                answer_description.innerHTML = extract;
            }
        }
    };

    revealAnswerClickHandler() {
        // Put answer text in view
        let answer = document.getElementById("answer_p");
        answer.style.display = "block";

        // Remove Reveal button 
        let reveal_button = document.getElementById("reveal_button");
        reveal_button.remove();
        
        // Put buttons div in view
        // (will only include Correct/Incorrect initially) 
        let buttons_div = document.getElementById("post_reveal_buttons_div");
        buttons_div.style.display = "block";

        // Ensure Wiki button has proper information set for it
        let wiki_button = document.getElementById("wiki_button");
        this.resetWikiButton(wiki_button);
        if (document.getElementById("answer_description").innerHTML != "") {
            document.getElementById("wiki_button_div").style.display = "flex";
        }
    };

    resetWikiButton(button) {
        button.innerHTML = "Tell me about this answer!";
        button.value = "REVEAL";
    };

    wikiClickHandler(e) {
        let answer_description = document.getElementById("answer_description");
        if (e.target.value == "REVEAL") {
            e.target.value = "HIDE";
            e.target.innerHTML = "Hide description";
            answer_description.style.display = "flex";
        } else {
            e.target.value = "REVEAL";
            e.target.innerHTML = "Tell me about this answer!";
            answer_description.style.display = "none";
        }
    };

    removeModal() {
        // Indicate that there is no current clue
        this.model.gamestate.current_clue = [-1, -1];

        // Remove Answer & Correct/Incorrect buttons from view
        document.getElementById("answer_p").style.display = "none";
        document.getElementById("post_reveal_buttons_div").style.display = "none";
        document.getElementById("answer_description").style.display = "none";
        document.getElementById("answer_description").innerHTML = "";
        document.getElementById("wiki_button_div").style.display = "none";
        document.getElementById("close_button_div").style.display = "none";

        // Remove Modal from view
        document.getElementById("modal").style.display = "none";
    };

    updateScore(multiplier) {
        // Update score for previous team
        let previous_team_index = this.model.gamestate.current_team;
        this.model.gamestate.scores[previous_team_index] += multiplier * this.model.qvalues[this.model.gamestate.current_clue[1]];
        document.getElementById(`team${previous_team_index + 1}_score_value`).innerHTML = this.model.gamestate.scores[previous_team_index];

        // Update current team and change the direction displayed
        let direction = "";
        if (multiplier < 0) {   // Got answer incorrect, update current team
            let previous_team_name = this.model.teams[previous_team_index];
            this.model.updateCurrentTeam();
            direction = `${previous_team_name} got the answer incorrect. 
                            ${this.model.teams[this.model.gamestate.current_team]}, choose the next question.`;
        } else {                // Got answer correct, keep current team
            direction = `${this.model.teams[this.model.gamestate.current_team]} got the answer correct! 
                            They get to choose another question.`;
        }
        document.getElementById("direction").innerHTML = direction;

        // If the game has ended, go to the end screen
        if (this.model.checkForEndGame()) {
            this.initializeEndGame();
        }
    };

    initializeEndGame() {
        // Hide the game elements from the screen
        document.getElementById("board_div").style.display = "none";
        document.getElementById("direction_div").style.display = "none";
        document.getElementById("score_div").style.display = "none";

        // Update the winner and scores on the end game div
        document.getElementById("winner").innerHTML = this.model.teams[this.model.gamestate.winner];

        let score_list = document.getElementById("score_list");
        score_list.innerHTML = "";
        for (let i = 0; i < this.model.teams.length; i++) {
            let item = document.createElement('li');
            item.innerHTML = `${this.model.teams[i]} with a score of ${this.model.gamestate.scores[i]}`
            score_list.append(item);
        }

        // Set up the new game button
        document.getElementById("new_game_button").addEventListener("click", () => {
            document.getElementById("game_end_div").style.display = "none";
            document.getElementById("setup_div").style.display = "flex";
        });

        // Display the end game div
        document.getElementById("game_end_div").style.display = "flex";
    };
};