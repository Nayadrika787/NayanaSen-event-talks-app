// State management
let allUpdates = [];
let filteredUpdates = [];
let currentFilter = 'all';
let currentSearch = '';
let activeUpdateForTweet = null;
let activeTemplate = 'tech-news';

// Elements
const feedList = document.getElementById('feed-list');
const loadingState = document.getElementById('loading-state');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const cacheTimeDisplay = document.getElementById('cache-time-display');
const themeToggle = document.getElementById('theme-toggle');
const themeIconLight = document.getElementById('theme-icon-light');
const themeIconDark = document.getElementById('theme-icon-dark');
const categoryPills = document.getElementById('category-pills');

// Stats Elements
const statTotal = document.querySelector('#stat-total .stat-value');
const statFeatures = document.querySelector('#stat-features .stat-value');
const statIssues = document.querySelector('#stat-issues .stat-value');
const statAnnouncements = document.querySelector('#stat-announcements .stat-value');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const previewBadge = document.getElementById('preview-badge');
const previewDate = document.getElementById('preview-date');
const previewText = document.getElementById('preview-text');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const lengthWarning = document.getElementById('length-warning');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');
const templateBtns = document.querySelectorAll('.template-btn');

// Toast Element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Theme Initializer
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark-theme');
        themeIconLight.classList.add('hidden');
        themeIconDark.classList.remove('hidden');
    } else {
        document.documentElement.classList.add('dark-theme');
        themeIconLight.classList.remove('hidden');
        themeIconDark.classList.add('hidden');
    }
}

// Toggle Theme
function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark-theme');
    if (isDark) {
        document.documentElement.classList.remove('dark-theme');
        localStorage.setItem('theme', 'light');
        themeIconLight.classList.add('hidden');
        themeIconDark.classList.remove('hidden');
    } else {
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('theme', 'dark');
        themeIconLight.classList.remove('hidden');
        themeIconDark.classList.add('hidden');
    }
}

// Toast notification helper
function showToast(message, duration = 3000) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

// Get Badge Class
function getCategoryType(categoryStr) {
    const cat = categoryStr.toLowerCase();
    if (cat.includes('feature')) return 'feature';
    if (cat.includes('issue') || cat.includes('fix') || cat.includes('resolved')) return 'issue';
    if (cat.includes('announcement')) return 'announcement';
    if (cat.includes('deprecation') || cat.includes('deprecated')) return 'deprecation';
    if (cat.includes('change') || cat.includes('changed') || cat.includes('updated')) return 'changed';
    return 'other';
}

// Parse feed raw HTML content into individual update chunks
function parseFeedEntries(entries) {
    const updates = [];
    const parser = new DOMParser();

    entries.forEach(entry => {
        const doc = parser.parseFromString(entry.summary, 'text/html');
        const children = Array.from(doc.body.children);
        
        if (children.length === 0) {
            // Fallback for simple/empty notes
            updates.push({
                id: entry.id,
                date: entry.title,
                link: entry.link,
                category: 'Announcement',
                content: entry.summary,
                plainText: doc.body.textContent.trim()
            });
            return;
        }

        let currentCategory = 'Announcement'; // Default
        let currentElements = [];

        children.forEach(child => {
            if (child.tagName === 'H3') {
                // Save previous chunk
                if (currentElements.length > 0) {
                    updates.push({
                        id: `${entry.id}-${updates.length}`,
                        date: entry.title,
                        link: entry.link,
                        category: currentCategory,
                        content: currentElements.map(el => el.outerHTML).join(''),
                        plainText: currentElements.map(el => el.textContent.trim()).join(' ')
                    });
                    currentElements = [];
                }
                currentCategory = child.textContent.trim();
            } else {
                currentElements.push(child);
            }
        });

        // Save last chunk
        if (currentElements.length > 0 || updates.length === 0) {
            updates.push({
                id: `${entry.id}-${updates.length}`,
                date: entry.title,
                link: entry.link,
                category: currentCategory,
                content: currentElements.length > 0 ? currentElements.map(el => el.outerHTML).join('') : entry.summary,
                plainText: currentElements.length > 0 ? currentElements.map(el => el.textContent.trim()).join(' ') : doc.body.textContent.trim()
            });
        }
    });

    return updates;
}

// Fetch Release Notes
async function fetchReleaseNotes(force = false) {
    loadingState.classList.remove('hidden');
    feedList.classList.add('hidden');
    emptyState.classList.add('hidden');
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const response = await fetch(`/api/release-notes${force ? '?refresh=true' : ''}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            allUpdates = parseFeedEntries(result.entries);
            cacheTimeDisplay.textContent = `Last sync: ${result.last_updated.split(' ')[1]}`;
            updateDashboardStats();
            applyFilterAndSearch();
            if (force) {
                showToast('Release notes successfully updated!');
            }
        } else {
            console.error('API Error:', result.message);
            showToast(`Failed to load: ${result.message}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        showToast('Network error: Failed to fetch updates.');
    } finally {
        loadingState.classList.add('hidden');
        feedList.classList.remove('hidden');
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
        lucide.createIcons();
    }
}

// Update Dashboard Statistics
function updateDashboardStats() {
    statTotal.textContent = allUpdates.length;
    
    const features = allUpdates.filter(item => getCategoryType(item.category) === 'feature').length;
    const issues = allUpdates.filter(item => getCategoryType(item.category) === 'issue').length;
    const announcements = allUpdates.filter(item => getCategoryType(item.category) === 'announcement').length;
    
    statFeatures.textContent = features;
    statIssues.textContent = issues;
    statAnnouncements.textContent = announcements;
}

// Filter and Search Updates
function applyFilterAndSearch() {
    filteredUpdates = allUpdates.filter(item => {
        // Category Filter
        const categoryType = getCategoryType(item.category);
        const matchesCategory = currentFilter === 'all' || categoryType === currentFilter;
        
        // Search Query
        const searchLower = currentSearch.toLowerCase();
        const matchesSearch = !currentSearch || 
            item.category.toLowerCase().includes(searchLower) ||
            item.date.toLowerCase().includes(searchLower) ||
            item.plainText.toLowerCase().includes(searchLower);
            
        return matchesCategory && matchesSearch;
    });

    renderFeedList();
}

// Render Feed list DOM
function renderFeedList() {
    feedList.innerHTML = '';
    
    if (filteredUpdates.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');

    filteredUpdates.forEach(update => {
        const itemType = getCategoryType(update.category);
        const card = document.createElement('div');
        card.className = `feed-item`;
        card.dataset.id = update.id;
        
        card.innerHTML = `
            <div class="feed-item-header">
                <div class="badge-date-row">
                    <span class="badge ${itemType}">${update.category}</span>
                    <span class="item-date">${update.date}</span>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-icon copy-link-btn" title="Copy update link" data-link="${update.link}">
                        <i data-lucide="link"></i>
                    </button>
                    <button class="btn btn-primary prepare-tweet-btn" title="Tweet about this update">
                        <i data-lucide="twitter"></i>
                        <span>Tweet</span>
                    </button>
                </div>
            </div>
            <div class="feed-item-content">
                ${update.content}
            </div>
        `;
        
        // Wire copy link button
        card.querySelector('.copy-link-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const link = e.currentTarget.dataset.link;
            navigator.clipboard.writeText(link).then(() => {
                showToast('Link copied to clipboard!');
            });
        });

        // Wire tweet prepare button
        card.querySelector('.prepare-tweet-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            openTweetModal(update);
        });

        feedList.appendChild(card);
    });

    lucide.createIcons();
}

// Generate Tweet text based on Template
function generateTweetText(update, templateType) {
    const plain = update.plainText.replace(/\s+/g, ' ').trim();
    // Clean up markdown style details
    const cleanPlain = plain.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); 
    const dateStr = update.date;
    const url = update.link;
    const hashtags = ' #BigQuery #GoogleCloud #DataEngineering';
    
    let template = '';
    
    switch (templateType) {
        case 'quick-tip':
            // 💡 BigQuery Tech Tip
            const summaryTip = cleanPlain.length > 130 ? cleanPlain.substring(0, 130) + '...' : cleanPlain;
            template = `💡 BigQuery Update (${update.category}):\n\n"${summaryTip}"\n\nDetails here: ${url}\n#GCP #Analytics`;
            break;
            
        case 'minimal':
            // Short summary
            const summaryMin = cleanPlain.length > 150 ? cleanPlain.substring(0, 150) + '...' : cleanPlain;
            template = `${update.category} in #BigQuery (${dateStr}):\n\n${summaryMin}\n\n${url}`;
            break;
            
        case 'tech-news':
        default:
            // Professional tech news
            const summaryNews = cleanPlain.length > 120 ? cleanPlain.substring(0, 120) + '...' : cleanPlain;
            template = `🚀 BigQuery Update - ${dateStr}\n\n🔹 ${update.category}: ${summaryNews}\n\nRead more here: ${url}${hashtags}`;
            break;
    }
    
    return template;
}

// Open Tweet Modal
function openTweetModal(update) {
    activeUpdateForTweet = update;
    
    // Set previews
    const itemType = getCategoryType(update.category);
    previewBadge.className = `badge ${itemType}`;
    previewBadge.textContent = update.category;
    previewDate.textContent = update.date;
    previewText.textContent = update.plainText;
    
    // Generate draft
    const tweetText = generateTweetText(update, activeTemplate);
    tweetTextarea.value = tweetText;
    
    updateCharacterCount();
    
    // Show Modal
    tweetModal.classList.remove('hidden');
    tweetTextarea.focus();
}

// Close Tweet Modal
function closeTweetModal() {
    tweetModal.classList.add('hidden');
    activeUpdateForTweet = null;
}

// Update Character count & limits
function updateCharacterCount() {
    const len = tweetTextarea.value.length;
    charCounter.textContent = `${len} / 280`;
    
    if (len > 280) {
        charCounter.classList.add('danger');
        lengthWarning.classList.remove('hidden');
    } else {
        charCounter.classList.remove('danger');
        lengthWarning.classList.add('hidden');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleaseNotes(false);
    
    // Theme toggle click
    themeToggle.addEventListener('click', toggleTheme);
    
    // Refresh click
    refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    
    // Search inputs
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        if (currentSearch) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        applyFilterAndSearch();
    });
    
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        clearSearchBtn.classList.add('hidden');
        applyFilterAndSearch();
        searchInput.focus();
    });
    
    // Category pill filtering
    categoryPills.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;
        
        // Remove active class from all pills
        categoryPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        
        // Set active
        pill.classList.add('active');
        currentFilter = pill.dataset.category;
        
        applyFilterAndSearch();
    });
    
    // Modal events
    closeModalBtn.addEventListener('click', closeTweetModal);
    
    // Template switcher
    templateBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            templateBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            activeTemplate = e.currentTarget.dataset.template;
            
            if (activeUpdateForTweet) {
                tweetTextarea.value = generateTweetText(activeUpdateForTweet, activeTemplate);
                updateCharacterCount();
            }
        });
    });
    
    // Textarea input count
    tweetTextarea.addEventListener('input', updateCharacterCount);
    
    // Copy Tweet button
    copyTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        navigator.clipboard.writeText(text).then(() => {
            showToast('Tweet draft copied to clipboard!');
        });
    });
    
    // Post Tweet button
    postTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
        showToast('Redirected to X (Twitter)!');
    });
});
