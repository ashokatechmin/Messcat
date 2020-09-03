
module.exports = class {
    constructor (processor) {
        this.processor = processor
        this.keywords = ["corona"]
        this.entities = {}
        this.meta = {
            userFacingName: ["coronavirus"],
            description: "Coronavirus statistics at the tip of your finger",
            examples: ["corona in maharashtra", "coronavirus", "dinner tomorrow"]
        }
        this.fetchData ()
    }
    async fetchData () {
        // fetch: https://api.covid19india.org/data.json
        this.processor.updateEntities ("corona", { "mahara": "", "lks": "" })
    }
    /**
     * Answer for the corona question
     * @param {string[]} entities 
     * @param {string} user 
     */
    answer (entities) {
        return 'this is coronzzz'
    }
}