const DateUtils = require('../DateUtils.js')
const PDFExtract = require('pdf.js-extract').PDFExtract
const fs = require('fs')

String.prototype.toTitleCase = function () {
	var str2 = ""
	for (var i = 0; i < this.length; i++) {
		const char = this.charAt(i)
		str2 += (i === 0 || this.charAt(i-1).trim() === "") ? char.toUpperCase() : char.toLowerCase()
	}
	return str2
}

const mealOptions = [ "breakfast", "lunch", "snacks", "dinner" ]
const mealMetrics = {
	"breakfast": "bournvita",
	"lunch": "green salad",
	"dinner": "green salad",
	"snacks": "tea, coffee"
}
const diningFileName = "./dining_data.json"

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
            examples: ["what's for lunch", "mess menu", "dinner tomorrow", "abe useless, what is for dinner tomorrow"]
        }
        
        this.mealsData = {}
		this.loadMealsData()
    }
    loadMealsData () {
		try {
			let str = fs.readFileSync(diningFileName)
			this.mealsData = JSON.parse(str)
		} catch (error) {

		}
	}
	saveMealsData () {
		let str = JSON.stringify(this.mealsData, null, "\t")
		fs.writeFile(diningFileName, str, (err) => {
  			if (err) { throw err }
  			console.log('saved data file')
		})
	}
	parseMealsData (fromDate, diningFile, comboFile) {

		const extractMeals = function (content, columnName, distanceArr) {
			let ySizes = []
			let x0 = 0.0
			let y0 = 0.0

			for (var i in content) {
				const str = content[i].str.toLowerCase()//.replace(/\s/g, "")
				
				if (y0 === 0.0 && str === distanceArr[0]) {
					y0 = content[i].y
					x0 = content[i].x
				} else if (y0 > 0.0 && str === distanceArr[1] && Math.abs(x0-content[i].x) < 10 ) {
					ySizes.push( content[i].y-y0 )
					y0 = content[i].y
				}
			}
			let ySize = Math.min.apply(0, ySizes)+1
			console.log(ySizes)
			ySize = 96.2

			let xPos = 0.0
			let curY = 0.0
			let lastY = 0.0

			let firstY = 0.0

			let rows = 0
			var data = []
			for (var i in content) {
				const str = content[i].str.toLowerCase()//.replace(/\s/g, "")
				
				if (str === columnName && xPos === 0.0) {
					xPos = content[i].x
					continue
				}
				
  				if (xPos > 0.0 && Math.abs(content[i].x-xPos) < 35) {
					rows += 1
					
					if (rows > 1) {
						if (content[i].y >= curY+ySize-1 || curY === 0) {
							if (firstY === 0.0) {
								firstY = content[i].y
								curY = content[i].y
							} else {
								curY += ySize //Math.ceil((content[i].y-firstY)/ySize)*ySize
							}

							
							lastY = 0.0
							data.push([])
						}

						if (content[i].y > lastY) {
							data[data.length-1].push( str.toTitleCase() )
							lastY = content[i].y
						}
					}
					//console.log( content[i].str + "," + content[i].y)
  				}
  			}
  			return data
		}

		new PDFExtract().extract(diningFile, {}, (err, data) => {
  			if (err) {
  				console.log("error in loading dining menu: " + err)
  				return
  			}
  			
  			const content = data.pages[0].content
  			mealOptions.forEach(key => {
  				if (!this.mealsData[key]) {
  					this.mealsData[key] = { }
  				}

  				let extractedData = extractMeals(content, key, [ mealMetrics[key], mealMetrics[key] ])
  				
  				for (var i in extractedData) {
  					const date = DateUtils.dateString(DateUtils.offsetting(fromDate, 24*i))
  					this.mealsData[key][date] = extractedData[i]
  				}
  			})
  			console.log("parsed dining menu")
  			this.parseComboData(fromDate, comboFile)
  		})
	}
	parseComboData (fromDate, comboFile) {

		new PDFExtract().extract(comboFile, {}, (err, data) => {
  			if (err) {
				  console.log("error in loading combo menu: " + err)
				  this.saveMealsData()
  				return
  			}
  			
  			const content = data.pages[0].content
  			var data = {}

  			var prevY = 0
  			var lines = [ "" ]
  			for (var i in content) {
  				const curStr = content[i].str.toLowerCase()
  				if (prevY === 0) {
  					prevY = content[i].y
  				}
  				if (Math.abs(content[i].y-prevY) === 0) {
  					lines[lines.length-1] += curStr
  				} else if (curStr !== " ") {
  					lines.push(curStr)
  					prevY = content[i].y
  				}
  			}
  			//console.log(lines)

  			var curKey = ""
  			lines.forEach(line => {
  				if (line.includes("combos")) {
  					curKey = line
  					data[curKey] = []
  				} else if (data[curKey]) {
  					data[curKey].push(line)
  				}

  			})

  			let week = "wk_" + DateUtils.weekOfYear(fromDate, 1)
  			if (!this.mealsData["combo"]) {
  				this.mealsData["combo"] = {}
  			}
  			this.mealsData["combo"][week] = data

  			console.log("parsed combo menu")

  			this.saveMealsData()
 		})
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