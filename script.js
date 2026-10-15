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

// Frozen paper values: Table 1, arXiv:2609.33357v1.
const resultsRoot = document.getElementById('results');
if (resultsRoot) {
  const models = JSON.parse(document.getElementById('results-data').textContent);
  const metrics = {
    overall: { label: 'Overall score', unit: '/100', max: 100, description: 'Equal-weight average of eight track composites. Each composite is the geometric mean of L1, L2, and L3.' },
    l1: { label: 'L1 score', unit: '/100', max: 100, sd: 'l1sd', description: 'Data-integrity score, averaged over tasks within each track and then across tracks. ± is the standard deviation across tracks.' },
    l2: { label: 'L2 score', unit: '/100', max: 100, sd: 'l2sd', description: 'Analysis-verification score. Tasks are averaged within families, then families within tracks, then tracks. ± is the standard deviation across tracks.' },
    l3: { label: 'L3 score', unit: '/100', max: 100, sd: 'l3sd', description: 'Scientific-reasoning score over eligible tasks, averaged within tracks and then across tracks. Justified abstention can receive partial credit. ± is the standard deviation across tracks.' },
    tokens: { label: 'Tokens used', unit: 'million tokens', digits: 2, lower: true, description: 'Total recorded input and output tokens for the 203-task suite, including reasoning tokens where recorded. Excludes reviewers, graders, and verifiers.' },
    efficiency: { label: 'Token efficiency', unit: 'score points / M tokens', digits: 2, description: 'Overall score divided by total tokens in millions (Q/Mtok in the paper). Read this resource-use ratio alongside the overall score and task execution.' },
    cost: { label: 'Cost per task', unit: 'USD / task', digits: 2, lower: true, description: 'Estimated agent cost divided by 203 assigned tasks, using the paper’s dated list prices. These are published estimates, not current prices or invoice charges.' },
    costEfficiency: { label: 'Cost efficiency', unit: 'USD / score point', digits: 4, lower: true, description: 'Estimated cost per task divided by Overall score ($/q.pt. in Table 1). Lower means less estimated cost per quality point under this definition.' },
    calls: { label: 'API calls', unit: 'recorded calls', digits: 0, lower: true, description: 'Recorded agent API calls across L1–L3; reviewer, grader, and verifier calls are excluded. Calls do not measure elapsed time.' },
  };
  const columns = ["overall", "l1", "l2", "l3", "tokens", "efficiency", "cost", "costEfficiency", "calls"];
  const views = {
    "overall": {
        "title": "Overall performance",
        "description": "Each track combines L1–L3 with a geometric mean; the overall score averages the eight track scores equally.",
        "note": "Scores use a 0–100 rubric, not a success percentage. L1–L3 show mean ± standard deviation across tracks."
    },
    "l1": {
        "title": "L1 · Can the data be trusted?",
        "description": "Compare data-integrity scores across the eight life-science tracks.",
        "note": "Scores use a 0–100 rubric, not a success percentage. L1–L3 show mean ± standard deviation across tracks."
    },
    "l2": {
        "title": "L2 · Is the analysis valid?",
        "description": "Compare analysis-verification scores across the eight life-science tracks.",
        "note": "Scores use a 0–100 rubric, not a success percentage. L1–L3 show mean ± standard deviation across tracks."
    },
    "l3": {
        "title": "L3 · What does the evidence support?",
        "description": "Compare scientific-reasoning scores on eligible tasks. Justified abstention can receive partial credit.",
        "note": "Scores use a 0–100 rubric, not a success percentage. L1–L3 show mean ± standard deviation across tracks. Eligibility differs by model."
    },
    "tokens": {
        "title": "Tokens used · Total resource use",
        "description": "Total recorded input and output tokens across the benchmark, in millions.",
        "note": "Resource totals cover the full 203-task suite and exclude reviewers, graders, and verifiers. Read resource use alongside scientific performance."
    },
    "efficiency": {
        "title": "Token efficiency · Score per million tokens",
        "description": "How much overall score each model achieves per million tokens used (Q/Mtok in the paper).",
        "note": "GPT-4.1 has the highest score per million tokens but the lowest overall score, and did not execute code on 20 of 181 L1/L2 tasks. This ratio should be read alongside task execution and scientific performance."
    },
    "cost": {
        "title": "Cost per task · Estimated spending",
        "description": "Estimated agent cost averaged over the 203 assigned tasks ($/task in the paper).",
        "note": "Cost estimates use the paper’s dated list prices and are upper bounds, not current API prices or invoice charges. Reviewer, grader, and verifier costs are excluded."
    },
    "costEfficiency": {
        "title": "Cost efficiency · Cost per score point",
        "description": "Estimated cost per task divided by the overall score ($/q.pt. in the paper). Lower values mean less estimated cost per score point.",
        "note": "Cost estimates use the paper’s dated list prices and are upper bounds, not current API prices or invoice charges. Reviewer, grader, and verifier costs are excluded."
    },
    "calls": {
        "title": "API calls · Model interactions",
        "description": "Total recorded agent API calls across L1–L3. Fewer calls mean fewer model interactions, not necessarily faster completion.",
        "note": "Resource totals cover the full 203-task suite and exclude reviewers, graders, and verifiers. Read resource use alongside scientific performance."
    }
};
  let viewKey = 'overall';
  let metricKey = 'overall';
  let ascending = false;
  let focusedModel = null;
  let costZoomed = false;
  const head = document.getElementById('results-table-head');
  const body = document.getElementById('results-table-body');
  const chart = document.getElementById('results-chart');
  const detail = document.getElementById('results-model-detail');
  const orderButton = document.getElementById('results-order');
  const zoomButton = document.getElementById('results-zoom');
  const scaleControls = document.getElementById('results-scale-controls');
  const scaleNote = document.getElementById('results-scale-note');
  const viewTabs = [...resultsRoot.querySelectorAll('.results-tab')];
  const chartSection = document.getElementById('results-chart-section');

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function format(model, key, withSD = false) {
    const metric = metrics[key];
    const value = model[key];
    if (key === 'calls') return value.toLocaleString('en-US');
    let result = value.toFixed(metric.digits ?? 1);
    if (key === 'tokens') result += 'M';
    if (key === 'cost' || key === 'costEfficiency') result = `$${result}`;
    if (withSD && metric.sd) result += ` ± ${model[metric.sd].toFixed(1)}`;
    return result;
  }
  function showModelDetail() {
    const model = models.find(item => item.id === focusedModel);
    detail.replaceChildren();
    detail.hidden = !model;
    resultsRoot.querySelectorAll('[data-model]').forEach(button => {
      const active = Boolean(model && button.dataset.model === model.id);
      button.setAttribute('aria-pressed', String(active));
      button.closest('tr')?.classList.toggle('model-focused', active);
    });
    if (!model) return;
    const heading = element('div', 'results-detail-heading');
    heading.append(element('strong', '', model.name));
    const close = element('button', 'results-detail-close', 'Clear selection ×');
    close.type = 'button';
    close.addEventListener('click', () => {
      const trigger = resultsRoot.querySelector(`[data-model="${focusedModel}"]`);
      focusedModel = null;
      showModelDetail();
      trigger?.focus({ preventScroll: true });
    });
    heading.append(close);
    const values = element('dl', 'results-detail-values');
    [...new Set([metricKey, 'overall', 'tokens', 'cost'])].forEach(key => {
      const item = element('div');
      item.append(element('dt', '', metrics[key].label), element('dd', '', format(model, key, true)));
      values.append(item);
    });
    detail.append(heading, values);
  }
  function selectModel(id) {
    focusedModel = focusedModel === id ? null : id;
    showModelDetail();
    document.getElementById('results-status').textContent = focusedModel ? `${models.find(model => model.id === id).name} selected. Score and resource details are below the chart.` : 'Model selection cleared.';
  }
  function render() {
    const view = views[viewKey];
    const metric = metrics[metricKey];
    const visible = [...models].sort((a, b) => (ascending ? 1 : -1) * (a[metricKey] - b[metricKey]) || a.name.localeCompare(b.name));
    const savedSortFocus = document.activeElement?.dataset.sort;
    document.getElementById('results-view-title').textContent = view.title;
    document.getElementById('results-description').textContent = view.description;
    document.getElementById('results-note').textContent = view.note;
    document.getElementById('results-chart-title').textContent = metric.label;
    document.getElementById('results-direction').textContent = `${metric.descriptive ? 'Descriptive measure' : metric.lower ? 'Lower is better' : 'Higher is better'} · ${metric.unit}`;
    orderButton.textContent = ascending ? 'Low to high ↑' : 'High to low ↓';
    orderButton.setAttribute('aria-label', `Currently sorted ${ascending ? 'low to high' : 'high to low'}. Reverse sort order`);
    chartSection.hidden = false;
    document.getElementById('results-table-caption').textContent = `${view.title}; sorted by ${metric.label}, ${ascending ? 'low to high' : 'high to low'}`;
    document.getElementById('results-status').textContent = `${visible.length} models. ${view.title}. Sorted by ${metric.label}, ${ascending ? 'low to high' : 'high to low'}.`;

    const isCostEfficiency = metricKey === 'costEfficiency';
    const zoomed = isCostEfficiency && costZoomed;
    const maxValue = Math.max(zoomed ? Number.EPSILON : 1, ...visible.map(model => model[metricKey]));
    const magnitude = 10 ** Math.floor(Math.log10(maxValue));
    const limit = metric.max || Math.ceil(maxValue / magnitude * 2) / 2 * magnitude;
    scaleControls.hidden = !isCostEfficiency;
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.textContent = zoomed ? 'Show full scale' : 'Zoom in';
    scaleNote.textContent = zoomed
      ? `Zoomed scale: $0–$${limit.toFixed(2)} per score point. The baseline stays at zero; values are unchanged.`
      : 'Full scale: $0–$1 per score point. Zoom in to compare small differences.';
    if (isCostEfficiency) document.getElementById('results-status').textContent += ` ${scaleNote.textContent}`;
    const axis = document.getElementById('results-axis');
    axis.classList.toggle('results-axis-currency', isCostEfficiency);
    axis.replaceChildren(...[limit, limit / 2, 0].map(value => element('span', '', isCostEfficiency ? `$${value.toFixed(2)}` : Number(value.toPrecision(3)).toString())));
    chart.replaceChildren();
    chart.style.setProperty('--model-count', Math.max(visible.length, 1));
    visible.forEach(model => {
      const button = element('button', 'results-chart-model');
      button.type = 'button';
      button.dataset.model = model.id;
      button.setAttribute('aria-label', `${model.name}: ${metric.label}, ${format(model, metricKey)} ${metric.unit}. Show model details`);
      button.style.setProperty('--model-color', model.color);
      button.style.setProperty('--bar-height', `${model[metricKey] / limit * 100}%`);
      const plot = element('span', 'results-chart-plot');
      plot.setAttribute('aria-hidden', 'true');
      plot.append(element('span', 'results-chart-value', format(model, metricKey)), element('span', 'results-chart-fill'));
      button.append(plot, element('span', 'results-chart-name', model.name));
      button.addEventListener('click', () => selectModel(model.id));
      chart.append(button);
    });

    const headerRow = element('tr');
    ['#', 'Model'].forEach(label => {
      const cell = element('th', '', label); cell.scope = 'col'; headerRow.append(cell);
    });
    columns.forEach(key => {
      const cell = element('th'); cell.scope = 'col';
      cell.setAttribute('aria-sort', metricKey === key ? ascending ? 'ascending' : 'descending' : 'none');
      const button = element('button', 'results-sort');
      button.type = 'button'; button.dataset.sort = key;
      button.append(element('span', '', metrics[key].label), element('small', '', metrics[key].unit));
      const arrow = element('span', 'results-sort-arrow', metricKey === key ? ascending ? '↑' : '↓' : '↕');
      arrow.setAttribute('aria-hidden', 'true'); button.append(arrow);
      button.setAttribute('aria-label', `Sort by ${metrics[key].label}`);
      button.addEventListener('click', () => {
        if (metricKey === key) ascending = !ascending;
        else { changeView(key); return; }
        render();
      });
      cell.append(button); headerRow.append(cell);
    });
    head.replaceChildren(headerRow);
    body.replaceChildren();
    visible.forEach((model, index) => {
      const row = element('tr'); row.dataset.modelRow = model.id;
      row.append(element('td', 'results-position', String(index + 1)));
      const name = element('th'); name.scope = 'row';
      const button = element('button', 'results-model-name', model.name);
      button.type = 'button'; button.dataset.model = model.id;
      button.style.setProperty('--model-color', model.color);
      button.addEventListener('click', () => selectModel(model.id));
      name.append(button); row.append(name);
      columns.forEach(key => row.append(element('td', key === metricKey ? 'results-active-value' : '', format(model, key, true))));
      body.append(row);
    });
    const definitions = document.getElementById('results-definitions-list');
    definitions.replaceChildren();
    definitions.append(element('dt', '', metric.label), element('dd', '', metric.description));
    showModelDetail();
    if (savedSortFocus) head.querySelector(`[data-sort="${savedSortFocus}"]`)?.focus({ preventScroll: true });
  }
  function changeView(key) {
    viewKey = key;
    metricKey = key;
    ascending = Boolean(metrics[metricKey].lower);
    viewTabs.forEach(tab => {
      const active = tab.dataset.view === key;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    document.getElementById('results-panel').setAttribute('aria-labelledby', `results-tab-${key}`);
    render();
  }
  viewTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => changeView(tab.dataset.view));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? viewTabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + viewTabs.length) % viewTabs.length;
      viewTabs[next].focus(); changeView(viewTabs[next].dataset.view);
    });
  });
  zoomButton.addEventListener('click', () => { costZoomed = !costZoomed; render(); });
  orderButton.addEventListener('click', () => { ascending = !ascending; render(); });
  document.getElementById('results-panel').setAttribute('role', 'tabpanel');
  changeView('overall');
  document.getElementById('results-controls').hidden = false;
}


// Figure links still open the original local artwork when JavaScript is unavailable.
const figureDialog = document.getElementById('figure-dialog');
if (figureDialog && typeof figureDialog.showModal === 'function') {
  const figureImage = document.getElementById('figure-dialog-image');
  const figureViewport = document.getElementById('figure-viewport');
  const zoomButton = document.getElementById('figure-zoom');
  let figureTrigger;

  document.querySelectorAll('[data-figure]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const figure = link.closest('figure');
      const image = link.querySelector('img');
      const source = figure.querySelector('.figure-source');
      figureTrigger = link;
      figureImage.src = link.href;
      figureImage.alt = image.alt;
      document.getElementById('figure-dialog-title').textContent = `Figure ${figure.id.split('-').pop()} · ${figure.querySelector('h3').textContent}`;
      document.getElementById('figure-dialog-caption').textContent = figure.querySelector('figcaption p').textContent;
      document.getElementById('figure-dialog-source').href = source.href;
      figureViewport.classList.remove('is-zoomed');
      figureViewport.classList.toggle('is-portrait', Number(image.getAttribute('height')) > Number(image.getAttribute('width')));
      zoomButton.setAttribute('aria-pressed', 'false');
      zoomButton.textContent = 'Zoom in';
      figureDialog.showModal();
      figureViewport.scrollTop = 0;
      figureViewport.scrollLeft = 0;
      document.body.classList.add('figure-viewer-open');
    });
  });

  zoomButton.addEventListener('click', () => {
    const zoomed = figureViewport.classList.toggle('is-zoomed');
    zoomButton.setAttribute('aria-pressed', String(zoomed));
    zoomButton.textContent = zoomed ? 'Fit to view' : 'Zoom in';
    if (!zoomed) {
      figureViewport.scrollTop = 0;
      figureViewport.scrollLeft = 0;
    }
  });
  function restoreFigurePage() {
    if (figureDialog.open) return;
    document.body.classList.remove('figure-viewer-open');
    figureTrigger?.focus({ preventScroll: true });
  }
  function closeFigure() {
    figureDialog.close();
    restoreFigurePage();
  }
  document.getElementById('figure-close').addEventListener('click', closeFigure);
  figureDialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeFigure();
  });
  figureDialog.addEventListener('click', (event) => {
    if (event.target !== figureDialog) return;
    const bounds = figureDialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeFigure();
  });
  figureDialog.addEventListener('close', restoreFigurePage);
}
