const { promises: fs } = require('fs')
const path = require('path')
const { writeDiningMenu } = require('./write-dining-menu')

const LOCAL_DIR = './local-data'

const downloadDiningMenuLocal = async() => {
	const files = await fs.readdir(LOCAL_DIR)
	let messMenuFilename = ''
	let comboMenuFilename = ''
	for(const file of files) {
		if(file.toLocaleLowerCase().includes('dining')) {
			messMenuFilename = path.join(LOCAL_DIR, file)
		} else if(file.toLocaleLowerCase().includes('combo')) {
			comboMenuFilename = path.join(LOCAL_DIR, file)
		}
	}

	await writeDiningMenu(messMenuFilename, comboMenuFilename)
}

downloadDiningMenuLocal()