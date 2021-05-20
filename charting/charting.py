import pandas as pd
import requests
import json
import plotly.graph_objects as go
import os

if not os.path.exists("images"):
    os.mkdir("images")


def url_build(symbol="bitcoin", currency="usd", interval=1):
    '''Candle’s body (interval):

    1 - 2 days: 30 minutes
    3 - 30 days: 4 hours
    31 and before: 4 days
    '''
    url_base = "https://api.coingecko.com"
    url_endpoint = f"/api/v3/coins/{symbol}/ohlc"
    url_final = url_base + url_endpoint + f"?vs_currency={currency}&days={interval}"
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


fig = go.Figure(data=[go.Candlestick(x=df['Open time'],
                                     open=df['Open'],
                                     high=df['High'],
                                     low=df['Low'],
                                     close=df['Close'])]
)
fig.update_layout(xaxis_rangeslider_visible=False,
                  title="BTCUSDT")


fig.write_image("./images/fig1.png", engine="kaleido")
