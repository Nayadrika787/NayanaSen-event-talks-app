import time
from flask import Flask, render_template, jsonify, request
import feedparser
import requests

app = Flask(__name__)

# Simple cache structure
cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION_SECS = 300  # 5 minutes
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_feed(force=False):
    now = time.time()
    if not force and cache["data"] and (now - cache["last_fetched"] < CACHE_DURATION_SECS):
        return cache["data"], False

    try:
        # Fetching with a timeout to prevent hanging
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        
        # Parse xml feed
        feed = feedparser.parse(response.content)
        
        parsed_entries = []
        for entry in feed.entries:
            parsed_entries.append({
                "id": entry.get("id", ""),
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "updated": entry.get("updated", ""),
                "summary": entry.get("summary", "")
            })
        
        cache["data"] = parsed_entries
        cache["last_fetched"] = now
        return parsed_entries, True
    except Exception as e:
        print(f"Error fetching feed: {e}")
        # Return stale cache if available in case of network error
        if cache["data"]:
            return cache["data"], False
        raise e

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/release-notes")
def release_notes():
    force_refresh = request.args.get("refresh", "false").lower() == "true"
    try:
        entries, fetched_new = fetch_feed(force=force_refresh)
        return jsonify({
            "status": "success",
            "fetched_new": fetched_new,
            "last_updated": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)
