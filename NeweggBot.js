const puppeteer = require('puppeteer-extra')
const stealthPlugin = require('puppeteer-extra-plugin-stealth')
const readline = require("readline")
const log4js = require("log4js")
const config = require('./config.json')

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
		await page.evaluate((inputSelector, name) => {
			document.querySelector(inputSelector).value = name;
		}, inputSelector, config.name)
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(9) > label.address-autocomplete-box.is-wide > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.evaluate((inputSelector, city) => {
			document.querySelector(inputSelector).value = city;
		}, inputSelector, config.city)
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
		await page.evaluate((inputSelector, street) => {
			document.querySelector(inputSelector).value = street;
		}, inputSelector, config.zip)
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
		await page.evaluate((inputSelector, email) => {
			document.querySelector(inputSelector).value = email;
		}, inputSelector, config.email)
	} catch (err) {
		logger.error(err)
		return false
	}

	// Input street address in the end because it will cause dropdown menu which might shift page focus
	inputSelector = '#shippingItemCell > div > div.checkout-step-body > div > div > div > div > form > div.form-cells > div:nth-child(5) > label.address-autocomplete-box.is-wide > input'
	try {
		await page.waitForSelector(inputSelector, { timeout: 2000 })
		await page.evaluate((inputSelector, street) => {
			document.querySelector(inputSelector).value = street;
		}, inputSelector, config.street)
	} catch (err) {
		logger.error(err)
		return false
	}

	// Use this address button
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
		await page.waitForSelector(buttonSelector, { timeout: 2000 })
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
	await new Promise(r => setTimeout(r, 500))
	await page.click(buttonSelector)


	let paymentFrame
	let paymentFrameSelector = '#app > div > div > div > div > div > iframe'
	try {
		const frameHandle = await page.waitForSelector(paymentFrameSelector, { timeout: 3000 })
		paymentFrame = await frameHandle.contentFrame();
	} catch (err) {
		logger.error(err)
		return false
	}

	inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(1) > input'
	try {
		await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
		console.log("wtfffaaa")
		await paymentFrame.focus(inputSelector)
		console.log("wtfffbbb")
		const rev = await paymentFrame.evaluate(() => {
			console.log("wtfffccc")
			return 'wtf'
			// while (document.querySelector(inputSelector).value != name) {
			// 	document.querySelector(inputSelector).value = name;
			// 	console.log(document.querySelector(inputSelector).value)
			// }
		});
		console.log(rev)
		await paymentFrame.focus(inputSelector)
		console.log("wtfffddd")
	} catch (err) {
		logger.error(err)
		return false
	}

	// inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(2) > input'
	// try {
	// 	await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
	// 	await paymentFrame.evaluate((inputSelector, ccn) => {
	// 		document.querySelector(inputSelector).value = ccn;
	// 	}, inputSelector, config.ccn);
	// } catch (err) {
	// 	logger.error(err)
	// 	return false
	// }

	// inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(3) > label > select'
	// try {
	// 	await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
	// 	await paymentFrame.evaluate((inputSelector, ccm) => {
	// 		document.querySelector(inputSelector).value = ccm;
	// 	}, inputSelector, config.ccm);
	// 	// await paymentFrame.click(inputSelector, { timeout: 2000 })
	// 	// await paymentFrame.select(inputSelector, config.ccm)
	// } catch (err) {
	// 	logger.error(err)
	// 	return false
	// }

	// inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(4) > label > select'
	// try {
	// 	await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
	// 	await paymentFrame.evaluate((inputSelector, ccy) => {
	// 		document.querySelector(inputSelector).value = ccy;
	// 	}, inputSelector, config.ccy);
	// 	// await paymentFrame.click(inputSelector, { timeout: 2000 })
	// 	// await paymentFrame.select(inputSelector, config.ccy)
	// } catch (err) {
	// 	logger.error(err)
	// 	return false
	// }

	// inputSelector = '#app > div > div.modal-body.scrollbar > div:nth-child(1) > div:nth-child(5) > input'
	// try {
	// 	await paymentFrame.waitForSelector(inputSelector, { timeout: 2000 })
	// 	await paymentFrame.evaluate((inputSelector, cvv) => {
	// 		document.querySelector(inputSelector).value = cvv;
	// 	}, inputSelector, config.cvv);
	// } catch (err) {
	// 	logger.error(err)
	// 	return false
	// }

	// buttonSelector = '#app > div > div.modal-footer > button'
	// try {
	// 	await paymentFrame.waitForSelector(buttonSelector, { timeout: 2000 })
	// } catch (err) {
	// 	logger.error(err)
	// 	return false
	// }
	// await paymentFrame.click(buttonSelector)

	// await page.waitForSelector('#btnCreditCard:not([disabled])', { timeout: 3000 })
	// await new Promise(r => setTimeout(r, 500))
	// await page.click('#btnCreditCard')

	return true
}

async function run() {
	puppeteer.use(stealthPlugin())
	const browser = await puppeteer.launch({
		defaultViewport: { width: 1920, height: 1080 },
		userDataDir: "./myDataDir",
		executablePath: config.browser_executable_path,
		headless: false,
	})

	const [page] = await browser.pages()
	await page.setCacheEnabled(true)

	const rl = readline.createInterface({
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