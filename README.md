# NeweggBot
Autonomously buy products from Newegg as soon as they become available

This bot is very much still in the early stages, and more than a little rough around the edges.  Expect the occasional hiccups if you decide to use it.

## Installation
You will require [Node.js](https://nodejs.org/en/) to run this.
Then run `npm i` command.

## Configuration
Once that is finished, create a copy of config_template.json and name it config.json. Inside you will find the very basic customization options.  
- `url` The link to the item that you want to buy. "https://www.newegg.com/asrock-phantom-gaming-rx7900xt-pgw-20go-amd-radeon-rx-7900-xt-20gb-gddr6/p/N82E16814930117?Item=N82E16814930117&cm_sp=Homepage_SS-_-P1_14-930-117-_-02152025", for example
- `name` Your full name, will be used for delivery address and credit card. "Mike Zuck", for example
- `street` Street address for delivery, "1 Hacker Way", for example
- `city` City of your delivery address. "Menlo Park", for example
- `state` Two letter abbreviation of the state of your delivery address. "CA", for example
- `zip` Zip code of your delivery address. "94025", for example
- `phone` Phone number for the order. "6507822377", for example
- `email` Email for the order. "success@successful-company.com", for example
- `cnn` Credit card number. "1234567812345678", for example
- `ccm` Credit card expiration month. Two digits. "01", for example
- `ccy` Credit card expiration year. Four digits, "2030", for example
- `cvv` Credit card CVV. Three digits, "123", for example
- `refresh_time` refers to the duration to wait in seconds between add-to-cart attempts. This should be specified as a number, rather than a string. "5", meaning 5 seconds, for example
- `browser_executable_path` This will set the path to the browser to be used by the bot. "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", for example

## Usage
After installation and configuration, the bot can then be run by using `./run.sh` 