const excelToJson = require('convert-excel-to-json')
/**
 * Takes in path to the dining xlsx and parses it
 * @param {string} messPdfFile path to the mess xlsx
 */
const parseMessMenu = (filename) => {
	const DAYS_OF_WEEK = [
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
		'sunday'
	]
	/** parses a date. Eg. input 01 Aug 2020 */
	const parseDate = (dateStr) => {
		const months = [
			'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
		]
		const [day, month, year] = dateStr.split(' ')

		const date = new Date(
			+year,
			months.findIndex(item => month.toLocaleLowerCase().includes(item)),
			+day.replace(/[^0-9]/gi, ''),
			10
		)
		return date
	}
	/** nice little formatted date string offset by a few days */
	const dateString = (date, offsetDays) => (
		new Date(date.getTime() + offsetDays*24*60*60*1000).toString().slice(4, 15)
	)
	/** get the menu for a specific option (breakfast, lunch, etc) */
	const getMenu = (option) => {
		const optionIdx = Object.keys(sheet[mealsIdx]).find(key => sheet[mealsIdx][key].toLowerCase().includes(option))
		if(!optionIdx) {
			throw new Error(`could not find menu for "${option}"`)
		}
		const timings = sheet[mealsIdx+1][optionIdx]

		let currentOffset = -1
		const data = {}
		for(let i = mealsIdx+2;i < sheet.length;i++) {
			const row = sheet[i]
			if(row.A && DAYS_OF_WEEK.includes(row.A.toLocaleLowerCase())) currentOffset += 1 // increase offset when the first column has a value, eg "MONDAY", "TUESDAY"
			if(!row[optionIdx]) continue // if no row, exit
			if(currentOffset >= 7) break // break on more than a week's data

			const key = dateString(date, currentOffset)
			data[key] = data[key] || []
			
			data[key].push(row[optionIdx])
		}
		return { timings, ...data }
	}
	const mealOptions = [ 'breakfast', 'lunch', 'snacks', 'dinner' ]
	const json = excelToJson({
		sourceFile: filename,
	})
	const [sheet] = Object.values(json)
	// find the date
	const datesItem = Object.values(sheet[0]).find(item => item?.includes('-'))
	let [startDate, endDate] = datesItem
									.replace(/,/gi, ' ') // replace commas with space to make it easier to parse
									.replace(/([A-Z]{1}(?![A-Z])(?!$))/g, ' $1') // add spaces if no spaces exist
									.replace(/[\s]{2,}/gi, ' ') // replace extra spaces
									.replace(' - ', '-') // remove space
									.split('-')
	startDate = startDate.split('(').slice(-1)[0]
	endDate = endDate.split(')')[0]
	// the full date
	const fullDateStr = startDate + ' ' + endDate.split(' ').slice(-1)[0]
	const date = parseDate(fullDateStr)

	const mealsIdx = sheet.findIndex(item => (
		Object.keys(item).find(key => (
			item[key].toLowerCase().includes('meals')
		))
	))
	if(!mealsIdx) throw new Error('Did not find meals index')

	return mealOptions.reduce((dict, option) => (
		{ ...dict, [option]: getMenu(option) }
	), {})
}
module.exports = {
	parseMessMenu
}