
module.exports = class {
    constructor (processor) {
        this.processor = processor
        this.keywords = ["corona", "covid", "covid-19"]
        this.entities = {}
        this.dict = {}
        this.meta = {
            userFacingName: ["coronavirus"],
            description: "Coronavirus statistics at the tip of your finger",
            examples: ["corona in maharashtra", "coronavirus", "dinner tomorrow"]
        }

        setInterval(() => {
            this.fetchData ()
        }, 36000000);

    }

    
    async fetchData () {
        const fetch = require("node-fetch")
        let API_URL = "https://api.covid19india.org/data.json"
        try {
            const response = await fetch (API_URL)
            const data = await response.json()
            //console.log(data.statewise[0].active)

            
            
            const states = {}
            const active = {}
            const confirmed = {}
            const deaths = {}
            const recovered = {}

            for (let item of data.statewise){
                states [item.state.toLowerCase()] = "";
                active [item.state.toLowerCase()] = item.active;
                confirmed [item.state.toLowerCase()] = item.confirmed;
                deaths [item.state.toLowerCase()] = item.deaths;
                recovered [item.state.toLowerCase()] = item.recovered;
            }
            /*console.log(state)
            console.log(active)
            console.log(confirmed)
            console.log(deaths)
            console.log(recovered)*/
            //console.log("fetching")

            this.dict = {states, active, confirmed, deaths, recovered}
            //console.log(this.dict)
            
        
            this.processor.updateEntities (
                "corona", states
            )

        } catch (error) {
            console.log(error)
        }
        
    }
    /**
     * Answer for the corona question
     * @param {string[]} entities 
     * @param {string} user 
     */
    answer (states) {
        /*console.log(states)
        console.log(this.dict.active[states])
        console.log(this.dict.confirmed[states])*/

        return (
            "Covid-19 Statistics in " + states + ": \n" +
            "Active Cases: " + this.dict.active[states] + "\n" +
            "Total Cases: " + this.dict.confirmed[states] + "\n" +
            "Recovered Cases: " + this.dict.recovered[states] + "\n" +
            "Total Deaths: " + + this.dict.deaths[states]
        )
    }
}