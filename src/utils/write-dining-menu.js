const { promises: fs } = require('fs')
const { parseMessMenu } = require('./parse-dining-xlsx')

let menu = { }
try {
	menu = require('../intents/data/dining_data.json')
} catch {

}

module.exports.writeDiningMenu = async(messMenuFilename, comboMenuFilename) => {
	const messMenu = await parseMessMenu(messMenuFilename, comboMenuFilename)
	// which date the menu was parsed for
	const menuDate = Object.keys(messMenu.breakfast).filter(t => t != 'timings')[0]
	// print which date menu was parsed for
	// we one can be sure it worked
	console.log('updated dining menu for ', menuDate)
	// get all keys present in the old and new menu
	const keys = Array.from(
		new Set([
			...Object.keys(menu),
			...Object.keys(messMenu),
		])
	)
	keys.forEach(m => {
		messMenu[m] = {
			...(menu[m] || { }),
			...(messMenu[m] || { })
		}
	})

	await fs.writeFile(
		'./src/intents/data/dining_data.json',
		JSON.stringify(messMenu, undefined, '\t')
	)
}