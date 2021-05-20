import json
import os
from datetime import date, datetime, time, timedelta

import dash
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd
import plotly.graph_objects as go
import requests
from dash.dependencies import Input, Output

import argparse

from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

"""Doc on url endpoint

OHLC Candlesticks
This is the data that is shown in our charting interface.

GET
Market OHLC
https://api.cryptowat.ch
/markets/:exchange/:pair/ohlc
Returns a market's OHLC candlestick data. A series of candlesticks is represented as a list of lists of numbers.
Request
Response
Path Parameters
exchange
REQUIRED
string
Exchange symbol

pair
REQUIRED
string
Pair symbol
Query Parameters

before
OPTIONAL
integer
Unix timestamp. Only return candles opening before this time. Example: 1481663244

after
OPTIONAL
integer
Unix timestamp. Only return candles opening after this time. Example 1481663244

periods
OPTIONAL
array
Comma separated integers. Only return these time periods. Example: 60,180,108000

Querying OHLC data within a specific time-range, it is better to define both the after and beEWfore parameters for more accurate results.

When both after and before parameters are defined, the command will query and fetch OHLC data for the defined range.

When only after has been specified, the before parameter will be updated to the current date (now) and the results will be within the range: after until now.

Supplying before without an after relies on cached data and returns variable results.

Response Format
1-minute candles are under the "60" key. 3-minute are "180", and so on.

The values are in this order:

[
  CloseTime,
  OpenPrice,
  HighPrice,
  LowPrice,
  ClosePrice,
  Volume,
  QuoteVolume
]
So for instance, we can take this string value under Coinbase Pro's BTCUSD market for time period "3600" (1-hour):

[
    1474736400,
    8744,
    8756.1,
    8710,
    8753.5,
    91.58314308,
    799449.488966417
],
This represents a 1-hour candle starting at 1474732800 (Sat, 24 Sep 2016 16:00:00 UTC) and ending at 1474736400 (Sat, 24 Sep 2016 17:00:00 UTC).

The open price for this candle is 8744, the high price 8756.1, the low price 8710, and the close price 8753.5. The volume for this candle was 91.58314308 denominated in BTC, and 799449.488966417 denominated in USD.

Period values
Value
"""

arg_parser = argparse.ArgumentParser(fromfile_prefix_chars='@')

arg_parser.add_argument('symbol',
                        help='Base ticker')
arg_parser.add_argument('currency',
                        help='Vs ticker')
arg_parser.add_argument('timeframe',
                        help='Timeframe in seconds: 60,180,300,900,1800,3600,7200,14400,43200')
arg_parser.add_argument('exchange',
                        help='Exchange to look for')

# Execute parse_args()
args = arg_parser.parse_args()

symbol = args.symbol
currency = args.currency
timeframe = args.timeframe
exchange = args.exchange
API_KEY = os.getenv("CW_API_PUBKEY")

print(f'{symbol}{currency}{timeframe}{exchange}')

now = datetime.now()

if not os.path.exists("charting/images"):
    os.mkdir("charting/images")


key_vals = {
    "1m":60,
    "3m":180,
    "5m":300,
    "15m":900,
    "30m":1800,
    "1h":3600,
    "2h":7200,
    "4h":14400,
    "6h":21600,
    "12h":43200,
    "1d":86400,
    "3d":259200,
    "1w":604800
}


def get_better_after_period_based_on_timeframe(timeframe):
    timeframe = key_vals[timeframe]
    if int(timeframe) <= 900:
        four_hours_delta = now - timedelta(hours=4)
        return datetime.timestamp(four_hours_delta)
    if int(timeframe) <= 3600:
        daily_delta = now - timedelta(days=1)
        return datetime.timestamp(daily_delta)        
    if int(timeframe) > 3600 and int(timeframe) <= 86400:
        weekly_delta = now - timedelta(days=7)
        return datetime.timestamp(weekly_delta)
    if int(timeframe) > 86400:
        thirty_days_delta = now - timedelta(days=30)
        return datetime.timestamp(thirty_days_delta)


def url_build(symbol=symbol, currency=currency, timeframe=timeframe):
    '''Candle’s body (interval):
        60 1m
        180 3m
        300 5m
        900 15m
        1800 30m
        3600 1h
        7200 2h
        14400 4h
        21600 6h
        43200 12h
        86400 1d
        259200 3d
        604800 1w
    '''
    after = get_better_after_period_based_on_timeframe(timeframe)
    print(f"AFTER: {after}")
    before = int(datetime.timestamp(now))
    original = "https://api.cryptowat.ch/markets/:exchange/:pair/ohlc"
    url_base = "https://api.cryptowat.ch/markets"
    url_endpoint = f"/{exchange}/{symbol}{currency}/ohlc"

    url_final = url_base + \
        url_endpoint + \
        f"?before={before}" \
        f"&after={int(after)}" \
        f"&periods={key_vals.get(timeframe)}" \
        f"&apiKey={API_KEY}"

    print(f"URL: {url_final}")
    return url_final


response = requests.get(url_build())
response_dict = json.loads(response.text)
print(f"Rsponse: {response_dict}")
print("Standard values retrieved: ", len(response_dict['result'][str(key_vals[timeframe])]))

df = pd.DataFrame.from_dict(response_dict['result'][str(key_vals[timeframe])])
print("The len of the dataframe is: {} and we have {} columns".format(
    df.shape[0], df.shape[1]))

candle_columns = [
    "CloseTime",
    "OpenPrice",
    "HighPrice",
    "LowPrice",
    "ClosePrice",
    "Volume",
    "QuoteVolume"
]
df.columns = candle_columns
df.head(2)

df["CloseTime"] = pd.to_datetime(df["CloseTime"], unit='s')
df[df.columns[1:5]] = df[df.columns[1:5]].astype("float")
df[df.columns[:5]].info()

fig = go.Figure(go.Candlestick(x=df["CloseTime"],
                               open=df["OpenPrice"],
                               high=df["HighPrice"],
                               low=df["LowPrice"],
                               close=df["ClosePrice"]))

fig.update_layout(
    xaxis_rangeslider_visible=False,
    title=f"{symbol}-{currency} {timeframe} | {exchange}"
)
filename = f"./charting/images/{symbol}{currency}{timeframe}{exchange}.png"
print(f"Filename: {filename}")

if os.path.exists(filename):
    os.remove(filename)
fig.write_image(filename, engine="kaleido")
