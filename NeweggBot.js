const puppeteer = require('puppeteer')
const config = require('./config.json'); 

async function report (log) {
	currentTime = new Date();
	console.log(currentTime.toString().split('G')[0] + ': ' + log)
}

async function run () {
	await report("Started")
	const browser = await puppeteer.launch({
        	headless: false,
        	defaultViewport: { width: 1366, height: 768 }
    	})
	
    	const page = await browser.newPage()
	
	await page.goto('http://newegg.com', { waitUntil: 'networkidle2' })
    	while (true) {
		await page.goto('https://secure.newegg.com/NewMyAccount/AccountLogin.aspx?nextpage=https%3a%2f%2fwww.newegg.com%2f', { waitUntil: 'load' })
		if (page.url().includes('signin')) {
			break;
		} else if (page.url().includes("areyouahuman")) {
			await page.waitForTimeout(1000)
		}
	}
	
	await page.waitForSelector('#labeled-input-signEmail')
    	await page.type('#labeled-input-signEmail', config.email)
	await page.waitForTimeout(500)
	await page.click('button.btn.btn-orange')
	await page.waitForSelector('#labeled-input-password')
	await page.type('#labeled-input-password', config.password)
	await page.waitForTimeout(500)
	await page.click('button.btn.btn-orange')
	await page.waitForNavigation({
		waitUntil: 'networkidle2',
	});

	await report("Logged in")
	await report("Checking for card")

	while (true)
	{
		await page.goto('https://secure.newegg.com/Shopping/AddtoCart.aspx?Submit=ADD&ItemList=' + config.item_number, { waitUntil: 'load' })
		if (page.url().includes("ShoppingCart")) {
			await report("Card not in stock")
			await page.waitForTimeout(config.refresh_time * 1000)
		} else if (page.url().includes("ShoppingItem")) {
			break
		} else if (page.url().includes("areyouahuman")) {
			await page.waitForTimeout(1000)
		}
	}
	await report("Card in stock, attempting to purchase")
	await page.goto('https://secure.newegg.com/Shopping/ShoppingCart.aspx', { waitUntil: 'networkidle2' })
	
	try {
		await page.goto('javascript:attachDelegateEvent((function(){Biz.GlobalShopping.ShoppingCart.checkOut(\'True\')}))', {timeout: 500})
	} catch (err) {
	}
	
	await page.waitForSelector('#cvv2Code')
	await page.type('#cvv2Code', config.cv2)
	await page.click('#term')
	if (config.auto_submit == 'true') {
		await page.click('#SubmitOrder')
	}
	await report("Completed purchase")
    	//await browser.close()
}

run()
