const tabs = Array.from(document.querySelectorAll('.tab'));
const panels = Array.from(document.querySelectorAll('.tab-panel'));

function activateTab(target) {
  tabs.forEach((tab) => {
    const active = tab.dataset.target === target;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', active ? 'true' : 'false');
    tab.tabIndex = active ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.dataset.panel === target;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.target));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
    activateTab(tabs[nextIndex].dataset.target);
  });
});

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.getElementById('mobile-nav');
if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    mobileNav.hidden = expanded;
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileNav.hidden = true;
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const scoreControls = document.getElementById('score-controls');
const scoreBody = document.getElementById('model-scores');
if (scoreControls && scoreBody) {
  // Values live in the HTML rows so the overall results also work without JS.
  // Source: https://arxiv.org/html/2609.33357v1#S3.T1 (no inferred task scores).
  const scoreRows = Array.from(scoreBody.rows);
  const scoreViews = {
    overall: {
      title: 'Overall · Eight life-science tracks',
      description: 'Each track combines L1–L3 using a geometric mean. The overall score averages those eight track scores with equal weight.',
    },
    l1: {
      title: 'L1 · Data integrity · 79 tasks',
      description: 'Inspect data and decide whether to accept, repair, or reject it. Scores average tasks within each track, then average across tracks.',
    },
    l2: {
      title: 'L2 · Analysis verification · 102 tasks',
      description: 'Check analytical results, recognize problems, and respond appropriately. Scores average tasks within each analysis family, then families within each track, then tracks.',
    },
    l3: {
      title: 'L3 · Scientific reasoning · 22 worlds',
      description: 'Propose and revise evidence-grounded hypotheses. Scores average eligible tasks within each track, then tracks. Eligibility varies by model; justified abstention can earn partial credit.',
    },
  };

  function showScores(metric) {
    const view = scoreViews[metric];
    if (!view) return;
    const rankedRows = [...scoreRows].sort((a, b) => parseFloat(b.dataset[metric]) - parseFloat(a.dataset[metric]));
    rankedRows.forEach((row) => {
      const [score, sd] = row.dataset[metric].split(',').map(Number);
      row.querySelector('.model-score strong').textContent = score.toFixed(1);
      row.querySelector('.model-bar > span').style.setProperty('--fill', `${score}%`);
      row.querySelector('.score-spread').textContent = metric === 'overall' ? '' : `± ${sd.toFixed(1)}`;
      scoreBody.appendChild(row);
    });
    document.querySelectorAll('.model-table .score-spread').forEach((cell) => {
      cell.hidden = metric === 'overall';
    });
    document.getElementById('score-title').textContent = view.title;
    document.getElementById('score-description').textContent = view.description;
    document.getElementById('score-caption').textContent = `${view.title}: scores ordered from highest to lowest`;
    document.getElementById('score-status').textContent = `${view.title}. Eight models sorted by score, highest first.`;
  }

  scoreControls.addEventListener('change', (event) => {
    if (event.target.name === 'score-metric') showScores(event.target.value);
  });
  showScores(scoreControls.querySelector('input:checked').value);
  scoreControls.hidden = false;
}
