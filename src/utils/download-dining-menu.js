const {promises: fs} = require('fs')
const { fetchLatestDiningMenu } = require('./fetch-dining-menus')
const { parseMessMenu } = require('./parse-dining-xlsx')

let menu = { }
try {
	menu = require('../intents/data/dining_data.json')
} catch {

}


const download = async() => {
	const { messMenuFilename } = await fetchLatestDiningMenu()
	const messMenu = await parseMessMenu(messMenuFilename)

	console.log(
		'updated dining menu for ', 
		Object.keys(messMenu.breakfast).filter(t => t != 'timings')[0]
	)

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
download()