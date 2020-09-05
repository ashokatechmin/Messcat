// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const formatted = n => new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(+n)

module.exports = class {
    constructor (processor) {
        this.processor = processor
        this.keywords = ["corona", "covid", "covid-19", "covid19"]
        this.entities = {}
        this.dict = {}
        this.meta = {
            userFacingName: ["coronavirus"],
            description: "Coronavirus statistics at the tip of your finger",
            examples: ["corona in maharashtra", "coronavirus", "dinner tomorrow"]
        }
        this.fetchData ()
        setInterval(() => this.fetchData (), 60*60*1000); // fetch on the hour
    }
    async fetchData () {
        const fetch = require("node-fetch")
        let API_URL = "https://api.covid19india.org/data.json"
        try {
            const response = await fetch (API_URL)
            const data = await response.json()
            
            console.log ('fetched corona data for ' + data.statewise.length + ' states/districts')
            
            this.dict = {}

            const entities = {}

            for (let item of data.statewise){
                entities [item.state.toLowerCase()] = "";
                this.dict[item.state.toLowerCase()] = item
            }
            entities["total"] = { // add alternate for total
                alternates: ["india"],
                value: ""
            }
            this.processor.updateEntities ("corona", entities)
        } catch (error) {
            console.error(`error in fetching corona data: ${error}`)
        }
        
    }
    /**
     * Answer for the corona question
     * @param {string[]} entities 
     * @param {string} user 
     */
    answer (states) {
        states.forEach (s => {
            // throw an error if the given state cannot be found
            if(!this.dict[s]) throw new Error (`Sorry I don't have data for '${s}'`)
        }) 
        if (states.length === 0) states = [ "total" ] // if no state is provided, default is "total"

        return states.map (stateName => {
            const data = this.dict[stateName]
            const recovery = ((data.recovered/data.confirmed)*100).toFixed(2)
            const death = ((data.deaths/data.confirmed)*100).toFixed(2)
            const date = data.lastupdatedtime.slice(0, -3) // slice off seconds
            
            return `Covid-19 data (${stateName}) as of ${date}:\n` +
            `Active cases: ${ formatted(data.active) }\n` +
            `Confirmed cases: ${ formatted(data.confirmed) }\n` +
            `Deaths: ${ formatted(data.deaths) }\n` +
            `Cases today: ${ formatted(data.deltaconfirmed) }\n` +
            `Recovery rate (active/confirmed): ${recovery}%\n` + 
            `Death rate (deaths/confirmed): ${death}%\n`
        })
        .join ("\n\n")
    }
}