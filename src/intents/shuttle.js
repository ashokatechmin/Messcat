const DateUtils = require('../utils/date-utils.js')
const shuttleData = require("./data/shuttle_data.json");

module.exports = async () => {
	return {
		keywords: ["shuttl", "shuttle", "bus", "transport"],
		entities: {
			"from": "",
			"college": {
				alternates: ["university", "uni", "ashoka", "campus"],
				value: ""
			},
			"to": "",
			"metro": {
				alternates: ["jahangirpuri", "station"],
				value: ""
			},
			"weekday": "",
			"weekend": "",
		},
		meta: {
			userFacingName: ["shuttle", "transport"],
            description: "The timings for the shuttles plying between the University and Jahangirpuri Metro Station. Please note that the schedules are different on weekdays and weekends.",
            examples: [
				"When do the shuttles leave from the college?", 
				"Shuttle schedule for weekends",
				"Shuttle schedule",
				"Transport from campus", 
			]
		},
		answer: async (entities) => {
			let data = {};

			const time = new Date();
			const isWeekend = [0, 6].includes(time.getDay());
			const isTomorrowWeekend = [5, 6].includes(time.getDay());
			let source = isWeekend ? shuttleData.weekend : shuttleData.weekday;
			let type = isWeekend ? "Weekend" : "Weekday";

			const hasFrom = entities.includes("from"), hasTo = entities.includes("to"), hasNext = entities.includes("next");
			const hasWeekend = entities.includes("weekend"), hasWeekday = entities.includes("weekday");

			if (hasFrom || hasTo)
			{
				const c = entities.includes("college");;
				if (hasFrom)
				{
					const key = `Shuttles plying from the ${c ? "College" : "Metro Station"} (${type})`
					data = {[key]: c ? source.from_campus : source.to_campus};
				}
				else
				{
					const key = `Shuttles plying towards the ${c ? "College" : "Metro Station"} (${type})`
					data = {[key]: c ? source.to_campus : source.from_campus};
				}
			}
			else
			{
				if (hasWeekday || hasWeekend)
				{
					type = hasWeekday ? "Weekday" : "Weekend";
					source = hasWeekday ? shuttleData.weekday : shuttleData.weekend;

					data = {
						[`Shuttles plying from the College to the Metro Station (${type})`]: source.from_campus,
						[`Shuttles plying from the Metro Station to the College (${type})`]: source.to_campus,
					}
				}
				else
				{
					data = {
						[`Shuttles plying from the College to the Metro Station (${type})`]: source.from_campus,
						[`Shuttles plying from the Metro Station to the College (${type})`]: source.to_campus,
						[`Please note that the schedule is different on ${isWeekend ? "weekdays" : "weekends"}.`]: []
					}
				}
			}

			return Object.entries(data).map(([key, value]) => {
				return `${key}:\n${value.map(thing => {
					const hours = Math.floor(thing / 100);
					const minutes = thing % 100;

					return `${hours % 13 + (hours > 12 ? 1 : 0)}:${minutes.toString().padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
				}).join("\n")}\n`;
			});
		}
	}
}