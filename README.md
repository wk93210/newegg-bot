# NeweggBot
Autonomously buy products from Newegg as soon as they become available

This bot is very much still in the early stages, and more than a little rough around the edges.  Expect the occasional hiccups if you decide to use it.

## Installation
You will require [Node.js](https://nodejs.org/en/) to run this.
Then run `npm i` command.

## Configuration
Once that is finished, create a copy of config_template.json and name it config.json. Inside you will find the very basic customization options.

Note that this bot assumes that you've setup your default shipping address and payment method. If not, please set them up before using.

- `buy` Whether you want this bot to place the order. Will place the order automatically if "true". Will not place the order and stay on the page for the last step if "false"
- `wishlist` The link to your wishlist
- `cvv` Credit card CVV. Three digits, "123", for example
- `refresh_time` refers to the duration to wait in seconds between add-to-cart attempts. This should be specified as a number, rather than a string. "5", meaning 5 seconds, for example
- `browser_executable_path` This will set the path to the browser to be used by the bot. "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", for example

## Usage
After installation and configuration, the bot can then be run by using `npm start` 