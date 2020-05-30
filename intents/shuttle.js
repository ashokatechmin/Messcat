const PDFExtract = require('pdf.js-extract').PDFExtract
const DateUtils = require('../DateUtils.js')

const isWeekend = (day) => day % 6 === 0

function formatHour (value) {
	const hour =  ~~(value/60)
	const min =  ~~(value%60)
	return (hour < 10 ? "0"+hour : hour) + ":" + (min < 10 ? "0"+min : min)
}
function makeNbyNString (array, n, formatter) {
	var str = ""
	for (var i in array) {
		const value = formatter(array[i])
		if (i === array.length-1) {

		} else if (i > 0 && i % n === 0) {
			str += ",\n"
		} else if (i % n !== 0) {
			str += ", "
		}
		str += value	
	}
	return str
}

module.exports = class CommandsShuttle {

	constructor () {
        this.keywords = [ "shuttle", "shuttl" ]
        this.entities = {
            "next": "",
            "to delhi": {
                "alternates": ["to metro", "to jahangirpuri", "to jpuri", "delhi shuttle", "from campus", "from ashoka"],
                "value": ""
            },
            "to campus": {
                "alternates": ["to ashoka", "campus shuttle", "from delhi", "from metro"],
                "value": ""
            }
        }
        this.meta = {
            "userFacingName": [ "shuttle" ],
            "description": "Delhi-Campus shuttle timings",
            "examples": ["shuttle schedule", "next shuttle to campus", "when's the next shuttle to delhi"]
        }

		this.shuttleData = null
		this.computeShuttleData()
	}
	computeShuttleData () {
		const extractColumn = function (content, columnName, position) {

			let arr = []
			var columnX = -1.0
			var num = 0

			for (var i = 0;i < content.length;i++) {
				const str = content[i].str.toLowerCase()
				
				if (columnX > 0.0 && Math.abs(content[i].x-columnX) < 5) {
					const comps = str.split(":")
					arr.push( parseInt(comps[0])*60 + parseInt(comps[1]) )
				} else if (columnX < 0) {
					if (str === columnName) {
						if (num < position) {
							num += 1
						} else {
							columnX = content[i].x+30
						}
					}
				}
			}
			return arr
		}

		new PDFExtract().extract('data/delhi_shuttle.pdf', {}, (err, data) => {
	  		if (err) {
	  			console.log("error in loading delhi shuttle: " + err)
	  			return
	  		}
	  		const content = data.pages[0].content
	  		this.shuttleData = {
	  			"weekday": {
	  				"from_campus": extractColumn(content, "campus to metro", 0),
	  				"to_campus": extractColumn(content, "metro to campus", 0)
	  			},
	  			"weekend": {
	  				"from_campus": extractColumn(content, "campus to metro", 1),
	  				"to_campus": extractColumn(content, "metro to campus", 1)
	  			}
	  		}
	  		console.log("parsed shuttle data")
		})
	}
	answer (options, id) {
		if (!this.shuttleData) {
			return Promise.resolve("no data :/")
		}
		if (!options.to) {
			options = {to: "delhi"}
		}

		const now = DateUtils.dateWithTimeZone(new Date(), 5.5)
		const day = now.getDay()

		let str = "."
		switch (options.to.toLowerCase()) {
			case "delhi":

			let data
			let title
			if (isWeekend(day)) { // if it's a saturday or sunday
				data = this.shuttleData["weekend"]
				title = "Today -- Weekend Schedule"
			} else {
				data = this.shuttleData["weekday"]
				title = "Today -- Weekday Schedule"
			}

			const arr = [
				"*" + title + "*",
				"*Campus to Metro:*",
				makeNbyNString(data["from_campus"], 3, formatHour),
				"",
				"*Metro to Campus:*",
				makeNbyNString(data["to_campus"], 3, formatHour)
			]
			str = arr.join("\n")

			break
			default:
			return Promise.reject("shuttle option '" + options[0] + "' not available -- available options are delhi & parker")
			break
		}

		return Promise.resolve(str)
	}
	nextShuttle (options, id) {
		if (!this.shuttleData) {
			return Promise.resolve("no data :/")
		}

		if (!options.to) {
			options = {to: "delhi"}
		}

		const now = DateUtils.dateWithTimeZone(new Date(), 5.5)
		let day = now.getDay()

		const nowMinute = now.getHours()*60 + now.getMinutes()

		let str = ""

		let shuttleData = this.shuttleData
		let key
		if (["delhi", "metro", "jahangirpuri"].includes(options.to.toLowerCase())) {
			key = "from_campus"
		} else if (["ashoka", "campus"].includes(options.to.toLowerCase())) {
			key = "to_campus"
		} else {
			return Promise.reject("No data for shuttle going to '" + options.to + "'; options available -- delhi, campus")
		}

		let data = shuttleData[isWeekend(day) ? "weekend" : "weekday"][key]

		let reply = [
			"*" + (key === "from_campus" ? "Campus to Metro" : "Metro to Campus") + "*",
		]

		for (var i = 0; i < data.length;i++) {
			if (data[i] > nowMinute) {
				
				const arr = data.slice(i, i+3).map ((h,j) => (" " + (j+1) + ". " + formatHour(h)))
				reply.push( ...arr )
				break
			}
		}

		if (reply.length < 4) {
			reply.push("")
			reply.push("*Tomorrow*\n")

			day = (day+1) % 7
			
			data = shuttleData[isWeekend(day) ? "weekend" : "weekday"][key]
			reply.push( ...data.slice(0, 3).map ((h,i) => (" " + (i+1) + ". " + formatHour(h))) )
		}
		str = reply.join("\n")

		return Promise.resolve(str)
	}

}