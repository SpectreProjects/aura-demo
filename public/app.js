const staff = ['Caitlin', 'John', 'Emma', 'Daniel', 'Sophie'];

const reviewTemplates = [
  {
    rating: 5,
    text: 'Caitlin at reception was incredible from the moment we arrived at Hilton Glasgow. She made check-in smooth, warm and genuinely welcoming.'
  },
  {
    rating: 5,
    text: 'Housekeeping was excellent throughout our stay, and Emma did a fantastic job keeping the room spotless and comfortable.'
  },
  {
    rating: 4,
    text: 'Breakfast was very good with plenty of choice. John in the restaurant was attentive, and Caitlin helped us with a late checkout.'
  },
  {
    rating: 3,
    text: 'The hotel was comfortable and well located, though the lifts were busy at peak times. Sophie at the concierge desk gave helpful directions into Glasgow.'
  },
  {
    rating: 2,
    text: 'Our room was not ready when we arrived, which was disappointing after a long journey. Caitlin was professional and kept us updated while Daniel arranged our bags.'
  },
  {
    rating: 1,
    text: 'There was a noise issue overnight and it affected our rest. Caitlin apologised at reception the next morning, but it was still a frustrating stay.'
  },
  {
    rating: 5,
    text: 'The concierge service was excellent. Sophie recommended a restaurant nearby, and Caitlin made sure our taxi was arranged on time.'
  },
  {
    rating: 4,
    text: 'The front desk team were polished and helpful. Caitlin and John both made us feel looked after during a busy weekend in Glasgow.'
  }
];

const state = {
  reviews: [],
  events: [],
  leaderboard: [],
  totals: {
    generated: 0,
    processed: 0,
    staffMentions: 0
  }
};

const sessionKey = 'auraDashboardEntered';

const refs = {
  loginScreen: document.querySelector('#loginScreen'),
  dashboardShell: document.querySelector('#dashboardShell'),
  overviewView: document.querySelector('#overviewView'),
  recognitionView: document.querySelector('#recognitionView'),
  overviewNav: document.querySelector('#overviewNav'),
  recognitionNav: document.querySelector('#recognitionNav'),
  navItems: document.querySelectorAll('.nav-item'),
  enterDashboard: document.querySelector('#enterDashboard'),
  logoutButton: document.querySelector('#logoutButton'),
  modeStatus: document.querySelector('#modeStatus'),
  modelName: document.querySelector('#modelName'),
  generatedCount: document.querySelector('#generatedCount'),
  processedCount: document.querySelector('#successCount'),
  reviewCount: document.querySelector('#reviewCount'),
  staffMentionCount: document.querySelector('#staffMentionCount'),
  reviews: document.querySelector('#reviews'),
  recognitionInsights: document.querySelector('#recognitionInsights'),
  leaderboard: document.querySelector('#leaderboard'),
  milestones: document.querySelector('#milestones'),
  latestMentions: document.querySelector('#latestMentions'),
  events: document.querySelector('#events'),
  generateNow: document.querySelector('#generateNow'),
  apiStatus: document.querySelector('#apiStatus'),
  demoStatus: document.querySelector('#demoStatus'),
  connectionStatus: document.querySelector('#connectionStatus')
};

refs.enterDashboard?.addEventListener('click', () => {
  sessionStorage.setItem(sessionKey, 'true');
  showDashboard();
});

refs.logoutButton?.addEventListener('click', () => {
  sessionStorage.removeItem(sessionKey);
  window.location.href = './login.html';
});

refs.overviewNav?.addEventListener('click', (event) => {
  event.preventDefault();
  showAppView('overview');
});

refs.recognitionNav?.addEventListener('click', (event) => {
  event.preventDefault();
  showAppView('recognition');
});

for (const item of refs.navItems) {
  if (item === refs.overviewNav || item === refs.recognitionNav) {
    continue;
  }

  item.addEventListener('click', () => {
    showAppView('overview');
  });
}

refs.generateNow?.addEventListener('click', () => {
  refs.generateNow.disabled = true;
  refs.generateNow.textContent = 'Generating...';

  const review = createMockReview();
  processMockReview(review);
  render();

  refs.generateNow.disabled = false;
  refs.generateNow.textContent = 'Generate now';
});

const initialHash = window.location.hash;

if (initialHash === '#login' || initialHash === '#product') {
  sessionStorage.removeItem(sessionKey);
  showLogin();
} else if (sessionStorage.getItem(sessionKey) === 'true') {
  showDashboard();
} else {
  showDashboard();
}

if (initialHash === '#recognition') {
  showAppView('recognition');
}

loadPresetReviews();
render();

function showDashboard() {
  refs.loginScreen?.classList.add('is-hidden');
  refs.dashboardShell?.classList.remove('is-hidden');
}

function showLogin() {
  if (!refs.loginScreen) {
    window.location.href = './login.html';
    return;
  }

  refs.loginScreen.classList.remove('is-hidden');
  refs.dashboardShell?.classList.add('is-hidden');
}

function showAppView(view) {
  const isRecognition = view === 'recognition';

  refs.overviewView.classList.toggle('is-hidden', isRecognition);
  refs.recognitionView.classList.toggle('is-hidden', !isRecognition);
  refs.overviewNav.classList.toggle('active', !isRecognition);
  refs.recognitionNav.classList.toggle('active', isRecognition);
}

function createMockReview() {
  const template = reviewTemplates[state.totals.generated % reviewTemplates.length];
  return createMockReviewFromTemplate(template, 'Manual demo');
}

function createMockReviewFromTemplate(template, source) {
  return {
    id: `mock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    rating: template.rating,
    text: template.text,
    status: 'Processed',
    reply: '',
    staffNames: [],
    sentiment: getSentiment(template.rating),
    source,
    createdAt: new Date().toISOString()
  };
}

function loadPresetReviews() {
  if (state.reviews.length > 0) {
    return;
  }

  for (const template of reviewTemplates) {
    processMockReview(createMockReviewFromTemplate(template, 'Preset mock'));
  }
}

function processMockReview(review) {
  review.staffNames = extractStaffNames(review.text);
  review.reply = createReply(review.rating);

  state.reviews.unshift(review);
  state.reviews = state.reviews.slice(0, 50);
  state.totals.generated += 1;
  state.totals.processed += 1;
  state.totals.staffMentions += review.staffNames.length;

  rebuildLeaderboard();
  addEvent(`Processed ${review.id} in manual mock mode`);
}

function createReply(rating) {
  if (rating === 5) {
    return 'Thank you for your kind feedback. We’re delighted to hear our team made such a positive impression during your stay at Hilton Glasgow, and we truly appreciate you taking the time to share your experience.';
  }

  if (rating === 1) {
    return 'Thank you for sharing your feedback. We’re sincerely sorry that your stay did not reflect the high standards we aim to provide at Hilton Glasgow, and we would appreciate the opportunity to look into this properly with our team.';
  }

  return 'Thank you for your considered feedback. We’re pleased there were aspects of your stay you enjoyed, and we will share your comments with the team as we continue to improve the guest experience at Hilton Glasgow.';
}

function extractStaffNames(text) {
  return staff.filter((name) => new RegExp(`\\b${name}\\b`, 'i').test(text));
}

function getSentiment(rating) {
  if (rating === 5) return 'positive';
  if (rating === 1) return 'negative';
  return 'neutral';
}

function rebuildLeaderboard() {
  state.leaderboard = getRecognitionStats().staffStats;
}

function getRecognitionStats() {
  const counts = new Map();
  const latestMentions = [];

  for (const review of state.reviews) {
    for (const name of review.staffNames) {
      const current = counts.get(name) || {
        name,
        mentions: 0,
        latestMentionAt: review.createdAt,
        sentiment: {
          positive: 0,
          mixed: 0,
          negative: 0
        },
        latestReviewText: review.text
      };
      const sentiment = getRecognitionSentiment(review.sentiment);

      counts.set(name, {
        ...current,
        mentions: current.mentions + 1,
        latestMentionAt: new Date(review.createdAt) > new Date(current.latestMentionAt)
          ? review.createdAt
          : current.latestMentionAt,
        latestReviewText: new Date(review.createdAt) > new Date(current.latestMentionAt)
          ? review.text
          : current.latestReviewText,
        sentiment: {
          ...current.sentiment,
          [sentiment]: current.sentiment[sentiment] + 1
        }
      });

      latestMentions.push({
        name,
        reviewText: review.text,
        rating: review.rating,
        sentiment,
        createdAt: review.createdAt
      });
    }
  }

  const staffStats = [...counts.values()]
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));

  return {
    staffStats,
    latestMentions: latestMentions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  };
}

function addEvent(message) {
  state.events.unshift({
    id: `event_${Date.now().toString(36)}`,
    message,
    createdAt: new Date().toISOString()
  });
  state.events = state.events.slice(0, 12);
}

function render() {
  const recognition = getRecognitionStats();

  refs.modeStatus.textContent = 'Mock Mode Active';
  refs.modelName.textContent = 'Manual Demo Mode';
  refs.apiStatus.textContent = 'No AI API connected';
  refs.demoStatus.textContent = 'Manual Demo Mode';
  refs.connectionStatus.textContent = 'Local only';
  refs.generatedCount.textContent = state.totals.generated;
  refs.processedCount.textContent = state.totals.processed;
  refs.reviewCount.textContent = `${state.reviews.length} stored`;
  refs.staffMentionCount.textContent = state.totals.staffMentions;

  refs.reviews.innerHTML = state.reviews.length
    ? state.reviews.map(renderReview).join('')
    : '<div class="empty">Click Generate now to create one mock review.</div>';

  refs.recognitionInsights.innerHTML = renderRecognitionInsights(recognition.staffStats);
  refs.leaderboard.innerHTML = recognition.staffStats.length
    ? recognition.staffStats.map(renderLeaderboardItem).join('')
    : '<div class="empty recognition-empty">Recognition data will appear here once reviews mention team members.</div>';
  refs.milestones.innerHTML = renderMilestones(recognition.staffStats);
  refs.latestMentions.innerHTML = recognition.latestMentions.length
    ? recognition.latestMentions.slice(0, 6).map(renderLatestMention).join('')
    : '<div class="empty recognition-empty">Recognition data will appear here once reviews mention team members.</div>';

  refs.events.innerHTML = state.events.length
    ? state.events.map(renderEvent).join('')
    : '<div class="empty">No manual runs yet.</div>';
}

function renderReview(review) {
  const staffTags = review.staffNames.length
    ? review.staffNames.map((name) => `<span class="tag">${escapeHtml(name)}</span>`).join('')
    : '<span class="tag">No staff mentioned</span>';

  return `
    <article class="review">
      <div class="review-top">
        <div class="review-meta">
          <span>${escapeHtml(review.id)}</span>
          <span>${formatDate(review.createdAt)}</span>
          <span>${escapeHtml(review.source)}</span>
          <span>Mock pipeline</span>
        </div>
        <div class="stars" aria-label="${review.rating} out of 5 stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
      </div>
      <p class="review-text">${escapeHtml(review.text)}</p>
      <p class="reply">${escapeHtml(review.reply)}</p>
      <div class="staff-row">
        <span class="tag ${escapeHtml(review.sentiment)}">${escapeHtml(review.sentiment)}</span>
        <span class="tag">${escapeHtml(review.status)}</span>
        ${staffTags}
      </div>
    </article>
  `;
}

function renderLeaderboardItem(item, index) {
  const isTopPerformer = index === 0;
  const tier = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
  const mixedNegative = item.sentiment.mixed + item.sentiment.negative;
  const status = getRecognitionStatus(item, index);

  return `
    <div class="leaderboard-item leaderboard-row ${isTopPerformer ? 'top-performer' : ''} ${tier}">
      <span class="rank">#${index + 1}</span>
      <div class="leaderboard-main">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="mentions">Latest ${formatDate(item.latestMentionAt)}</span>
      </div>
      <strong class="table-number">${item.mentions}</strong>
      <strong class="table-number positive-count">${item.sentiment.positive}</strong>
      <strong class="table-number mixed-count">${mixedNegative}</strong>
      <p class="leaderboard-excerpt">${escapeHtml(createExcerpt(item.latestReviewText, 84))}</p>
      <div class="recognition-status">
        <span>${escapeHtml(status)}</span>
        ${isTopPerformer ? '<span class="top-badge">Top recognised</span>' : ''}
      </div>
    </div>
  `;
}

function renderRecognitionInsights(staffStats) {
  const topMember = staffStats[0];
  const totalMentions = staffStats.reduce((sum, item) => sum + item.mentions, 0);
  const positiveMentions = staffStats.reduce((sum, item) => sum + item.sentiment.positive, 0);
  const latestRecognition = staffStats
    .filter((item) => item.latestMentionAt)
    .sort((a, b) => new Date(b.latestMentionAt) - new Date(a.latestMentionAt))[0];
  const bestSentiment = staffStats
    .map((item) => ({
      name: item.name,
      score: getSentimentScore(item)
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))[0];

  return `
    <article class="insight-card">
      <span>Total staff mentions</span>
      <strong>${totalMentions}</strong>
      <small>Across stored mock reviews</small>
    </article>
    <article class="insight-card">
      <span>Most recognised</span>
      <strong>${escapeHtml(topMember?.name || 'Awaiting data')}</strong>
      <small>${topMember ? `${topMember.mentions} total mentions` : 'No mentions yet'}</small>
    </article>
    <article class="insight-card">
      <span>Positive mentions</span>
      <strong>${positiveMentions}</strong>
      <small>${bestSentiment ? `${bestSentiment.name} leads sentiment quality` : 'No positive mentions yet'}</small>
    </article>
    <article class="insight-card">
      <span>Latest recognition</span>
      <strong>${escapeHtml(latestRecognition?.name || 'Awaiting data')}</strong>
      <small>${latestRecognition ? formatDate(latestRecognition.latestMentionAt) : 'No latest mention yet'}</small>
    </article>
  `;
}

function renderMilestones(staffStats) {
  const topMember = staffStats[0];
  const positiveStreakMember = staffStats.find((item) => item.sentiment.positive >= 3 && item.sentiment.negative === 0);
  const milestones = [
    {
      title: 'First Mention',
      detail: topMember ? `${topMember.name} unlocked recognition tracking` : 'Waiting for first staff mention',
      unlocked: Boolean(topMember)
    },
    {
      title: '5 Mentions',
      detail: topMember?.mentions >= 5 ? `${topMember.name} reached 5 mentions` : 'No team member has reached 5 mentions yet',
      unlocked: Boolean(topMember?.mentions >= 5)
    },
    {
      title: '10 Mentions',
      detail: topMember?.mentions >= 10 ? `${topMember.name} reached 10 mentions` : 'Locked until one person reaches 10 mentions',
      unlocked: Boolean(topMember?.mentions >= 10)
    },
    {
      title: 'Most Recognised',
      detail: topMember ? `${topMember.name} leads with ${topMember.mentions} mentions` : 'Waiting for recognition data',
      unlocked: Boolean(topMember)
    },
    {
      title: 'Positive feedback streak',
      detail: positiveStreakMember ? `${positiveStreakMember.name} has a clean positive streak` : 'Locked until 3 positive mentions and no negative mentions',
      unlocked: Boolean(positiveStreakMember)
    }
  ];

  return milestones.map((milestone) => `
    <article class="milestone-card ${milestone.unlocked ? 'unlocked' : 'locked'}">
      <span>${milestone.unlocked ? 'Unlocked' : 'Locked'}</span>
      <strong>${escapeHtml(milestone.title)}</strong>
      <small>${escapeHtml(milestone.detail)}</small>
    </article>
  `).join('');
}

function renderLatestMention(mention) {
  return `
    <article class="mention-card">
      <div>
        <strong>${escapeHtml(mention.name)}</strong>
        <span>${formatDate(mention.createdAt)}</span>
      </div>
      <p>${escapeHtml(createExcerpt(mention.reviewText))}</p>
      <div class="mention-meta">
        <span>${mention.rating} stars</span>
        <span class="${escapeHtml(mention.sentiment)}">${escapeHtml(mention.sentiment)}</span>
      </div>
    </article>
  `;
}

function getRecognitionSentiment(sentiment) {
  return sentiment === 'neutral' ? 'mixed' : sentiment;
}

function getSentimentScore(item) {
  const total = item.sentiment.positive + item.sentiment.mixed + item.sentiment.negative;
  if (!total) {
    return 0;
  }

  return Math.round(((item.sentiment.positive * 100) + (item.sentiment.mixed * 50)) / total);
}

function createExcerpt(text, limit = 92) {
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function getRecognitionStatus(item, index) {
  if (index === 0) {
    return 'Most recognised';
  }

  if (item.sentiment.positive >= 2 && item.sentiment.negative === 0) {
    return 'Positive streak';
  }

  if (item.mentions >= 3) {
    return 'High visibility';
  }

  return 'Emerging';
}

function renderEvent(event) {
  return `
    <div class="event">
      <strong>${escapeHtml(event.message)}</strong>
      <span class="timestamp">${formatDate(event.createdAt)}</span>
    </div>
  `;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
