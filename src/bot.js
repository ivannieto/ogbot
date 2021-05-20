const { Telegraf, Markup } = require('telegraf')
const NumberSuffix = require('number-suffix')
const strings = require('./stringsFile')
const CoinGecko = require('coingecko-api')

const CoinGeckoClient = new CoinGecko()
const CoinsList = require('./coins').COINS
const CoinData = require('./models/CoinData')
const numberSuffix = new NumberSuffix({ style: 'abbreviation', precision: 2 })
const shell = require('shelljs')
const fs = require('fs')

require('dotenv').config()
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN

const bot = new Telegraf(TELEGRAM_TOKEN)

const SHOW_CHARTS_BUTTONS = Markup.inlineKeyboard([
  Markup.button.callback('Chart USD', 'show_chart_usd'),
  Markup.button.callback('Chart BTC', 'show_chart_btc'),
])

// -------------------------------

/**
 * Capitalize a string
 * @param {String} str
 * @returns
 */
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Sort keys in object
 * @param {Object} obj
 * @returns
 */
const sortKeys = (obj) => {
  return Object.assign(
    ...Object.entries(obj)
      .sort()
      .map(([key, value]) => {
        return {
          [key]: value,
        }
      }),
  )
}

/**
 *
 * Returns the coinId for a given symbol (ticker)
 *
 * @param {Array} coinsList
 * @param {String} symbol
 * @returns String
 */
const findCoinIdBySymbol = (coinsList, symbol) => {
  const results = coinsList.filter((coin) => coin['symbol'] === symbol)
  let coinId = null

  console.log(results)
  if (results[0]['id'] === undefined || results[0]['id'] === null) {
    console.log('coin not found')
    return null
  } else if (results.length > 1) {
    results.forEach((coin) => {
      if (String(coin['id']).includes('bsc')) {
        coinId = coin['id']
      } else {
        coinId = results[0]['id']
      }
    })
  } else if (results.length === 0) {
    return null
  } else {
    coinId = results[0]['id']
  }
  return coinId
}

/**
 * Returns a sentence given a camelCase string
 *
 * @param {String} word
 * @returns
 */
const fromCamelCaseToSentence = (word) =>
  word
    .replace(/([A-Z][a-z]+)/g, ' $1')
    .replace(/([A-Z]{2,})/g, ' $1')
    .replace(/\{2,}/g, ' ')
    .trim()

/**
 * Returns the string for a given object containing Coin Data
 *
 * @param {Object} obj
 * @returns
 */
const stringifyCoinData = (obj) => {
  let str = ''
  Object.keys(obj).forEach((k) => {
    let kk = fromCamelCaseToSentence(k)
    if (k === 'name' || k === 'symbol') {
      str += `*${obj[k]}*\n`
    } else if (k === 'marketCapRank') {
      if (obj[k] === null) {
        str += `Rank:  *N/D*\n`
      } else {
        str += `Rank: *${obj[k]}*\n`
      }
    } else if (k === 'marketCap') {
      str += `MC: *${numberSuffix.format(obj[k])}*\n`
    } else if (k === 'priceUSD') {
      str += `*$${obj[k]}*`
    } else if (k === 'priceBTC') {
      str += ` | *${obj[k]} BTC\n*`
    } else if (k === 'ath') {
      str += `${String(kk).toUpperCase()}:  *$${obj[k]}*\n`
    } else if (k === 'percentChange24h') {
      str += `24h:  *${obj[k]}*\n`
    } else if (k === 'percentChange1h') {
      str += `1h:  *${obj[k]}*\n`
    } else if (k === 'maxSupply') {
      if (numberSuffix.format(obj[k]) === 'NaNK') {
        str += `Max Supply:  *N/D*\n`
      } else {
        str += `Max Supply:  *${numberSuffix.format(obj[k])}*\n`
      }
    } else if (k === 'totalSupply') {
      if (numberSuffix.format(obj[k]) === 'NaNK') {
        str += `Total Supply:  *N/D*\n`
      } else {
        str += `Total Supply:  *${numberSuffix.format(obj[k])}*\n`
      }
    } else if (k === 'contractAddress') {
      if (obj['platform'] === 'binance-smart-chain') {
        str += `Contract: [${obj[k]}](https://exchange.pancakeswap.finance/#/swap?outputCurrency=${obj[k]})\n`
      } else if (obj['platform'] === 'ethereum') {
        str += `Contract: [${obj[k]}](https://app.uniswap.org/#/swap?outputCurrency=${obj[k]}&use=V2)\n`
      } else if (obj['platform'] === null || obj['platform'] === undefined) {
        str += `Contract:  *${obj[k]}*\n`
      } else {
        str += `Contract:  *${obj[k]}*\n`
      }
    } else if (k === 'homepage') {
      str += `URL:  *${obj[k][0]}*\n`
    } else if (k === 'platform') {
      str += `Platform:  *${obj[k]}*\n`
    } else {
      str += `${kk}:   *${obj[k]}*\n`
    }
  })

  str = str.replace(/thumb:.*\n/, '').substr(0)

  return str
}

const checkIfCoinIsFound = (ctx, coinId, symbol) => {
  if (coinId === null) {
    ctx.replyWithMarkdown(
      `The symbol *${String(
        symbol,
      ).toUpperCase()}* was not found brah... Try again. Tip: Use the ticker.`,
    )
    return ctx.replyWithPhoto({
      source: './src/assets/img/pepesadge.jpg',
      caption: 'BRAH',
    })
  }
}

// -------------------------------------------------

bot.start((ctx) => {
  ctx.reply(strings.HELP)
})

// COMMANDS

// Help command
bot.hears(/(\/help|\/pricebot)/, (ctx) => {
  ctx.reply(strings.HELP)
})

bot.hears(/(\/pr|\/pr@cryptog_bot) .*/, async (ctx) => {
  let argument = ctx.message.text
  let symbol = argument.split(' ')[1].trim().toLowerCase()
  const coinId = findCoinIdBySymbol(CoinsList, symbol)

  console.log(`COIN ID: ${coinId}`)

  checkIfCoinIsFound(ctx, coinId, symbol)

  await CoinGeckoClient.coins.fetch(coinId).then((res) => {
    let coinData = new CoinData()

    res = res['data']
    coinData.symbol = String(res['symbol']).toUpperCase()
    coinData.name = res['name']
    coinData.marketCapRank = res['market_cap_rank']
    coinData.marketCap = res['market_data']['market_cap']['usd']
    coinData.priceUSD = Number(
      res['market_data']['current_price']['usd'],
    ).toFixed(8)
    coinData.priceBTC = Number(
      res['market_data']['current_price']['btc'],
    ).toFixed(8)
    coinData.ath = Number(res['market_data']['ath']['usd']).toFixed(10)
    coinData.percentChange24h = res['market_data'][
      'price_change_percentage_24h'
    ]
      ? Number(res['market_data']['price_change_percentage_24h']).toFixed(2) +
        '%'
      : 'N/D'
    coinData.percentChange1h = res['market_data'][
      'price_change_percentage_1h_in_currency'
    ]['usd']
      ? Number(
          res['market_data']['price_change_percentage_1h_in_currency']['usd'],
        ).toFixed(2) + '%'
      : 'N/D'
    coinData.maxSupply = res['market_data']['max_supply'] || 'N/D'
    coinData.totalSupply = res['market_data']['total_supply'] || 'N/D'
    coinData.homepage = res['links']['homepage'].filter((e) => e) || 'N/D'
    coinData.contractAddress = res['contract_address'] || 'N/D'
    coinData.platform = res['asset_platform_id'] || 'N/D'

    console.log(coinData)

    ctx.replyWithMarkdown(stringifyCoinData(coinData), SHOW_CHARTS_BUTTONS)
    // return ctx.replyWithHTML(htmlizeObject(coinData))
  })
})

/**
 * Displays a chart
 *
 * @param {String} vsCurrency
 * @param {Object} ctx
 */
const showChart = async (vsCurrency, exchange, ctx) => {
  await ctx.answerCbQuery(`Creating chart 4 ya, please wait a second`)
  const symbol = ctx.update.callback_query.message.text.match(/^.*$/m)[0].trim()
  const coinId = findCoinIdBySymbol(CoinsList, symbol.toLowerCase())
  console.log(`SYMBOL: ${symbol}`)
  console.log(`COIN ID: ${coinId}`)
  console.log(`EXCHANGE: ${exchange}`)

  checkIfCoinIsFound(ctx, coinId, symbol)
  await createChart(symbol, vsCurrency, 1, exchange)

  // Wait for chart to be generated 4s and then reply
  setTimeout(() => {
    return ctx.replyWithPhoto({
      source: `charting/images/${symbol}${vsCurrency}1${exchange}.png`,
      caption: `${coinId} ${vsCurrency} 1`,
    })
  }, 1000)
}

bot.action(/show_chart_usd/, async (ctx) => {
  await showChart('usd', 'binance', ctx)
})

bot.action(/show_chart_btc/, async (ctx) => {
  await showChart('btc', 'binance', ctx)
})

/**
 * Creates a candle chart given 3 parameters
 *
 * @param {String} coinId
 * @param {String} currency
 * @param {Number} tf
 */
const createChart = async (coinId, currency, tf, exchange) => {
  await shell.exec(
    `python3 ./charting/chartingserver_cw.py ${coinId} ${currency} ${tf} ${exchange}`,
    function (code, output) {
      console.log('Exit code:', code)
      console.log('Program output:', output)
    },
  )
}

/**
 * Charting command
 */
bot.hears(/(\/chart|\/chart@cryptog_bot) .*/, async (ctx) => {
  /**
   * Candle’s body (tf):

    1 - 2 days: 30 minutes
    3 - 30 days: 4 hours
    31 and before: 4 days
   */
  let argument = ctx.message.text
  let chartArgs = argument.split(' ')
  let symbol = chartArgs[1]
  let currency = chartArgs[2]
  let tf = chartArgs[3]
  let exchange = chartArgs[4]

  if (symbol === undefined || currency === undefined || tf === undefined) {
    return ctx.replyWithHTML(
      `Please insert the 3 required fields:\n /chart &lt;coin&gt; &lt;currency&gt; &lt;timeframe&gt; `,
    )
  } else {
    symbol = chartArgs[1].trim().toLowerCase()
    currency = chartArgs[2].trim().toLowerCase()
    tf = chartArgs[3].trim().toLowerCase()
  }

  const coinId = findCoinIdBySymbol(CoinsList, symbol)

  checkIfCoinIsFound(ctx, coinId, symbol)

  await CoinGeckoClient.coins
    .fetchMarketChart(coinId)
    .then(() => {
      createChart(symbol, currency, tf, exchange)
    })

    setTimeout(() => {
      return ctx.replyWithPhoto({
        source: `charting/images/${symbol}${currency}${tf}${exchange}.png`,
        caption: `${coinId} ${currency} ${tf} ${exchange}`,
      })
    }, 4000)
})

/**
 * Market Status command
 */
bot.hears(/(\/status|\/status@cryptog_bot)/, async (ctx) => {
  let files = fs.readdirSync('./src/assets/img/up/')
  let chosenFile = files[Math.floor(Math.random() * files.length)]

  await CoinGeckoClient.global().then((res) => {
    let data = res['data']['data']
    if (data['market_cap_change_percentage_24h_usd'] > 0) {
      ctx.replyWithSticker({ source: `./src/assets/img/up/${chosenFile}` })
    } else {
      ctx.replyWithSticker({ source: `./src/assets/img/down/${chosenFile}` })
    }
    return ctx.replyWithMarkdown(
      `Total Market Cap\n24h% Change: *${Number(
        data['market_cap_change_percentage_24h_usd'],
      ).toFixed(2)}%*`,
    )
  })
})

/**
 * Trending command
 */
bot.hears(/(\/trending|\/trending@cryptog_bot)/, async (ctx) => {
  // Add /search/trending endpoint ad-hoc
  CoinGecko.prototype.trending = () => {
    const path = `/search/trending`
    return CoinGecko.prototype._request(path)
  }
  await CoinGeckoClient.trending().then((res) => {
    let data = res['data']['coins']
    let trendingRank = ``
    let sortedData = sortKeys(data)
    console.log(sortedData)
    data.forEach((coin) => {
      let coinId = capitalize(coin['item']['name'])
      trendingRank += `*${coin['item']['symbol']}*\n${coinId}\nMC Rank: *${coin['item']['market_cap_rank']}*\n\n`
    })
    return ctx.replyWithMarkdown(`Top 10 Trending:\n\n${trendingRank}`)
  })
})

/**
 * DeFicommand
 */
bot.hears(/(\/df|\/df@cryptog_bot)/, async (ctx) => {
  CoinGecko.prototype.defi = () => {
    const path = `/global/decentralized_finance_defi`
    return CoinGecko.prototype._request(path)
  }
  await CoinGeckoClient.defi().then((res) => {
    let data = res['data']['data']
    let defiResponse = ``
    console.log(data)
    defiResponse += `Total DeFi MC: *${numberSuffix.format(
      Number(data['defi_market_cap']),
    )}*\n`
    defiResponse += `Ethereum MC: *${numberSuffix.format(
      Number(data['eth_market_cap']),
    )}*\n`
    defiResponse += `DeFi Dominance: *${Number(data['defi_dominance']).toFixed(
      2,
    )}*\n`
    return ctx.replyWithMarkdown(`DeFi data:\n\n${defiResponse}`)
  })
})

bot.launch()
