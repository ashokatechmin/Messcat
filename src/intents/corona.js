const fetch = require("node-fetch")

// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
const formatted = n => new Intl.NumberFormat('en-IN', { maximumSignificantDigits: 3 }).format(+n)
const API_URL = "https://api.covid19india.org/data.json"

module.exports = async() => {
    const dict = {}
    const entities = {}

    const fetchData = async() => {
        try {
            const response = await fetch(API_URL)
            const data = await response.json()
            
            console.log ('fetched corona data for ' + data.statewise.length + ' states/districts')

            for (let item of data.statewise){
                entities [item.state.toLowerCase()] = "";
                dict[item.state.toLowerCase()] = item
            }

            entities["total"] = { // add alternate for total
                alternates: ["india"],
                value: ""
            }
            entities["source"] = {
                value: ""
            }
        } catch (error) {
            console.error(`error in fetching corona data: ${error}`)
        }
    }
    await fetchData()
    setInterval(fetchData, 60*60*1000); // fetch on the hour

    return {
        answer: (states) => {
            states.forEach (s => {
                // throw an error if the given state cannot be found
                if(!dict[s]) throw new Error (`Sorry I don't have data for '${s}'`)
            }) 
            if (states.length === 0) states = [ "total" ] // if no state is provided, default is "total"
    
            const data = states.map (stateName => {
                const data = dict[stateName]
                const recovery = ((data.recovered/data.confirmed)*100).toFixed(2)
                const death = ((data.deaths/data.recovered)*100).toFixed(2)
                const date = data.lastupdatedtime.slice(0, -3) // slice off seconds
                
                return `Covid-19 data (${stateName}) as of ${date}:\n` +
                    `Active cases: ${ formatted(data.active) } 😱\n` +
                    `Confirmed cases: ${ formatted(data.confirmed) } 😱\n` +
                    `Recovered cases: ${ formatted(data.recovered) } 😍\n` +
                    `Deaths: ${ formatted(data.deaths) } 🙏\n` +
                    `Cases today: ${ formatted(data.deltaconfirmed) } 🦠\n` +
                    `Recovery rate (active/confirmed): ${recovery}% 🤞\n` + 
                    `Death rate (deaths/recovered): ${death}% 🙏\n`
            })
            data.push (
                `Data from: ${API_URL}`
            )
            return data.join("\n\n")
        },
        keywords: ["corona", "covid", "covid-19", "covid19"],
        entities,
        meta: {
            userFacingName: ["coronavirus"],
            description: "Coronavirus statistics at the tip of your finger",
            examples: ["corona in maharashtra", "coronavirus", "dinner tomorrow"]
        }
    }
}