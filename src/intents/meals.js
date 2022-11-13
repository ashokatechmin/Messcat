const DateUtils = require('../utils/date-utils')
const getLatestMenu = require('../utils/get-latest-menu')
const PrismaClient = require("@prisma/client").PrismaClient;

const prisma = new PrismaClient();

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

const locale = "en-IN";

module.exports = async() => {

	const mealsData = await getLatestMenu()

	const computeMealAnswer = async (options) => {
		let date = DateUtils.dateWithTimeZone(new Date(), 5.5);
		date.setHours(0); date.setMinutes(0); date.setSeconds(0); date.setMilliseconds(0);
		
		if (options.tomorrow) {
			date.setDate(date.getDate() + 1);
		}

		let str = "";
		if (!options.meal || options.meal === "mess")
		{
			const menu = await prisma.dailyMenu.findFirstOrThrow({
				where: {
					date
				},
				include: {
					lunch: true,
					dinner: true,
					snacks: true,
					breakfast: true
				}
			}).catch(() => {str = "Data not available 😅"});

			if (str === "") 
			{
				str = ["breakfast", "lunch", "snacks", "dinner"].map(meal => {
					return `${meal.toTitleCase()} - ${menu[meal].map(item => item.name.toTitleCase()).join("\n")}`;
				}).join("\n\n");

				str = `Mess Menu - ${date.toLocaleDateString(locale)}:\n${str}`;
				
				return str;
			}
		}
		else
		{
			const option = options.meal.toLowerCase()
			if (![...mealOptions, "combo"].includes(option)) {
				throw new Error("Unknown Option: " + option + "; You can ask for " + mealOptions.join(", "))
			}
			
			if (option === "combo") {
				let week = "wk_" + DateUtils.weekOfYear( date, 1 ).toString()
	
				const arr = mealsData["combo"][week]
				let str
				if (arr) {
					str = Object.keys(arr).map ( key => ("*" + key.toTitleCase() + ":*\n  " + arr[key].join("\n  ").toTitleCase()) ).join("\n")
				} else {
					str = "Data not available 😅"
				}
				return str
			}

			const menu = await prisma.dailyMenu.findFirstOrThrow({
				where: {
					date
				},
				include: {
					lunch: option == "lunch",
					dinner: option == "dinner",
					snacks: option == "snacks",
					breakfast: option == "breakfast"
				}
			}).catch(() => {str = "Data not available 😅"});

			if (str === "") str = menu[option].map(item => item.name.toTitleCase()).join("\n");
		}

		return `${options.meal?.toTitleCase()} - ${date.toLocaleDateString(locale)}:\n${str}`;
	}

	return {
		keywords: ["menu", "what", "mess"],
		entities: {
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
		},
		meta: {
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
		},
		answer: async (entities) => {
			const isTomorrow = entities.indexOf ("tomorrow") 
			if (isTomorrow >= 0) {
				entities.splice (isTomorrow, 1)
			}
			if(!entities.length) {
				throw new Error('Not sure what you mean. Type "help" to know what I can do')
			}

			return await Promise.all(entities.map(async (entity) => {
				if(OUTLET_MENUS[entity]) {
					return OUTLET_MENUS[entity]
				}
				
				return {
					text: await computeMealAnswer({meal: entity, tomorrow: isTomorrow >= 0})
				}
			}));
		}
	}
}