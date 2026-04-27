const defaultStaff = [
  { id: 'staff_caitlin', name: 'Caitlin', role: 'Front Desk' },
  { id: 'staff_john', name: 'John', role: 'Restaurant' },
  { id: 'staff_emma', name: 'Emma', role: 'Housekeeping' },
  { id: 'staff_daniel', name: 'Daniel', role: 'Porterage' },
  { id: 'staff_sophie', name: 'Sophie', role: 'Concierge' }
];

const reviewTemplates = [
  {
    id: 'review_apr_05_caitlin',
    date: '2026-04-05T10:18:00',
    rating: 5,
    text: 'Caitlin at reception was incredible from the moment we arrived at Hilton Glasgow. She made check-in smooth, warm and genuinely welcoming.'
  },
  {
    id: 'review_apr_08_emma',
    date: '2026-04-08T16:42:00',
    rating: 5,
    text: 'Housekeeping was excellent throughout our stay, and Emma did a fantastic job keeping the room spotless and comfortable.'
  },
  {
    id: 'review_apr_12_caitlin_john',
    date: '2026-04-12T09:24:00',
    rating: 4,
    text: 'Breakfast was very good with plenty of choice. John in the restaurant was attentive, and Caitlin helped us with a late checkout.'
  },
  {
    id: 'review_apr_14_sophie',
    date: '2026-04-14T18:10:00',
    rating: 3,
    text: 'The hotel was comfortable and well located, though the lifts were busy at peak times. Sophie at the concierge desk gave helpful directions into Glasgow.'
  },
  {
    id: 'review_apr_18_caitlin_daniel',
    date: '2026-04-18T14:35:00',
    rating: 2,
    text: 'Our room was not ready when we arrived, which was disappointing after a long journey. Caitlin was professional and kept us updated while Daniel arranged our bags.'
  },
  {
    id: 'review_apr_21_caitlin',
    date: '2026-04-21T08:15:00',
    rating: 5,
    text: 'Caitlin was so welcoming at the front desk and remembered our room preference from our previous stay.'
  },
  {
    id: 'review_apr_23_ambiguous',
    date: '2026-04-23T19:05:00',
    rating: 5,
    text: 'The girl with blonde hair at reception was fantastic and made us feel completely looked after.'
  },
  {
    id: 'review_apr_26_caitlin_sophie',
    date: '2026-04-26T12:20:00',
    rating: 5,
    text: 'The concierge service was excellent. Sophie recommended a restaurant nearby, and Caitlin made sure our taxi was arranged on time.'
  },
  {
    id: 'review_mar_07_john',
    date: '2026-03-07T09:40:00',
    rating: 4,
    text: 'John made breakfast feel calm even though the restaurant was busy, and the service was very polished.'
  },
  {
    id: 'review_mar_12_caitlin',
    date: '2026-03-12T15:30:00',
    rating: 5,
    text: 'Caitlin handled a room query beautifully and followed up later to make sure everything was right.'
  },
  {
    id: 'review_mar_18_emma_daniel',
    date: '2026-03-18T11:00:00',
    rating: 4,
    text: 'Emma did a lovely job with housekeeping, and Daniel helped us with luggage when we checked out.'
  },
  {
    id: 'review_mar_25_caitlin_john',
    date: '2026-03-25T20:15:00',
    rating: 5,
    text: 'Caitlin and John both made us feel looked after during a busy weekend in Glasgow.'
  }
];

const defaultRewards = [
  {
    id: 'reward_free_coffee',
    name: 'Free coffee',
    points: 5,
    description: 'A complimentary coffee from the hotel team café.',
    category: 'Food & Drink',
    status: 'Active'
  },
  {
    id: 'reward_meal_voucher',
    name: '£10 meal voucher',
    points: 10,
    description: 'A £10 voucher to use towards a team meal or staff dining option.',
    category: 'Food & Drink',
    status: 'Active'
  },
  {
    id: 'reward_paid_break',
    name: 'Extra paid break',
    points: 20,
    description: 'An additional paid break agreed with the duty manager.',
    category: 'Time Off',
    status: 'Active'
  }
];

const milestones = [
  { id: 'first', name: 'First Recognition', points: 1 },
  { id: 'five', name: '5 Positive Mentions', points: 5 },
  { id: 'ten', name: 'Guest Favourite', points: 10 },
  { id: 'twenty', name: 'Service Champion', points: 20 }
];

const storageKeys = {
  rewards: 'auraHiltonRewards',
  staff: 'auraHiltonStaff',
  assignments: 'auraHiltonManualAssignments',
  filters: 'auraHiltonRewardFilters'
};

const refs = {
  rewardForm: document.querySelector('#rewardForm'),
  rewardId: document.querySelector('#rewardId'),
  rewardName: document.querySelector('#rewardName'),
  rewardPoints: document.querySelector('#rewardPoints'),
  rewardDescription: document.querySelector('#rewardDescription'),
  rewardCategory: document.querySelector('#rewardCategory'),
  rewardSubmit: document.querySelector('#rewardSubmit'),
  rewardCards: document.querySelector('#rewardCards'),
  monthFilter: document.querySelector('#monthFilter'),
  milestoneFilter: document.querySelector('#milestoneFilter'),
  currentPeriodLabel: document.querySelector('#currentPeriodLabel'),
  monthlyView: document.querySelector('#monthlyView'),
  rewardsLeaderboard: document.querySelector('#rewardsLeaderboard'),
  manualForm: document.querySelector('#manualForm'),
  manualReview: document.querySelector('#manualReview'),
  manualStaff: document.querySelector('#manualStaff'),
  manualNote: document.querySelector('#manualNote'),
  manualMessage: document.querySelector('#manualMessage'),
  staffForm: document.querySelector('#staffForm'),
  staffName: document.querySelector('#staffName'),
  staffRole: document.querySelector('#staffRole'),
  staffMessage: document.querySelector('#staffMessage'),
  staffProgress: document.querySelector('#staffProgress'),
  rewardTimeline: document.querySelector('#rewardTimeline'),
  downloadReport: document.querySelector('#downloadReport'),
  printReport: document.querySelector('#printReport')
};

let rewards = loadFromStorage(storageKeys.rewards, defaultRewards);
let staff = loadFromStorage(storageKeys.staff, defaultStaff);
let manualAssignments = loadFromStorage(storageKeys.assignments, []);
let filters = loadFromStorage(storageKeys.filters, { month: 'this', milestone: 'all' });

refs.monthFilter.value = filters.month;
refs.milestoneFilter.value = filters.milestone;

refs.rewardForm.addEventListener('submit', handleRewardSubmit);
refs.rewardCards.addEventListener('click', handleRewardCardClick);
refs.monthFilter.addEventListener('change', () => updateFilters({ month: refs.monthFilter.value }));
refs.milestoneFilter.addEventListener('change', () => updateFilters({ milestone: refs.milestoneFilter.value }));
refs.manualForm.addEventListener('submit', handleManualAssignment);
refs.staffForm.addEventListener('submit', handleAddStaff);
refs.downloadReport.addEventListener('click', printReport);

render();

function handleRewardSubmit(event) {
  event.preventDefault();

  const reward = {
    id: refs.rewardId.value || `reward_${Date.now().toString(36)}`,
    name: refs.rewardName.value.trim(),
    points: Number(refs.rewardPoints.value),
    description: refs.rewardDescription.value.trim(),
    category: refs.rewardCategory.value,
    status: 'Active'
  };

  if (!reward.name || !reward.points || !reward.description) {
    return;
  }

  const existingIndex = rewards.findIndex((item) => item.id === reward.id);
  if (existingIndex >= 0) {
    rewards[existingIndex] = reward;
  } else {
    rewards.push(reward);
  }

  saveToStorage(storageKeys.rewards, rewards);
  refs.rewardForm.reset();
  refs.rewardId.value = '';
  refs.rewardSubmit.textContent = 'Create Reward';
  render();
}

function handleRewardCardClick(event) {
  const action = event.target.dataset.action;
  const id = event.target.dataset.id;

  if (!action || !id) {
    return;
  }

  if (action === 'delete') {
    rewards = rewards.filter((reward) => reward.id !== id);
    saveToStorage(storageKeys.rewards, rewards);
    render();
    return;
  }

  if (action === 'edit') {
    const reward = rewards.find((item) => item.id === id);
    if (!reward) return;

    refs.rewardId.value = reward.id;
    refs.rewardName.value = reward.name;
    refs.rewardPoints.value = reward.points;
    refs.rewardDescription.value = reward.description;
    refs.rewardCategory.value = reward.category;
    refs.rewardSubmit.textContent = 'Save Reward';
    refs.rewardName.focus();
  }
}

function handleManualAssignment(event) {
  event.preventDefault();

  const reviewId = refs.manualReview.value;
  const staffId = refs.manualStaff.value;
  const note = refs.manualNote.value.trim();
  const review = reviewTemplates.find((item) => item.id === reviewId);
  const person = staff.find((item) => item.id === staffId);

  if (!review || !person || !note) {
    return;
  }

  const existing = getAllRecognitionRecords().some((record) => (
    record.reviewId === reviewId && record.staffId === staffId
  ));

  if (existing) {
    refs.manualMessage.textContent = 'This review is already assigned to that staff member.';
    return;
  }

  manualAssignments.push({
    id: `manual_${Date.now().toString(36)}`,
    reviewId,
    staffId,
    note,
    createdAt: new Date().toISOString()
  });

  saveToStorage(storageKeys.assignments, manualAssignments);
  refs.manualForm.reset();
  refs.manualMessage.textContent = 'Recognition assigned. Manually assigned by manager.';
  render();
}

function handleAddStaff(event) {
  event.preventDefault();

  const name = refs.staffName.value.trim();
  const role = refs.staffRole.value.trim();

  if (!name || !role) {
    return;
  }

  const exists = staff.some((person) => person.name.toLowerCase() === name.toLowerCase());
  if (exists) {
    refs.staffMessage.textContent = 'That staff member already exists.';
    return;
  }

  staff.push({
    id: `staff_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString(36)}`,
    name,
    role
  });

  saveToStorage(storageKeys.staff, staff);
  refs.staffForm.reset();
  refs.staffMessage.textContent = `${name} added to the rewards programme.`;
  render();
}

function updateFilters(nextFilters) {
  filters = { ...filters, ...nextFilters };
  saveToStorage(storageKeys.filters, filters);
  render();
}

function render() {
  const sortedRewards = getSortedRewards();
  const allRecords = getAllRecognitionRecords();
  const period = getSelectedPeriod();
  const periodRecords = filterRecordsByPeriod(allRecords, period);
  const staffProfiles = calculateStaffProfiles(allRecords, periodRecords, sortedRewards);
  const filteredProfiles = filterProfilesByMilestone(staffProfiles);

  refs.currentPeriodLabel.textContent = period.label;
  refs.rewardCards.innerHTML = sortedRewards.length
    ? sortedRewards.map(renderRewardCard).join('')
    : '<div class="empty rewards-empty">Create a reward to start tracking staff progress.</div>';

  refs.monthlyView.innerHTML = filteredProfiles.length
    ? filteredProfiles.map((profile) => renderMonthlyCard(profile, period)).join('')
    : '<div class="empty rewards-empty">No staff match this milestone filter for the selected period.</div>';

  refs.rewardsLeaderboard.innerHTML = filteredProfiles.length
    ? filteredProfiles.map(renderRewardsLeaderboardRow).join('')
    : '<div class="empty rewards-empty">No staff match this milestone filter.</div>';

  refs.staffProgress.innerHTML = filteredProfiles.length
    ? filteredProfiles.map(renderStaffProfile).join('')
    : '<div class="empty rewards-empty">No staff match this milestone filter.</div>';

  refs.rewardTimeline.innerHTML = filteredProfiles.length
    ? filteredProfiles.map((profile) => renderTimeline(profile, periodRecords, sortedRewards)).join('')
    : '<div class="empty rewards-empty">Timeline data will appear once staff receive recognition.</div>';

  populateManualControls(allRecords);
}

function renderRewardCard(reward) {
  return `
    <article class="reward-card">
      <div class="reward-card-top">
        <span>${escapeHtml(reward.category)}</span>
        <strong>${reward.points} pts</strong>
      </div>
      <h3>${escapeHtml(reward.name)}</h3>
      <p>${escapeHtml(reward.description)}</p>
      <div class="reward-card-footer">
        <span class="reward-status">${escapeHtml(reward.status)}</span>
        <div>
          <button type="button" data-action="edit" data-id="${escapeHtml(reward.id)}">Edit</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(reward.id)}">Delete</button>
        </div>
      </div>
    </article>
  `;
}

function renderMonthlyCard(profile, period) {
  const nextMilestone = getNextMilestone(profile.periodPoints);
  const currentMilestone = getCurrentMilestone(profile.periodPoints);
  const rewardsUnlocked = getPeriodRewardUnlocks(profile).map((event) => event.reward.name);
  const milestoneStatus = milestones.map((milestone) => ({
    ...milestone,
    unlocked: profile.periodPoints >= milestone.points
  }));

  return `
    <article class="monthly-card">
      <div class="monthly-card-top">
        <div>
          <strong>${escapeHtml(profile.name)}</strong>
          <span>${escapeHtml(period.label)}</span>
        </div>
        <span>${profile.periodRecords.length} review${profile.periodRecords.length === 1 ? '' : 's'}</span>
      </div>
      <div class="monthly-review-list">
        ${profile.periodRecords.length
          ? profile.periodRecords.map((record) => `
              <div>
                <span>${formatShortDate(record.date)}: ${record.rating}★ review</span>
                <p>${escapeHtml(createExcerpt(record.text, 96))}</p>
              </div>
            `).join('')
          : '<p>No recognised reviews in this period.</p>'}
      </div>
      <div class="monthly-summary">
        <span>Points this period: <strong>${profile.periodPoints}</strong></span>
        <span>Current milestone: <strong>${escapeHtml(currentMilestone?.name || 'Not yet unlocked')}</strong></span>
        <span>Next milestone: <strong>${escapeHtml(nextMilestone?.name || 'All milestones reached')}</strong></span>
        <span>Rewards unlocked: <strong>${escapeHtml(rewardsUnlocked.join(', ') || 'None this period')}</strong></span>
      </div>
      <div class="monthly-milestones" aria-label="Milestone status">
        ${milestoneStatus.map((milestone) => `
          <span class="${milestone.unlocked ? 'unlocked' : 'locked'}">${escapeHtml(milestone.name)}</span>
        `).join('')}
      </div>
    </article>
  `;
}

function renderRewardsLeaderboardRow(profile, index) {
  const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
  const latest = profile.latestRecord ? createExcerpt(profile.latestRecord.text, 92) : 'No recognised reviews yet.';
  const progress = profile.nextMilestone
    ? Math.min(100, Math.round((profile.totalPoints / profile.nextMilestone.points) * 100))
    : 100;

  return `
    <article class="reward-leaderboard-row ${rankClass}">
      <div class="leaderboard-rank">#${index + 1}</div>
      <div class="leaderboard-person">
        <strong>${escapeHtml(profile.name)}</strong>
        <span>${escapeHtml(profile.role)}</span>
      </div>
      <div class="leaderboard-metric">
        <span>Total points</span>
        <strong>${profile.totalPoints}</strong>
      </div>
      <div class="leaderboard-metric">
        <span>Period points</span>
        <strong>${profile.periodPoints}</strong>
      </div>
      <div class="leaderboard-metric wide">
        <span>Current milestone</span>
        <strong>${escapeHtml(profile.currentMilestone?.name || 'Not yet unlocked')}</strong>
      </div>
      <div class="leaderboard-progress">
        <span>${escapeHtml(profile.nextMilestone ? `Next: ${profile.nextMilestone.name}` : 'All milestones reached')}</span>
        <div class="progress-track"><span style="width: ${progress}%"></span></div>
      </div>
      <p>${escapeHtml(latest)}</p>
    </article>
  `;
}

function renderStaffProfile(profile) {
  const progress = profile.nextReward
    ? Math.min(100, Math.round((profile.totalPoints / profile.nextReward.points) * 100))
    : 100;

  return `
    <article class="staff-progress-card staff-profile-card">
      <div class="staff-progress-header">
        <div>
          <strong>${escapeHtml(profile.name)}</strong>
          <span>${escapeHtml(profile.role)}</span>
        </div>
        <span>${profile.totalPoints} total pts</span>
      </div>
      <div class="profile-stat-grid">
        <div><span>Total points</span><strong>${profile.totalPoints}</strong></div>
        <div><span>Period points</span><strong>${profile.periodPoints}</strong></div>
        <div><span>Manual adjustments</span><strong>${profile.manualCount}</strong></div>
      </div>
      <div class="progress-track" aria-label="${progress}% progress">
        <span style="width: ${progress}%"></span>
      </div>
      <div class="staff-progress-meta">
        <span>Next reward: ${escapeHtml(profile.nextReward?.name || 'All rewards unlocked')}</span>
        <span>${profile.nextReward ? `${Math.max(0, profile.nextReward.points - profile.totalPoints)} pts to go` : 'Complete'}</span>
      </div>
      <div class="unlocked-rewards">
        ${profile.unlockedRewards.length
          ? profile.unlockedRewards.map((reward) => `<span>${escapeHtml(reward.name)}</span>`).join('')
          : '<span>No rewards unlocked yet</span>'}
      </div>
      <div class="milestone-mini-grid">
        ${milestones.map((milestone) => renderMilestoneProgress(profile.totalPoints, milestone)).join('')}
      </div>
    </article>
  `;
}

function renderMilestoneProgress(points, milestone) {
  const progress = Math.min(100, Math.round((points / milestone.points) * 100));
  const unlocked = points >= milestone.points;

  return `
    <div class="milestone-progress ${unlocked ? 'unlocked' : 'locked'}">
      <div>
        <span>${escapeHtml(milestone.name)}</span>
        <strong>${unlocked ? 'Unlocked' : `${Math.max(0, milestone.points - points)} pts to go`}</strong>
      </div>
      <div class="progress-track"><span style="width: ${progress}%"></span></div>
    </div>
  `;
}

function renderTimeline(profile, periodRecords, sortedRewards) {
  const records = periodRecords
    .filter((record) => record.staffId === profile.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const events = buildTimelineEvents(profile, records, sortedRewards);

  return `
    <article class="timeline-group">
      <h3>${escapeHtml(profile.name)}</h3>
      <div class="timeline-list">
        ${events.length
          ? events.map(renderTimelineEvent).join('')
          : '<div class="empty rewards-empty">No recognition events in this period.</div>'}
      </div>
    </article>
  `;
}

function renderTimelineEvent(event) {
  return `
    <div class="timeline-event ${event.type}">
      <span>${formatDateTime(event.date)}</span>
      <strong>${escapeHtml(event.title)}</strong>
      <p>${escapeHtml(event.detail)}</p>
      ${event.note ? `<small>${escapeHtml(event.note)}</small>` : ''}
    </div>
  `;
}

function buildTimelineEvents(profile, records, sortedRewards) {
  const events = [];
  let runningPoints = 0;
  const unlockedMilestones = new Set();
  const unlockedRewards = new Set();

  for (const record of [...profile.records].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    const inPeriod = records.some((item) => item.key === record.key);
    const pointText = record.points ? 'Point earned from positive guest feedback.' : 'Mention recorded with no point awarded.';

    if (inPeriod) {
      events.push({
        type: 'mention',
        date: record.date,
        title: `${record.rating}★ review mention`,
        detail: createExcerpt(record.text, 120),
        note: record.manual ? `Manually assigned by manager: ${record.note}` : pointText
      });
    }

    runningPoints += record.points;

    for (const milestone of milestones) {
      if (runningPoints >= milestone.points && !unlockedMilestones.has(milestone.id)) {
        unlockedMilestones.add(milestone.id);
        if (inPeriod) {
          events.push({
            type: 'milestone',
            date: record.date,
            title: `Milestone reached: ${milestone.name}`,
            detail: `${profile.name} reached ${milestone.points} positive review point${milestone.points === 1 ? '' : 's'}.`
          });
        }
      }
    }

    for (const reward of sortedRewards) {
      if (runningPoints >= reward.points && !unlockedRewards.has(reward.id)) {
        unlockedRewards.add(reward.id);
        if (inPeriod) {
          events.push({
            type: 'reward',
            date: record.date,
            title: `Reward unlocked: ${reward.name}`,
            detail: `${reward.points} point reward in ${reward.category}.`
          });
        }
      }
    }
  }

  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function calculateStaffProfiles(allRecords, periodRecords, sortedRewards) {
  return staff.map((person) => {
    const records = allRecords.filter((record) => record.staffId === person.id);
    const periodPersonRecords = periodRecords.filter((record) => record.staffId === person.id);
    const totalPoints = records.reduce((sum, record) => sum + record.points, 0);
    const periodPoints = periodPersonRecords.reduce((sum, record) => sum + record.points, 0);
    const unlockedRewards = sortedRewards.filter((reward) => totalPoints >= reward.points);
    const periodRewardUnlocks = getRewardUnlocksInRecords(records, periodPersonRecords, sortedRewards);
    const nextReward = sortedRewards.find((reward) => totalPoints < reward.points) || null;

    return {
      ...person,
      records,
      periodRecords: periodPersonRecords,
      totalMentions: records.length,
      periodMentions: periodPersonRecords.length,
      totalPoints,
      periodPoints,
      manualCount: records.filter((record) => record.manual).length,
      unlockedRewards,
      periodRewardUnlocks,
      nextReward,
      currentMilestone: getCurrentMilestone(totalPoints),
      nextMilestone: getNextMilestone(totalPoints),
      latestRecord: records.sort((a, b) => new Date(b.date) - new Date(a.date))[0] || null
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints || b.totalMentions - a.totalMentions || a.name.localeCompare(b.name));
}

function getPeriodRewardUnlocks(profile) {
  return profile.periodRewardUnlocks || [];
}

function getRewardUnlocksInRecords(records, periodRecords, sortedRewards) {
  const periodKeys = new Set(periodRecords.map((record) => record.key));
  const unlocked = [];
  const reachedRewards = new Set();
  let runningPoints = 0;

  for (const record of [...records].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    runningPoints += record.points;

    for (const reward of sortedRewards) {
      if (runningPoints >= reward.points && !reachedRewards.has(reward.id)) {
        reachedRewards.add(reward.id);
        if (periodKeys.has(record.key)) {
          unlocked.push({ reward, record });
        }
      }
    }
  }

  return unlocked;
}

function getAllRecognitionRecords() {
  const records = [];
  const seen = new Set();

  for (const review of reviewTemplates) {
    for (const person of extractStaffFromReview(review)) {
      const key = `${review.id}_${person.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      records.push(createRecord(review, person, false));
    }
  }

  for (const assignment of manualAssignments) {
    const review = reviewTemplates.find((item) => item.id === assignment.reviewId);
    const person = staff.find((item) => item.id === assignment.staffId);
    if (!review || !person) continue;

    const key = `${review.id}_${person.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    records.push(createRecord(review, person, true, assignment));
  }

  return records;
}

function createRecord(review, person, manual, assignment = null) {
  return {
    key: `${review.id}_${person.id}`,
    reviewId: review.id,
    staffId: person.id,
    staffName: person.name,
    role: person.role,
    date: manual ? assignment.createdAt : review.date,
    reviewDate: review.date,
    rating: review.rating,
    text: review.text,
    points: review.rating >= 4 ? 1 : 0,
    manual,
    note: assignment?.note || ''
  };
}

function extractStaffFromReview(review) {
  return staff.filter((person) => new RegExp(`\\b${escapeRegExp(person.name)}\\b`, 'i').test(review.text));
}

function populateManualControls(allRecords) {
  const currentReview = refs.manualReview.value;
  const currentStaff = refs.manualStaff.value;

  refs.manualReview.innerHTML = reviewTemplates.map((review) => (
    `<option value="${escapeHtml(review.id)}">${formatShortDate(review.date)} · ${review.rating}★ · ${escapeHtml(createExcerpt(review.text, 78))}</option>`
  )).join('');

  refs.manualStaff.innerHTML = staff.map((person) => (
    `<option value="${escapeHtml(person.id)}">${escapeHtml(person.name)} · ${escapeHtml(person.role)}</option>`
  )).join('');

  if (currentReview) refs.manualReview.value = currentReview;
  if (currentStaff) refs.manualStaff.value = currentStaff;

  const selectedDuplicate = allRecords.some((record) => (
    record.reviewId === refs.manualReview.value && record.staffId === refs.manualStaff.value
  ));
  if (selectedDuplicate && !refs.manualMessage.textContent) {
    refs.manualMessage.textContent = 'Selected pairing already has recognition.';
  }
}

function filterProfilesByMilestone(profiles) {
  if (filters.milestone === 'all') {
    return profiles;
  }

  const milestone = milestones.find((item) => item.id === filters.milestone);
  if (!milestone) {
    return profiles;
  }

  return profiles.filter((profile) => profile.totalPoints >= milestone.points);
}

function filterRecordsByPeriod(records, period) {
  if (period.type === 'all') {
    return records;
  }

  return records.filter((record) => {
    const date = new Date(record.date);
    return date >= period.start && date < period.end;
  });
}

function getSelectedPeriod() {
  const thisMonthStart = new Date(2026, 3, 1);
  const nextMonthStart = new Date(2026, 4, 1);
  const lastMonthStart = new Date(2026, 2, 1);

  if (filters.month === 'last') {
    return {
      type: 'month',
      start: lastMonthStart,
      end: thisMonthStart,
      label: 'March 2026'
    };
  }

  if (filters.month === 'all') {
    return {
      type: 'all',
      start: null,
      end: null,
      label: 'All time'
    };
  }

  return {
    type: 'month',
    start: thisMonthStart,
    end: nextMonthStart,
    label: 'April 2026'
  };
}

function getSortedRewards() {
  return [...rewards].sort((a, b) => a.points - b.points || a.name.localeCompare(b.name));
}

function getCurrentMilestone(points) {
  return [...milestones].reverse().find((milestone) => points >= milestone.points) || null;
}

function getNextMilestone(points) {
  return milestones.find((milestone) => points < milestone.points) || null;
}

function printReport() {
  const sortedRewards = getSortedRewards();
  const allRecords = getAllRecognitionRecords();
  const period = getSelectedPeriod();
  const periodRecords = filterRecordsByPeriod(allRecords, period);
  const profiles = filterProfilesByMilestone(calculateStaffProfiles(allRecords, periodRecords, sortedRewards));
  const totalMentions = periodRecords.length;
  const totalPoints = periodRecords.reduce((sum, record) => sum + record.points, 0);
  const topStaff = profiles[0];
  const manualCount = periodRecords.filter((record) => record.manual).length;

  refs.printReport.innerHTML = `
    <div class="report-page">
      <header>
        <p>AURA Staff Recognition Report</p>
        <h1>Hilton Glasgow</h1>
        <span>${escapeHtml(period.label)}</span>
      </header>
      <section class="report-summary">
        <div><span>Total staff mentions</span><strong>${totalMentions}</strong></div>
        <div><span>Total positive review points</span><strong>${totalPoints}</strong></div>
        <div><span>Most recognised staff member</span><strong>${escapeHtml(topStaff?.name || 'None')}</strong></div>
        <div><span>Manual recognition adjustments</span><strong>${manualCount}</strong></div>
      </section>
      <section>
        <h2>Staff leaderboard</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Role</th><th>Total points</th><th>Period points</th><th>Mentions</th><th>Milestone</th></tr>
          </thead>
          <tbody>
            ${profiles.map((profile) => `
              <tr>
                <td>${escapeHtml(profile.name)}</td>
                <td>${escapeHtml(profile.role)}</td>
                <td>${profile.totalPoints}</td>
                <td>${profile.periodPoints}</td>
                <td>${profile.totalMentions}</td>
                <td>${escapeHtml(profile.currentMilestone?.name || 'Not yet unlocked')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Staff detail</h2>
        ${profiles.map((profile) => `
          <article class="report-staff-card">
            <h3>${escapeHtml(profile.name)} <span>${escapeHtml(profile.role)}</span></h3>
            <p>Total points: ${profile.totalPoints} · Points this period: ${profile.periodPoints} · Total mentions: ${profile.totalMentions}</p>
            <p>Current milestone: ${escapeHtml(profile.currentMilestone?.name || 'Not yet unlocked')}</p>
            <p>Rewards unlocked: ${profile.unlockedRewards.length ? profile.unlockedRewards.map((reward) => escapeHtml(reward.name)).join(', ') : 'None yet'}</p>
            <p>Progress to next reward: ${escapeHtml(profile.nextReward ? `${Math.max(0, profile.nextReward.points - profile.totalPoints)} points until ${profile.nextReward.name}` : 'All current rewards unlocked')}</p>
            <p>Latest review: ${escapeHtml(profile.latestRecord ? createExcerpt(profile.latestRecord.text, 150) : 'No review yet')}</p>
          </article>
        `).join('')}
      </section>
      <section>
        <h2>Milestones unlocked</h2>
        <p>${profiles.flatMap((profile) => milestones.filter((milestone) => profile.totalPoints >= milestone.points).map((milestone) => `${profile.name}: ${milestone.name}`)).join(' · ') || 'No milestones unlocked.'}</p>
      </section>
      <section>
        <h2>Rewards unlocked</h2>
        <p>${profiles.flatMap((profile) => profile.unlockedRewards.map((reward) => `${profile.name}: ${reward.name}`)).join(' · ') || 'No rewards unlocked.'}</p>
      </section>
      <section>
        <h2>Recent recognised reviews</h2>
        ${periodRecords.slice(0, 10).map((record) => `
          <p><strong>${escapeHtml(record.staffName)}</strong> · ${formatShortDate(record.date)} · ${record.rating}★ · ${escapeHtml(createExcerpt(record.text, 140))}${record.manual ? ' · Manually assigned by manager' : ''}</p>
        `).join('') || '<p>No recognised reviews for this period.</p>'}
      </section>
    </div>
  `;

  window.print();
}

function loadFromStorage(key, fallback) {
  const stored = localStorage.getItem(key);
  if (!stored) {
    return structuredClone(fallback);
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(fallback)
      ? Array.isArray(parsed) ? parsed : structuredClone(fallback)
      : parsed && typeof parsed === 'object' ? parsed : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short'
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function createExcerpt(text, limit = 92) {
  return text.length > limit ? `${text.slice(0, limit - 3)}...` : text;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
