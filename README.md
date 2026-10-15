# DISCERN Website

A responsive, static public-facing website for the DISCERN scientific-agent benchmark.

## Files

- `index.html` — page structure and copy
- `styles.css` — clean visual styling and responsive layout
- `script.js` — framework tabs, Results charts and sorting, figure viewer, and mobile menu
- `favicon.svg` — simple site icon

## Results data

The `results-data` JSON block in `index.html` contains the published model values from DISCERN v1, Table 1. Nine tabs select Overall, L1, L2, L3, tokens used, token efficiency (Q/Mtok), cost per task, cost efficiency ($/q.pt.), and API calls. The sortable table and no-JavaScript fallback both show all nine metrics. All eight evaluated models are always included.

Metric labels, definitions, and default sort directions live in `script.js`. Resource data covers the full suite and is not split into unsupported per-level usage. Cost estimates retain the paper’s dated prices. Fable and the fallback replay remain separately labeled.
