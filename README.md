# BigQuery Release Notes Explorer & Social Share

A sleek, modern web application that fetches the latest **Google Cloud BigQuery** release notes, parses them into structured individual updates, and provides a custom-made tweet composer to directly share them on Twitter (X).

## 🚀 Features

- **Automated RSS Ingestion**: Dynamically fetches release notes from Google's official Atom XML feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **Intellectual Caching**: Implements a 5-minute server-side in-memory cache to prevent redundant network requests and avoid API rate limits.
- **Granular Update Parsing**: Uses a client-side `DOMParser` to automatically split multi-update days (e.g. days containing several features, announcements, and issues) into individual, standalone update cards.
- **Interactive Dashboard & Stats**:
  - Live statistics display counting the number of *Features*, *Issues*, and *Announcements* currently fetched.
  - Real-time search across date, category tags, and description text.
  - Custom category filters (Features, Issues/Fixes, Announcements, Deprecations, Changes).
- **Tweet Composer Modal**:
  - Automatically formats the selected update into ready-to-share drafts.
  - 3 pre-built templates: *Professional Tech News*, *Quick Tip / Insight*, and *Minimal Summary*.
  - Live 280-character counter with visual warnings if a draft exceeds the standard X (Twitter) character limit.
  - Copy-to-clipboard and single-click redirect via Twitter Web Intents.
- **Modern UI Design System**:
  - Default deep tech dark-mode with glassmorphic cards and glowing elements.
  - Fully responsive layout for desktop and mobile screen sizes.
  - Real-time Light / Dark mode toggle (persisted via `localStorage`).

---

## 🛠️ Technology Stack

- **Backend**: Python 3.x, Flask (v3.0)
- **Feed Parser**: `feedparser` library
- **Frontend**: Plain Vanilla HTML5, Vanilla JavaScript (ES6+), CSS3 Variables
- **Icons**: Lucide Icons CDN

---

## 💻 Getting Started

### Prerequisites

- Python 3.10 or higher
- Git

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Nayadrika787/NayanaSen-event-talks-app.git
   cd NayanaSen-event-talks-app
   ```

2. **Set up a Virtual Environment**:
   ```bash
   python -m venv .venv
   ```

3. **Activate the Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     source .venv/bin/activate
     ```

4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the Flask Application**:
   ```bash
   python app.py
   ```

6. **View in Browser**:
   Open your browser and navigate to **`http://127.0.0.1:5000`**.

---

## 📂 Project Structure

```text
├── templates/
│   └── index.html      # UI page structure & Modal overlays
├── static/
│   ├── app.js          # DOM parsing, filtering, and tweet generation
│   └── style.css       # Theme tokens, layout styles, and animations
├── app.py              # Flask server, cache wrapper, and API router
├── requirements.txt    # Project dependencies
├── .gitignore          # Ignored local configurations & caches
└── README.md           # Project guide
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information (optional).
