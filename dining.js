// USAGE: node dining.js [today/(dd/mm/yyyy)] [-download/] [-shed]

const Dining = require("./intents/meals.js")
const DateUtils = require("../DateUtils.js")
const fetch = require('node-fetch')
const fs = require('fs')

const comboMenuURL = "https://my.ashoka.edu.in/SIS/UploadedFile/AppFiles/Dining-Services/SS00000073.pdf"
const messMenuURL = "https://my.ashoka.edu.in/SIS/UploadedFile/AppFiles/Dining-Services/SS00000072.pdf"

const comboFileURL = "combo.pdf"
const messFileURL = "mess.pdf"

let args = process.argv
let shouldDownload = false
if (args.length === 4) {
	if (args[args.length-1] === "-download") {
		shouldDownload = true
		args.pop()
	} else {
		console.error("unknown option: " + args[args.length-1])
		return
	}
}

let date = new Date()
if (args.length === 3) {
	const startDate = args[args.length-1]
	if (startDate !== "today") {
		const [day, month, year] = startDate.split("/")
		date = new Date(parseInt(year), parseInt(month)-1, parseInt(day))
	}
}

date = DateUtils.dateWithTimeZone(date, 5.5)
console.log ("parsing for date: " + DateUtils.dateString(date))

if (shouldDownload) {
	console.log("downloading files...")

	fetch(comboMenuURL)
	.then (res => res.buffer() )
	.then (blob => fs.writeFileSync(comboFileURL, blob))
	.then (() => fetch(messMenuURL))
	.then (res => res.buffer() )
	.then (blob => fs.writeFileSync(messFileURL, blob))
	.then (() => new Dining().parseMealsData(date, messFileURL, comboFileURL) )
} else {
	new Dining().parseMealsData(date, messFileURL, comboFileURL)
}