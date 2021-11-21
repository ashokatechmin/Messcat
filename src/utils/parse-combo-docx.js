const mammoth = require('mammoth')

/**
 * Takes in path to the combo .docx and parses it
 * @param {string} comboDocxFile path to the combo docx
 */
const parseComboDocx = async(comboDocxFile) => {
	const result = await mammoth.extractRawText({ path: comboDocxFile })
	const lines = result.value.toLowerCase().split('\n')
	
	const combo = {}
	let key = ''

	for(let line of lines) {
		line = line
			.replace(/\s{2,}/g, s => s[0])
			.trim()
		if(!line) continue
		if(line.includes('combo')) {
			// if the previous key had no items
			// remove it
			if(!combo[key]?.length) {
				delete combo[key]
			}
			key = line
			combo[key] = combo[key] || []
			continue
		}

		combo[key].push(line)
	}

	return combo
}

module.exports = {
	parseComboDocx
}