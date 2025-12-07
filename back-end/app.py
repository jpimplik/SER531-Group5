from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from SPARQLWrapper import SPARQLWrapper, JSON

load_dotenv()

flask_host = os.getenv("FLASK_HOST", "0.0.0.0")
flask_port = int(os.getenv("FLASK_PORT", "5000"))
flask_debug = os.getenv("FLASK_DEBUG", '1') == '1'

fuseki_url = os.getenv("FUSEKI_URL", "http://localhost:3030/FoodPriceNetDataset/query")

app = Flask(__name__)
CORS(app)

@app.route('/sparql', methods=['GET','POST'])
def sparql_proxy():
    if request.method == 'GET':
        q = request.args.get('query') or request.args.get('q')
    else:
        body = request.get_json(silent=True) or {}
        q = body.get('query') or body.get('q')
    if not q:
        return jsonify({"error": "no query provided"}), 400

    sparql = SPARQLWrapper(fuseki_url)
    sparql.setQuery(q)
    sparql.setReturnFormat(JSON)
    app.logger.info('Proxying SPARQL query to %s', fuseki_url)
    app.logger.debug('Query: %s', q)
    try:
        res = sparql.query().convert()
        return jsonify(res)
    except Exception as e:
        app.logger.error('SPARQL proxy error: %s', e)
        return jsonify({"error": str(e)}), 500


@app.route('/', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "fuseki_url": fuseki_url
    })


if __name__ == "__main__":
    app.run(host=flask_host, port=flask_port, debug=flask_debug)
