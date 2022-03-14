const { fetchLatestDiningMenu } = require('./fetch-dining-menus')
const { writeDiningMenu } = require('./write-dining-menu')

const download = async() => {
	const { messMenuFilename, comboMenuFilename } = await fetchLatestDiningMenu()
	await writeDiningMenu(messMenuFilename, comboMenuFilename)
}
download()