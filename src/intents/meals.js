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
const OUTLET_MENUS = {
	'dhaba': {
		document: {
			url: 'https://chatdaddy-media-store.s3.ap-east-1.amazonaws.com/i6V%2FQ%2BJTK4%2FmeKV9puT1UczWmCVVQaCKpwR73bJXspk%3D',
			mimetype: 'application/pdf',
			name: 'dhaba-menu.pdf'
		}
	},
	'asg': {
		document: {
			url: 'https://chatdaddy-media-store.s3.ap-east-1.amazonaws.com/xCqevivWF7VTp0qTy%2FuPJjfbpsmAg6A5dSgHjjIZx0w%3D',
			mimetype: 'application/pdf',
			name: 'asg-menu.pdf'
		}
	},
	'fuel zone': {
		document: {
			url: 'https://chatdaddy-media-store.s3.ap-east-1.amazonaws.com/Iq9rMPglXt6VlkBbV3dtXfLftJQBsWw5IqKXgqXeWdg%3D',
			mimetype: 'application/pdf',
			name: 'fuel-zone-menu.pdf'
		}
	}
}

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
            "tomorrow": "",
			// add all outlet menu intents
			...Object.keys(OUTLET_MENUS).reduce((dict, key) => ({
				...dict, [key]: ''
			}), { })
        }
        this.meta = {
            userFacingName: ["mess", "menu"],
            description: "The menu for the mess and other outlets",
            examples: [
				"what's for lunch", 
				"mess menu", 
				"what's for dinner tomorrow", 
				"abe useless, what is for dinner tomorrow",
				"what 4 breakfast tomorrow",
				"dhaba menu"
			]
        }
        this.mealsData = MealsData
    }
    /**
     * Answer for the meals question
     * @param {string[]} entities 
     * @param {string} user 
     */
    answer (entities) {
        const isTomorrow = entities.indexOf ("tomorrow") 
        if (isTomorrow >= 0) {
            entities.splice (isTomorrow, 1)
        }
		if(!entities.length) {
			throw new Error('Not sure what you mean. Type "help" to know what I can do')
		}
        return entities.map (entity => {
			if(OUTLET_MENUS[entity]) {
				return OUTLET_MENUS[entity]
			}
			return {
				text: this.meals ({meal: entity, tomorrow: isTomorrow >= 0})
			}
		})
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
				throw new Error("Unknown Option: " + option + "; You can ask for " + mealOptions.join(", "))
			}
			if (option === "combo") {
				let week = "wk_" + DateUtils.weekOfYear( date, 1 ).toString()
	
				const arr = this.mealsData["combo"][week]
				let str
				if (arr) {
					str = Object.keys(arr).map ( key => ("*" + key.toTitleCase() + ":*\n  " + arr[key].join("\n  ").toTitleCase()) ).join("\n")
				} else {
					str = "Data not available 😅"
				}
				return str
			}
			
			str = this.formattedString(option, dateKey)
		}
		return options.meal + " - " + dateKey + ":\n" + str
	}
	formattedString (mealOption, dateKey) {
		const arr = this.mealsData[mealOption][dateKey]
		return arr ? " " + arr.join("\n ").toTitleCase() : "Data not available 😅"
	}
}