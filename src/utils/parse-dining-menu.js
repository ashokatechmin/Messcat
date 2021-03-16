const PDFParser = require("pdf2json")

/**
 * Takes in path to the dining pdf and parses it
 * @param {string} messPdfFile path to the mess pdf
 */
const parseMessMenu = (messPdfFile) => {
	const pdfParser = new PDFParser()
	const mealOptions = [ 'breakfast', 'lunch', 'snacks', 'dinner' ]

	console.log('loading from ', messPdfFile)

	return new Promise((resolve, reject) => {
		/**
		 * @param {{ x: number, y: number, w: number, l: number }[]} hLines 
		 * @param {{ x: number, y: number, sw: number, w: number, R: { T: string }[] }[]} texts 
		 */
		const sliceIntoRows = (hLines, texts) => {
			// sort lines in ascending order of y position (top => bottom)
			hLines = [...hLines].sort(({ y: y0 }, { y: y1 }) => y0-y1)
			// find all pieces of text that fit into two lines
			const rows = hLines.map((value, i) => {
				const prevY = hLines[i-1]?.y || 0
				const curY = value.y
				const row = texts
								.filter(({ y, sw }) => {
									const yPos = y+sw
									return yPos <= curY && yPos > prevY
								})
								.map(t => ({ x: t.x, w: t.w, texts: t.R.map(r => r.T) }))
				return row
			})
			return rows
		}
		/**
		 * @param {{ x: number, y: number, w: number, l: number }[]} hLines 
		 * @param {{ x: number, y: number, w: number, l: number }[]} vLines 
		 * @param {{ x: number, y: number, sw: number, w: number, R: { T: string }[] }[]} texts 
		 */
		const sliceIntoGrid = (hLines, vLines, texts) => {
			const rows = sliceIntoRows(hLines, texts)
			// sort lines in ascending order of x position (left => right)
			vLines = [...vLines].sort(({ x: x0 }, { x: x1 }) => x0-x1).filter(item => item.l > 40)
			// slice the rows into their respective cells
			const cells = rows.map(row => (
				vLines.map((line, i) => {
					const prevX = vLines[i-1]?.x || 0
					const curX = line.x

					const cols = row
									.filter(({ x }) => (
										x <= curX && x > prevX
									))
									.map(item => (
										// for some reason the text is URI encoded
										decodeURIComponent(item.texts[0])
									))
					return cols
				})
			))
			return cells.filter(item => ( // filter empty rows
				item.find(cell => !!cell.length)
			))
		}
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
		/** actually parse the pdf data */
		const parseData = (pdfData) => {
			// get the first page of the pdf
			const { formImage: { Pages: [page] } } = pdfData
			
			let { VLines, HLines, Texts, Fills } = page
			if(!HLines.length || !VLines.length) { // lines are probably fills here :/
				// make do with fills
				// if lines are detected as fills
				console.log('hlines/vlines missing')
				if(!Fills.length) {

					throw new Error('fills, hlines, vlines missing from menu -- cannot construct grid')
				} 
				HLines = Fills.filter(item => item.h <= 1) // lines are fills less than 1 unit thick
				VLines = Fills.filter(item => item.w <= 1).map(item => (
					{ ...item, l: item.h }
				))
			}
			// make the grid from the lines
			const grid = sliceIntoGrid(HLines, VLines, Texts)
			
			// find the date
			const [datesItem] = grid[0].find(item => item[0]?.includes('-'))
			const [startDate, endDate] = datesItem
											.replace(/,/gi, ' ') // replace commas with space to make it easier to parse
											.replace(/([A-Z]{1}(?![A-Z])(?!$))/g, ' $1') // add spaces if no spaces exist
											.replace(/[\s]{2,}/gi, ' ') // replace extra spaces
											.replace(' - ', '-') // remove space
											.split('-')
			// the full date
			const fullDateStr = startDate + ' ' + endDate.split(' ').slice(-1)[0]
			const date = parseDate(fullDateStr)
			
			const data = {}
			for(const meal of mealOptions) {
				const idx = grid[1].findIndex(item => item[0]?.toLocaleLowerCase()?.trim() === meal)
				// grid[1] => meal options
				// grid[2] => meal timing
				data[meal] = grid.slice(3, -1).reduce((data, value, i) => (
					{ 
						...data, 
						[dateString(date, i)]: value[idx].map(item => item.toLocaleLowerCase().trim())
					}
				), { timings: grid[2][idx][0] })
			}
			resolve(data)
		}
		pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError))
		pdfParser.on("pdfParser_dataReady", parseData)
		pdfParser.loadPDF(messPdfFile)
	})
}

module.exports = {
	parseMessMenu
}