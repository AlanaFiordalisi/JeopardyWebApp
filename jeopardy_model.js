export let Model = class {
    constructor () {
        this.qvalues = [200, 400, 600, 800, 1000];
        this.qvalues_double = [400, 800, 1200, 1600, 2000];
        this.gamestate = {
            categories: [],
            clues: [], // clues are stored in reverse orientation (rows of clues are columns on board)
            score: 0,
        }
    }

    async setUpBoard(offset) {
        console.log("setUpBoard");
        let result = await this.categories(offset);

        for (let i = 0; i < result.data.length; i++) {
            let clues = await this.getClues(result.data[i].id);
            this.gamestate.clues.push(clues)
            this.gamestate.categories.push(result.data[i].title);
        }

        return this.gamestate;
    };

    async getClues(category_id) {
        let result = await this.category(category_id);
        console.log(result);

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

    /*
    * jservice API calls.
    */

    async categories(offset) {
        console.log("categories");
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
        console.log("category");
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
    * Helpers.
    */
    rng(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    };

}