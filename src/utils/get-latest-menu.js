const fetch = require("node-fetch")
const localMenuData = require('../intents/data/dining_data.json')

const MENU_URL = 'https://raw.githubusercontent.com/ashokatechmin/Messcat/master/src/intents/data/dining_data.json'

const getLatestMenu = async() => {
	let menuData = localMenuData
	try {
		const response = await fetch(MENU_URL)
        menuData = await response.json()
	} catch(error) {
		console.error(`error in fetching latest menu, using local copy. Error: ${error}`)
	}
	return menuData
}

module.exports = getLatestMenu