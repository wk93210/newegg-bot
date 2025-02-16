import puppeteer from 'puppeteer-extra'
import stealthPlugin from 'puppeteer-extra-plugin-stealth'
import { createInterface } from "readline"
import log4js from "log4js";
import config from './config-lli.json' with { type: "json" }

log4js.configure({
	appenders: {
		out: { type: 'stdout' },
		app: { type: 'file', filename: 'application.log' }
	},
	categories: {
		default: { appenders: ['out', 'app'], level: 'trace' }
	}
})

const logger = log4js.getLogger("Newegg Shopping Bot")
logger.level = "trace"

async function clearCart(page) {
	try {
		await page.goto("https://secure.newegg.com/shop/cart", { timeout: 5000 })
	} catch (err) {
		logger.error(err)
		return false
	}

	while (true) {
		try {
			await page.waitForSelector("#app > div.page-content > section > div > div > form > div.row-inner > div.row-body > div.empty-cells", { timeout: 2000 })
			break
		} catch (err) {
			let buttonSelector = '#cart-top > div.row-top-left.flex-wrap.width-100 > div > button:nth-child(2)'
			try {
				//find a non disabled subtotal button, if none is found then errors out
				await page.waitForSelector(buttonSelector, { timeout: 2000 })
			} catch (err) {
				logger.error(err)
				return false
			}
			await page.click(buttonSelector)

			buttonSelector = '#app > div.page-content > div.modal.show.fade > div > div > div.modal-footer > button.btn.btn-primary'
			try {
				//find a non disabled subtotal button, if none is found then errors out
				await page.waitForSelector(buttonSelector, { timeout: 2000 })
			} catch (err) {
				logger.error(err)
				return false
			}
			await page.click(buttonSelector)
		}
	}

	return true
}

async function addToCart(page) {
	try {
		await page.goto(config.wishlist, { timeout: 3000 })
	} catch (err) {
		logger.error(err)
		return false
	}

	const buttonSelector = '#app > div.page-content > section > div > div.grid-wrap > div.col-4 > div > div > div.wishlist-side-action > div > div > button:not([disabled])'
	try {
		//find a non disabled subtotal button, if none is found then errors out
		await page.waitForSelector(buttonSelector, { timeout: 2000 })
	} catch (err) {
		logger.error('Add to cart button not available...')
		return false
	}
	await page.click(buttonSelector)

	const modalSelector = '#modal-intermediary > div'
	try {
		await page.waitForSelector(modalSelector, { timeout: 2000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	return true
}

async function checkout(page) {
	let buttonSelector = '#modal-intermediary > div > div > div.modal-body.auto-height > div.item-actions > button.btn.btn-undefined.btn-primary'
	try {
		await page.waitForSelector(buttonSelector, { timeout: 2000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await page.click(buttonSelector)

	let inputSelector = '#app > div > section > div > div > div > div.row-body > div > div.item-cell.checkout-payment > div > div.checkout-step-body > div:nth-child(1) > div > label > div > div.retype-security-code > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.click(inputSelector)
		await page.type(inputSelector, config.cvv, { delay: 100 })
	} catch (err) {
		logger.error(err)
		return false
	}

	try {
		await page.waitForSelector('#btnCreditCard:not([disabled])', { timeout: 3000 })
	} catch (err) {
		logger.error(err)
		return false
	}

	if (config.buy) {
		await new Promise(r => setTimeout(r, 500))
		await page.click('#btnCreditCard')
	}
	return true
}

async function run() {
	puppeteer.use(stealthPlugin())
	const browser = await puppeteer.launch({
		args: [
			'--disable-web-security',
			'--disable-features=IsolateOrigins',
			'--disable-site-isolation-trials'
		],
		executablePath: config.browser_executable_path,
		headless: false,
		userDataDir: "./myDataDir",
	})

	const [page] = await browser.pages()
	await page.setCacheEnabled(true)

	const rl = createInterface({
		input: process.stdin,
		output: process.stdout
	})

	await page.goto('https://www.newegg.com')
	console.log('You have 30 seconds to login to your Newegg account in the browser window that just opened.')
	await new Promise(r => setTimeout(r, 30000))

	let isClearCartSuccessful = false;
	while (!isClearCartSuccessful) {
		isClearCartSuccessful = await clearCart(page)
	}

	let isAddToCartSuccessful = false;
	while (!isAddToCartSuccessful) {
		await new Promise(r => setTimeout(r, config.refresh_time * 1000 + 5 * Math.random() * 1000))
		isAddToCartSuccessful = await addToCart(page)
	}

	let isCheckoutSuccessful = false;
	while (!isCheckoutSuccessful) {
		isCheckoutSuccessful = await checkout(page)
	}

	rl.close()
}

run()