# John's News Feed

A curated aggregator of the latest news across tech, gaming, sports, and deals.

🌐 **[View the Live Site Here](https://bigjca.github.io/johns-site-content/)**

## How it works

1. **The Engine**: A Node.js script (`src/index.js`) reads from `sources.json`, fetching the latest articles from 18 different RSS feeds simultaneously.
2. **The Automation**: GitHub Actions (`.github/workflows/fetch-news.yml`) runs on a schedule every 2 hours. It triggers the Node script and commits the freshly generated JSON files (`output/*.json`) directly back to the repository.
3. **The UI**: Hosted seamlessly on GitHub Pages, the frontend (`index.html`, `app.js`, `styles.css`) dynamically consumes the static JSON files to render a fast, beautiful, and dark-mode native experience.

## Adding new sources

To add or remove news sources, simply edit `sources.json`. The GitHub Action will automatically pick up the new feeds on its next scheduled run.

```json
{
  "name": "Example Tech Site",
  "feedUrl": "https://example.com/rss",
  "category": "tech"
}
```

## Running Locally

If you want to fetch news manually on your local machine:

```bash
npm install
npm run fetch
```

To preview the UI locally:

```bash
npx serve .
```
