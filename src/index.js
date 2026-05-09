import Parser from 'rss-parser';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Load and validate the sources config file.
 */
async function loadConfig() {
  const raw = await readFile(resolve(ROOT, 'sources.json'), 'utf-8');
  const config = JSON.parse(raw);

  if (!Array.isArray(config.sources) || config.sources.length === 0) {
    throw new Error('sources.json must contain a non-empty "sources" array.');
  }

  return {
    sources: config.sources,
    maxTotal: config.settings?.maxArticlesTotal ?? 50,
    maxPerSource: config.settings?.maxArticlesPerSource ?? 10,
    timeout: config.settings?.requestTimeoutMs ?? 10_000,
    outputFile: config.settings?.outputFile ?? 'output/news.json',
  };
}

/**
 * Fetch articles from a single RSS feed.
 * Returns a normalized array of { title, url, source, category, publishedAt }.
 */
async function fetchFeed(parser, source, maxPerSource) {
  try {
    const feed = await parser.parseURL(source.feedUrl);
    const articles = feed.items.slice(0, maxPerSource).map((item) => ({
      title: (item.title ?? '').trim(),
      url: (item.link ?? '').trim(),
      source: source.name,
      category: source.category ?? 'general',
      publishedAt: item.isoDate ?? item.pubDate ?? null,
    }));

    // Filter out entries missing a title or url
    return articles.filter((a) => a.title && a.url);
  } catch (err) {
    console.warn(`⚠  Failed to fetch "${source.name}": ${err.message}`);
    return [];
  }
}

/**
 * Deduplicate articles by URL (keep earliest occurrence).
 */
function dedup(articles) {
  const seen = new Set();
  return articles.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const config = await loadConfig();

  console.log(`📡  Fetching from ${config.sources.length} sources…`);

  const parser = new Parser({
    timeout: config.timeout,
    headers: {
      'User-Agent': 'johns-site-content/1.0 (news aggregator)',
    },
  });

  // Fetch all feeds concurrently
  const results = await Promise.all(
    config.sources.map((source) => fetchFeed(parser, source, config.maxPerSource))
  );

  // Flatten, dedup, sort by date (newest first), and cap at maxTotal
  let articles = dedup(results.flat());

  articles.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  articles = articles.slice(0, config.maxTotal);

  // Build the combined output payload
  const generatedAt = new Date().toISOString();
  const output = {
    generatedAt,
    count: articles.length,
    articles,
  };

  if (isDryRun) {
    console.log(JSON.stringify(output, null, 2));
    console.log(`\n✅  Dry run complete — ${output.count} articles collected.`);
    return;
  }

  // Ensure the output directory exists
  const outDir = resolve(ROOT, dirname(config.outputFile));
  await mkdir(outDir, { recursive: true });

  // Write combined file
  const outPath = resolve(ROOT, config.outputFile);
  await writeFile(outPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`✅  Wrote ${output.count} articles to ${config.outputFile}`);

  // Write per-category files
  const byCategory = {};
  for (const article of articles) {
    (byCategory[article.category] ??= []).push(article);
  }

  for (const [category, catArticles] of Object.entries(byCategory)) {
    const catOutput = {
      generatedAt,
      category,
      count: catArticles.length,
      articles: catArticles,
    };
    const catPath = resolve(outDir, `${category}.json`);
    await writeFile(catPath, JSON.stringify(catOutput, null, 2), 'utf-8');
    console.log(`   📁  ${category}.json — ${catArticles.length} articles`);
  }
}

main().catch((err) => {
  console.error('💥  Fatal error:', err);
  process.exit(1);
});
