# 🗺️ GMaps Lead Scraper

A Chrome Extension to **scrape Google Maps search results** (business name, phone, website, rating, address, etc.) and export them into CSV.

---

## 🚀 Features
- Scrapes **all visible results** from Google Maps search.  
- Extracts:  
  - Title  
  - Rating  
  - Reviews  
  - Phone  
  - Industry  
  - Address  
  - Website  
  - Google Maps Link  
- Auto-scrolls until the last page.  
- Export results as **CSV file**.

---

## 📦 Installation (Dev Mode)

```bash
# Clone this repository
git clone https://github.com/<your-username>/gmaps-lead-scraper.git
cd gmaps-lead-scraper
````

* Open **Google Chrome** and go to:

  ```
  chrome://extensions/
  ```
* Enable **Developer Mode** (toggle on the top-right).
* Click **Load unpacked**.
* Select the project folder → extension will be installed.

---

## ▶️ Usage

* Go to **[Google Maps Search](https://www.google.com/maps/search/)**
* Run any query (e.g., `restaurants in New York`)
* Click the extension icon → **Scrape Google Maps**
* When scraping finishes, click **Download as CSV**
