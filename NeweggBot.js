const puppeteer = require('puppeteer')
const config = require('./config.json')
const log4js = require("log4js")

const logger = log4js.getLogger("Newegg Shopping Bot")
logger.level = "trace"

/**
 * Sign into wegg
 * @param {*} page The page containing the element
 */
async function signin(page) {
	if (page.url().includes('signin')) {
		await page.waitForSelector('button.btn.btn-orange')
		await page.type('#labeled-input-signEmail', config.email)
		await page.click('button.btn.btn-orange')
		await page.waitForTimeout(1500)
		try {
			await page.waitForSelector('#labeled-input-signEmail', { timeout: 500 })
		} catch (err) {
			try {
				await page.waitForSelector('#labeled-input-password', { timeout: 2500 })
				await page.waitForSelector('button.btn.btn-orange')
				await page.type('#labeled-input-password', config.password)
				await page.click('button.btn.btn-orange')
				await page.waitForTimeout(1500)
				try {
					await page.waitForSelector('#labeled-input-password', { timeout: 500 })
				} catch (passwordSelectorErr) {
					logger.trace("Logged in")
					return true
				}
			} catch (passwordInputErr) {
				logger.warn("Manual authorization code required by Newegg.  This should only happen once.")
				while (page.url().includes('signin')) {
					await page.waitForTimeout(500)
				}
				logger.trace("Logged in")
				return true
			}
		}
	} else if (page.url().includes("areyouahuman")) {
		await page.waitForTimeout(1000)
	}
	
	return false
}

/**
 * Check the wishlist and see if the "Add to Cart" button is disabled or not, then press it
 * @param {*} page The page containing the element
 */
async function check_wishlist(page) {
	try {
		//find a non disabled subtotal button, if none is found then errors out
		await page.waitForSelector('button.btn.btn-primary.btn-large.list-subtotal-button:not([disabled])', { timeout: 500 })
	} catch (err) {
		logger.error("No items found")
		var nextCheckInSeconds = config.refresh_time + Math.floor(Math.random() * Math.floor(config.randomized_wait_ceiling))
		logger.info(`The next attempt will be performed in ${nextCheckInSeconds} seconds`)
		await page.waitForTimeout(nextCheckInSeconds * 1000)
		return false
	}
	
	await page.click('button.btn.btn-primary.btn-large.list-subtotal-button')
	logger.info("Item(s) added to cart, checking cart")
	return true
}

/**
 * Check the cart and make sure the subtotal is within the max price
 * @param {*} page The page containing the element
 */
async function check_cart(page) {
	const amountElementName = ".summary-content-total"
	try {
		await page.waitForSelector(amountElementName, { timeout: 2000 })
		var amountElement = await page.$(amountElementName)
		var text = await page.evaluate(element => element.textContent, amountElement)
		var price = parseInt(text.split('$')[1])
		logger.info(`Subtotal of cart is ${price}`)

		if (price > config.price_limit) {
			if (config.over_price_limit_behavior === "stop") {
				logger.error("Price exceeds limit, ending Newegg Shopping Bot process")
				while (true) {
					
				}
			} else if (config.over_price_limit_behavior === "remove") {
				logger.error("Price exceeds limit, removing from cart")
				var button = await page.$$('button.btn.btn-mini')
				while (true) {
					try {
						await button[1].click()
					} catch (err) {
						break
					}
				}
			} else {
				logger.error("Price exceeds limit")
			}
			
			return false
		}
		
		logger.info("Cart checked, attempting to purchase")
		return true
	} catch (err) {
		logger.error(err.message)
		return false
	}
}

/**
 * Input the Credit Verification Value (CVV)
 * @param {*} page The page containing the element
 */
async function inputCVV(page) {
	while (true) {
		logger.info("Waiting for CVV input element")
		try {
			await page.waitForSelector("[placeholder='CVV2']", { timeout: 3000 })
			await page.focus("[placeholder='CVV2']", { timeout: 5000 })
			await page.type("[placeholder='CVV2']", config.cv2)
			logger.info("CVV data inputted")
			break
		} catch (err) {
			logger.warn("Cannot find CVV input element")
		}
	}
	
	await page.waitForTimeout(250)
	try {
		const [button] = await page.$x("//button[contains(., 'Review your order')]")
		if (button) {
			logger.info("Review Order")
			await button.click()
		}
	} catch (err) {
		logger.error("Cannot find the Review Order button")
		logger.error(err)
	}
}

/**
 * Submit the order
 * @param {*} page The page containing the order form
 */
async function submitOrder(page) {
	await page.waitForSelector("#btnCreditCard", { timeout: 3000 })
	await page.waitForTimeout(500)
	
	if (config.auto_submit) {
		await page.click('#btnCreditCard')
		logger.info("Completed purchase")
	} else {
		logger.warn("Order not submitted because 'auto_submit' is not enabled")
	}
}

async function run() {
	logger.info("Newegg Shopping Bot Started")
	logger.info("Please don't scalp, just get whatever you need for yourself")
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1920, height: 1080 },
		executablePath: config.browser_executable_path
	})
	const [page] = await browser.pages()
	await page.setCacheEnabled(false)

	// Main loop
	while (true) {
		try {
			await page.goto('https://secure.newegg.' + config.site_domain + '/wishlist/md/' + config.wishlist, { waitUntil: 'networkidle0' })
			
			if (page.url().includes("signin")) {
				//need to signin every so often
				await signin(page)
			} else if (page.url().includes("areyouahuman")) {
				await page.waitForTimeout(1000)
			} else if (await check_wishlist(page)) {
				if (await check_cart(page)) {
					break	
				}
			}
		} catch (err) {
			continue
		}
	}

	// Continuely attempts to press the Checkout/Continue checkout buttons, until getting to last checkout button
	// This way no time is wasted in saying "Wait 10s" after pressing a button, no easy way to wait for networkidle after an ajax request
	while (true) {
		try {
			let button
			
			if (page.url().includes("Cart")) {
				button = await page.waitForXPath("//button[contains(., 'Secure Checkout')]", { timeout: 1000 })
			} else if (page.url().includes("checkout")) {
				button = await page.waitForXPath("//button[contains(., 'Continue to')]", { timeout: 1000 })
			} else {
				await page.waitForTimeout(1000)
				continue
			}
			
			await page.waitForTimeout(500)
			
			if (button) {
				await button.click()
			}
		} catch (err) {
			try {
				if (await page.waitForXPath("//button[contains(., 'Review your order')]", { timeout: 500 })) {
					break
				}
			} catch (err) {
				continue
			}
		}
	}

	//CVV and order submit stuff
	try {
		await inputCVV(page)
		await submitOrder(page)
	} catch (err) {
		logger.error("Cannot find the Place Order button.")
		logger.warn("Please make sure that your Newegg account defaults for: shipping address, billing address, and payment method have been set.")
	}
}

run()
