// State
let allArticles = [];
let currentCategory = 'all';

// DOM Elements
const listContainer = document.getElementById('articles-list');
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
  listContainer.innerHTML = '';
  
  // Filter based on selected category
  const filtered = currentCategory === 'all' 
    ? allArticles 
    : allArticles.filter(a => a.category === currentCategory);

  // Stagger the animation delay slightly for a clean load effect
  filtered.forEach((article, index) => {
    const delay = index * 0.02; // 20ms stagger per item
    const listItem = createListItem(article, delay);
    listContainer.appendChild(listItem);
  });

  hideLoading();
}

function createListItem(article, delay) {
  const a = document.createElement('a');
  a.href = article.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'list-item';
  a.dataset.cat = article.category;
  a.style.animationDelay = `${delay}s`;

  // Format relative time (e.g. "2h ago")
  const pubDate = article.publishedAt ? new Date(article.publishedAt) : null;
  const timeString = pubDate ? getRelativeTime(pubDate) : 'Unknown time';

  a.innerHTML = `
    <h2>${escapeHtml(article.title)}</h2>
    <div class="meta">
      <span class="badge">${article.category}</span>
      <span class="source-name">${article.source}</span>
      <span class="dot">•</span>
      <span class="time">${timeString}</span>
    </div>
  `;

  return a;
}

// Helpers
function showLoading() {
  loading.classList.remove('hidden');
  errorState.classList.add('hidden');
  listContainer.classList.add('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
  errorState.classList.add('hidden');
  listContainer.classList.remove('hidden');
}

function showError() {
  loading.classList.add('hidden');
  errorState.classList.remove('hidden');
  listContainer.classList.add('hidden');
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
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'narrow' });
  const daysDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const hoursDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60 * 60));
  const minutesDifference = Math.round((date.getTime() - new Date().getTime()) / (1000 * 60));

  if (Math.abs(daysDifference) > 0) return rtf.format(daysDifference, 'day');
  if (Math.abs(hoursDifference) > 0) return rtf.format(hoursDifference, 'hour');
  return rtf.format(minutesDifference, 'minute');
}
