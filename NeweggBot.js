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

async function addToCart(page) {
	try {
		await page.goto(config.url, { timeout: 5000 })
	} catch (err) {
		logger.error(err)
		return false
	}

	const buttonSelector = '#ProductBuy > div > div:nth-child(2) > button'
	try {
		//find a non disabled subtotal button, if none is found then errors out
		await page.waitForSelector(buttonSelector, { timeout: 2000 })
	} catch (err) {
		logger.error(err)
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
	let buttonSelector = '#app > div.page-content > section > div > div > form > div.row-inner > div.row-side > div > div > div.summary-content.width-100 > div > button'
	try {
		await page.goto('https://secure.newegg.com/shop/cart', { timeout: 5000 })
		await page.waitForSelector(buttonSelector, { timeout: 2000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await page.click(buttonSelector)

	buttonSelector = '#signin-signin-wrap > div > div.signin-body > div > div > div > form:nth-child(3) > div.form-cells > div > button'
	try {
		await page.waitForSelector(buttonSelector, { timeout: 3000 })
		await new Promise(r => setTimeout(r, 500))
	} catch (err) {
		logger.error(err)
		return false
	}
	await page.click(buttonSelector)

	let inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(1) > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 3000 })
		await page.evaluate((inputSelector, name) =>
			document.querySelector(inputSelector).value = name
			, inputSelector, config.name)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(9) > label.address-autocomplete-box.is-wide > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.evaluate((inputSelector, city) =>
			document.querySelector(inputSelector).value = city
			, inputSelector, config.city)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(10) > label.form-select.is-wide > select'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.select(inputSelector, config.state)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(11) > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.evaluate((inputSelector, street) =>
			document.querySelector(inputSelector).value = street
			, inputSelector, config.zip)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(12) > div > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.click(inputSelector)
		await page.type(inputSelector, config.phone)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(15) > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.evaluate((inputSelector, email) =>
			document.querySelector(inputSelector).value = email
			, inputSelector, config.email)
	} catch (err) {
		logger.error(err)
		return false
	}

	// Input street address in the end because it will cause dropdown menu which might shift page focus
	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(5) > label.address-autocomplete-box.is-wide > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.evaluate((inputSelector, street) =>
			document.querySelector(inputSelector).value = street
			, inputSelector, config.street)
	} catch (err) {
		logger.error(err)
		return false
	}

	buttonSelector = '#shippingItemCell > div > div.checkout-step-action > button'
	try {
		await page.waitForSelector(buttonSelector, { timeout: 2000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await page.click(buttonSelector)

	// Continue as guest
	buttonSelector = '#app > div > div > div > div > div.modal-footer > button.button.bg-orange.button-m'
	try {
		await page.waitForSelector(buttonSelector, { timeout: 3000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await page.click(buttonSelector)

	// Use this address button
	buttonSelector = '#app > div > div > div > div > div.modal-footer > button.button.bg-orange.button-m'
	try {
		await page.waitForSelector('#app > div > div > div > div > div.modal-body > div:nth-child(3) > div > div > label > address', { timeout: 3000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await page.click(buttonSelector)

	// Begin payment
	buttonSelector = '#app > div > section > div > div > div > div.row-body > div > div.item-cell.checkout-payment > div > div.checkout-step-body > div > div > div > div.checkout-payment-card > div.checkout-add-button > button'
	try {
		await page.waitForSelector(buttonSelector, { timeout: 3000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	// The button is not clickable immediately after it is visible, wait 0.5s
	await new Promise(r => setTimeout(r, 1000))
	await page.click(buttonSelector)

	let paymentFrame
	let paymentFrameSelector = '#app > div > div > div > div > div > iframe'
	try {
		const frameHandle = await page.waitForSelector(paymentFrameSelector, { timeout: 3000 })
		paymentFrame = await frameHandle.contentFrame()
		// Wait for the frame to load
		await new Promise(r => setTimeout(r, 1000))
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(3) > label > select'
	try {
		await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
		await paymentFrame.click(inputSelector)
		await paymentFrame.select(inputSelector, config.ccm)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(4) > label > select'
	try {
		await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
		await paymentFrame.click(inputSelector)
		await paymentFrame.select(inputSelector, config.ccy)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(1) > input'
	try {
		await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
		await paymentFrame.click(inputSelector)
		await paymentFrame.type(inputSelector, config.name)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(2) > input'
	try {
		await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
		await paymentFrame.click(inputSelector)
		await paymentFrame.type(inputSelector, config.ccn)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(5) > input'
	try {
		await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
		await paymentFrame.click(inputSelector)
		await paymentFrame.type(inputSelector, config.cvv, { delay: 100 })
	} catch (err) {
		logger.error(err)
		return false
	}

	buttonSelector = '#app > div > div.modal-footer > button'
	try {
		await paymentFrame.waitForSelector(buttonSelector, { timeout: 2000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await paymentFrame.click(buttonSelector)

	try {
		await page.waitForSelector('#btnCreditCard:not([disabled])', { timeout: 3000 })
	} catch (err) {
		logger.error(err)
		return false
	}
	await new Promise(r => setTimeout(r, 500))
	await page.click('#btnCreditCard')

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
		defaultViewport: { width: 1920, height: 1080 },
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