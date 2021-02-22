const DateUtils = require('../utils/date-utils')
const MealsData = require('./data/dining_data.json')

String.prototype.toTitleCase = function () {
	var str2 = ""
	for (var i = 0; i < this.length; i++) {
		const char = this.charAt(i)
		str2 += (i === 0 || this.charAt(i-1).trim() === "") ? char.toUpperCase() : char.toLowerCase()
	}
	return str2
}

const mealOptions = [ "breakfast", "lunch", "snacks", "dinner" ]

module.exports = class {
    constructor () {
        this.keywords = ["menu", "what", "mess"]
        this.entities = {
            "lunch": "",
            "dinner": "",
            "breakfast": "",
            "snacks": "",
            "combo": {"alternates": ["combos", "tks"], "value": ""},
            "mess": "",
            "tomorrow": ""
        }
        this.meta = {
            userFacingName: ["mess", "menu"],
            description: "The mess menu",
            examples: [
				"what's for lunch", 
				"mess menu", 
				"what's for dinner tomorrow", 
				"abe useless, what is for dinner tomorrow",
				"what 4 breakfast tomorrow"
			]
        }
        this.mealsData = MealsData
    }
    /**
     * Answer for the meals question
     * @param {string[]} entities 
     * @param {string} user 
     */
    answer (entities, user) {
        const isTomorrow = entities.indexOf ("tomorrow") 
        if (isTomorrow >= 0) {
            entities.splice (isTomorrow, 1)
        }
        return entities.map ( entity => this.meals ({meal: entity, tomorrow: isTomorrow >= 0}) )
    }
    meals (options) {
		let date = DateUtils.dateWithTimeZone(new Date(), 5.5)
		if (options.tomorrow) {
			date = DateUtils.offsetting(date, 24)
		}
		let dateKey = DateUtils.dateString(date)

		let str = ""
		if (!options.meal || options.meal === "mess") {
			str = mealOptions.map(option => "*" + option.toTitleCase() + "*\n" + this.formattedString(option, dateKey)).join("\n\n")
		} else {
			const option = options.meal.toLowerCase()
			if (!this.mealsData[option]) {
				throw "Unknown Option: " + option + "; You can ask for " + mealOptions.join(", ")
			}
			if (option === "combo") {
				let week = "wk_" + DateUtils.weekOfYear( date, 1 ).toString()
	
				const arr = this.mealsData["combo"][week]
				let str
				if (arr) {
					str = Object.keys(arr).map ( key => ("*" + key.toTitleCase() + ":*\n  " + arr[key].join("\n  ")) ).join("\n")
				} else {
					str = "Data not available :/"
				}
				return str.toTitleCase()
			}
			
			str = this.formattedString(option, dateKey)
		}
		return options.meal + " - " + dateKey + ":\n" + str
	}
	formattedString (mealOption, dateKey) {
		const arr = this.mealsData[mealOption][dateKey]
		return arr ? " " + arr.join("\n ").toTitleCase() : "Data not available :/"
	}
}