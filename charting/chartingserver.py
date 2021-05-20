import json
import os
from datetime import date, datetime

import dash
import dash_core_components as dcc
import dash_html_components as html
import pandas as pd
import plotly.graph_objects as go
import requests
from dash.dependencies import Input, Output

import argparse

my_parser = argparse.ArgumentParser(fromfile_prefix_chars='@')

my_parser.add_argument('symbol',
                       help='a first argument')
my_parser.add_argument('currency',
                       help='a second argument')
my_parser.add_argument('timeframe',
                       help='a third argument')

# Execute parse_args()
args = my_parser.parse_args()

symbol = args.symbol
currency = args.currency
timeframe = args.timeframe

print(f'{symbol}{currency}{timeframe}')

if not os.path.exists("charting/images"):
    os.mkdir("charting/images")


def url_build(symbol=symbol, currency=currency, interval=timeframe):
    '''Candle’s body (interval):

    1 - 2 days: 30 minutes
    3 - 30 days: 4 hours
    31 and before: 4 days
    '''
    url_base = "https://api.coingecko.com"
    url_endpoint = f"/api/v3/coins/{symbol}/ohlc"
    url_final = url_base + url_endpoint + \
        f"?vs_currency={currency}&days={interval}"
    print(url_final)
    return url_final


response = requests.get(url_build())
response_dict = json.loads(response.text)
print("Standard values retrieved: ", len(response_dict))

df = pd.DataFrame.from_dict(response_dict)
print("The len of the dataframe is: {} and we have {} columns".format(
    df.shape[0], df.shape[1]))

candle_columns = ["Open time",
                  "Open",
                  "High",
                  "Low",
                  "Close"
                  ]
df.columns = candle_columns
df.head(2)

df['Open time'] = pd.to_datetime(df['Open time'], unit='ms', errors='coerce')
df[df.columns[1:5]] = df[df.columns[1:5]].astype("float")
df[df.columns[:5]].info()


fig = go.Figure(go.Candlestick(x=df['Open time'],
                                open=df['Open'],
                                high=df['High'],
                                low=df['Low'],
                                close=df['Close']))

fig.update_layout(
    xaxis_rangeslider_visible=True,
    title=f"{symbol}-{currency}"
)
now=datetime.now()
now = now.strftime("%m%d%YT%H%M%S")
filename=f"./charting/images/{symbol}{currency}{timeframe}.png"
print(filename)

if os.path.exists(filename):
    os.remove(filename)
fig.write_image(filename, engine="kaleido" )