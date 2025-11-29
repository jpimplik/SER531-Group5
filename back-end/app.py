from flask import Flask
from flask_cors import CORS
from rdflib import Graph, Namespace
import os
from dotenv import load_dotenv

load_dotenv()

flask_host = os.getenv("FLASK_HOST")
flask_port = int(os.getenv("FLASK_PORT"))
flask_debug = os.getenv("FLASK_DEBUG", '1') == '1'

app = Flask(__name__)
CORS(app)

g = Graph()
g.parse("foodpriceontology.rdf", format="xml")
FOOD = Namespace("http://example.org/foodpriceontology#")

query = """
    SELECT ?food ?price
    WHERE {
        ?food a <http://example.org/foodpriceontology#FoodItem> .
        ?food <http://example.org/foodpriceontology#hasPrice> ?price .
    }
"""

# @app.route("/")
# def index():
#     food_prices = []
#     for row in g.query(query):
#         food_name = str(row.food).split('#')[-1]
#         food_prices.append({"name": food_name, "price": float(row.price)})
#     return render_template("index.html", food_prices=food_prices)

if __name__ == "__main__":
    app.run(host=flask_host, port=flask_port, debug=flask_debug)
