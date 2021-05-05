export let Model = class {
    constructor () {
        this.qvalues = [200, 400, 600, 800, 1000];
        this.qvalues_double = [400, 800, 1200, 1600, 2000];
        this.gamestate = {
            categories: [],
            // clues and clues_accessed are stored in reverse orientation (rows of clues are columns on board)
            clues: [], 
            clues_accessed: [],
            score: 0,
            current_clue: [-1, -1],
            finished: false,
        }
        this.team_count = 0;
        this.teams = [];
    }

    async setUpUser(user) {
        this.userAuth = user;
        const dbRef = firebase.database().ref();
        // Look for user id in database
        await dbRef.child("users").child(user.uid).get().then((snapshot) => {
            if (snapshot.exists()) {        // If user exists, get their preferred theme
                console.log("Existing user.")
                this.userDB = snapshot.val();
            } else {                        // If user does not exist, add them to DB
                console.log("New user – adding to database.");
                this.userDB = {
                    name: user.displayName,
                    preferred_theme: "light",
                    max_score: 0,
                    num_games_played: 0,
                };
                dbRef.child("users").child(user.uid).set(this.userDB);
                this.preferred_theme = "light";
            }
        }).catch((error) => {
            console.error(error);
        });
    };

    async setUpBoard(offset) {
        let result = await this.categories(offset);

        for (let i = 0; i < result.data.length; i++) {
            let clues = await this.getClues(result.data[i].id);
            this.gamestate.clues.push(clues)
            this.gamestate.clues_accessed.push(new Array(5).fill(0));
            this.gamestate.categories.push(result.data[i].title);
        }

        return this.gamestate;
    };

    async getClues(category_id) {
        let result = await this.category(category_id);

        if (result.data.clues_count > 5) {
            let offset = this.rng(0, result.data.clues_count - 5);
            return result.data.clues.slice(offset, offset + 5);
        } else if (result.data.clues_count == 5) { 
            return result.data.clues;
        } else {
            console.log("< 5");
            // TODO
        }
    };

    async updatePreferredTheme(theme) {
        const dbRef = firebase.database().ref();
        await dbRef.child("users").child(this.userAuth.uid).child("preferred_theme").set(theme);
    };

    /*
    * jservice API calls.
    */

    async categories(offset) {
        const result = await axios({
            method: 'get',
            url: 'https://jservice.io/api/categories',
            params: {
                count: 6,
                offset: offset,
            }
        });
        return result;
    };

    async category(category_id) {
        const result = await axios ({
            method: 'get',
            url: 'https://jservice.io/api/category',
            params: {
                id: category_id,
            }
        });
        return result;
    }

    /*
    * Wikipedia API calls.
    */

    async getExtract(term) {
        const result = await axios({
            method: 'get',
            url: 'https://en.wikipedia.org/w/api.php',
            params: {
                action: 'query',
                origin: '*',
                format: 'json',
                prop: 'extracts',
                exsentences: 3,
                titles: term,
            }
        })
        return result;
    }

    /*
    * Helpers.
    */
    rng(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };

}