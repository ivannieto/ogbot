module.exports.HELP = `Welcome to OG Bot
The crypto companion for real OG's

Available commands:
/help - Displays this help
/pr - <coin> Asks the price for a coin
/chart - <coin> <vs_coin> <timeframe (1m,5m,15m,1h,4h,1d...)> <exchange> Displays a chart which bars are specified by user
/status - How is doing the market right now?
/df - Displays DeFi data
/trending - Displays trending coins data

This bot makes use of Coingecko API to retrieve data and Cryptowat.ch API to retrieve OHLC data.`

module.exports.HELP_CREATE_DRAW = `Ok, let's start
1. We create an address for you if you don't have it yet
2. You need to fund your address in order to create a payable draw
3.`

// questions
module.exports.QUESTION_DRAW_NAME = `What's the name for the draw?`
module.exports.QUESTION_DRAW_END_DATE = `When will the draw end? Write it in the format *YYYY/MM/DDTH:m:s* - e.g.: 2021/05/21T22:00:00`
module.exports.QUESTION_YES_OR_NO = 'Are you ok with this? Y or N'
module.exports.QUESTION_POLL_NAME = `Write the question for the poll`
module.exports.QUESTION_GUESS_COIN = `Which coin do you want to use?`
