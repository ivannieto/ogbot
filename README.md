# OG Bot

A telegram bot to retrieve cryptocurrencies data using different data APIs and telegraf.js. 

It also uses Plotly in Python to generate charts based on OHLC data extracted from API.


Available commands:

- /help - Displays this help
- /pr - <coin> Asks the price for a coin
- /chart - <coin> <vs_coin> <timeframe (1m,5m,15m,1h,4h,1d...)> <exchange> Displays a chart which bars range are specified by user
- /status - How is doing the market right now?
- /df - Displays DeFi data
- /trending - Displays trending coins data

To run it, just talk directly to the bot @cryptog_bot on your Telegram app.
  
To run it in development:

- Install node/npm
- Install virtualenv and requirements in charting folder
- Configure your API keys in .env file in root folder
  - CW_API_PUBKEY: Cryptowatch API pubkey
  - CMC_API_KEY: CoinMarketCap API key
  - TELEGRAM_TOKEN: Token provided by creation of the bot through @botfather
- Run *npm start*


