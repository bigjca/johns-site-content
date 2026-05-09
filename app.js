// State
let allArticles = [];
let currentCategory = 'all';

// DOM Elements
const grid = document.getElementById('articles-grid');
const loading = document.getElementById('loading');
const errorState = document.getElementById('error-state');
const retryBtn = document.getElementById('retry-btn');
const lastUpdatedEl = document.getElementById('last-updated');
const navBtns = document.querySelectorAll('.nav-btn');

// Initialize
document.addEventListener('DOMContentLoaded', init);
retryBtn.addEventListener('click', init);

navBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    // Update active state
    navBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Filter and render
    currentCategory = e.target.dataset.category;
    renderArticles();
  });
});

async function init() {
  showLoading();
  
  try {
    // We fetch the combined news.json so we can filter locally. 
    // In a massive app, we'd fetch individual category files dynamically.
    const response = await fetch('./output/news.json');
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    allArticles = data.articles;
    
    // Format the last updated time
    const updatedDate = new Date(data.generatedAt);
    lastUpdatedEl.textContent = `Last updated: ${updatedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    renderArticles();
  } catch (err) {
    console.error('Failed to fetch news:', err);
    showError();
  }
}

function renderArticles() {
  grid.innerHTML = '';
  
  // Filter based on selected category
  const filtered = currentCategory === 'all' 
    ? allArticles 
    : allArticles.filter(a => a.category === currentCategory);

  // Stagger the animation delay for a cascading load effect
  filtered.forEach((article, index) => {
    const delay = index * 0.03; // 30ms stagger per card
    const card = createArticleCard(article, delay);
    grid.appendChild(card);
  });

  hideLoading();
}

function createArticleCard(article, delay) {
  const a = document.createElement('a');
  a.href = article.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'card';
  a.dataset.cat = article.category;
  a.style.animationDelay = `${delay}s`;

  // Format relative time (e.g. "2 hours ago")
  const pubDate = article.publishedAt ? new Date(article.publishedAt) : null;
  const timeString = pubDate ? getRelativeTime(pubDate) : 'Unknown time';

  a.innerHTML = `
    <div class="card-meta">
      <span class="badge">${article.category}</span>
      <span class="source-name">${article.source}</span>
    </div>
    <h2>${escapeHtml(article.title)}</h2>
    <div class="card-footer">
      <span class="time">${timeString}</span>
      <span class="read-more">Read <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
    </div>
  `;

  return a;
}

// Helpers
function showLoading() {
  loading.classList.remove('hidden');
  errorState.classList.add('hidden');
  grid.classList.add('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
  errorState.classList.add('hidden');
  grid.classList.remove('hidden');
}

function showError() {
  loading.classList.add('hidden');
  errorState.classList.remove('hidden');
  grid.classList.add('hidden');
}

function escapeHtml(unsafe) {
  return (unsafe || '')
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getRelativeTime(date) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
  const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));

  if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, 'day');
  if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, 'hour');
  return rtf.format(minutesDifference, 'minute');
}
