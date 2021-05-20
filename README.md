# OG Bot

A telegram bot to retrieve cryptocurrencies data using the CoinGecko API and Telegraf. 

It also uses Plotly in Python to generate charts based on OHLC data extracted from API.


Available commands:

- /help - Displays this help
- /pr - <coin> Asks the price for a coin
- /chart - <coin> <vs_coin> <timeframe (1m,5m,15m,1h,4h,1d...)> <exchange> Displays a chart in days timeframes 
- /status - How is doing the market right now?
- /df - Displays DeFi data
- /trending - Displays trending coins data