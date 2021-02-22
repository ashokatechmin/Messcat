const PDFParser = require("pdf2json")

const parseMessMenu = (messPdfFile) => {
	const pdfParser = new PDFParser()
	const mealOptions = [ 'breakfast', 'lunch', 'snacks', 'dinner' ]

	return new Promise((resolve, reject) => {
		/**
		 * @param {{ x: number, y: number, w: number, l: number }[]} hLines 
		 * @param {{ x: number, y: number, sw: number, w: number, R: { T: string }[] }[]} texts 
		 */
		const sliceIntoRows = (hLines, texts) => {
			hLines = [...hLines].sort(({ y: y0 }, { y: y1 }) => y0-y1)
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
			vLines = [...vLines].sort(({ x: x0 }, { x: x1 }) => x0-x1).filter(item => item.l > 40)
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
			return cells
		}
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
		const dateString = (date, offsetDays) => (
			new Date(date.getTime() + offsetDays*24*60*60*1000).toString().slice(4, 15)
		)
		const parseData = (pdfData) => {
			const { formImage: { Pages: [page] } } = pdfData
			const { VLines, HLines, Texts } = page
			const grid = sliceIntoGrid(HLines, VLines, Texts)
			
			const [datesItem] = grid[1].find(item => item[0]?.includes('-'))
			const [startDate, endDate] = datesItem.split('-')
			const fullDateStr = startDate + ' ' + endDate.split(' ').slice(-1)[0]
			const date = parseDate(fullDateStr)
			
			const data = {}
			for(const meal of mealOptions) {
				const idx = grid[2].findIndex(item => item[0]?.toLocaleLowerCase()?.trim() === meal)
				// grid[2] => meal options
				// grid[3] => meal timing
				data[meal] = grid.slice(4, -1).reduce((data, value, i) => (
					{ 
						...data, 
						[dateString(date, i)]: value[idx].map(item => item.toLocaleLowerCase().trim())
					}
				), { timings: grid[3][idx][0] })
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