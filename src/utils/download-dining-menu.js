const {promises: fs} = require('fs')
const { fetchLatestDiningMenu } = require('./fetch-dining-menus')
const { parseMessMenu } = require('./parse-dining-menu')

const download = async() => {
	const { messMenuFilename } = await fetchLatestDiningMenu()
	const messMenu = await parseMessMenu(messMenuFilename)

	console.log(
		'updated dining menu for ', 
		Object.keys(messMenu.breakfast).filter(t => t != 'timings')[0]
	)
	await fs.writeFile(
		'./src/intents/data/dining_data.json',
		JSON.stringify(messMenu, undefined, '\t')
	)
}
download()