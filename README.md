# Mock Test — Exam Preparation

A config-driven React mock test app. Sections are discovered automatically from folders — no code changes needed when adding new topics.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## CSV Format

Each round is a CSV file. Use this exact format:

```csv
id,topic,difficulty,question,option_a,option_b,option_c,option_d,correct_option,correct_answer,explanation
1,DBMS / SQL,Easy,"Your question?","Option A","Option B","Option C","Option D",B,"Option B text","Why B is correct."
```

| Column | Description |
|--------|-------------|
| `id` | Question number |
| `topic` | Category (e.g. `DBMS / SQL`, `Security`, `Angular / AngularJS`) |
| `difficulty` | `Easy`, `Medium`, or `Hard` |
| `question` | Question text |
| `option_a` … `option_d` | Four options |
| `correct_option` | `A`, `B`, `C`, or `D` |
| `correct_answer` | Text of the correct answer |
| `explanation` | Shown in Review & Revise mode |

Questions are grouped by `topic` in the UI (round intro, quiz badges, results breakdown, review mode).

## Add a New Section (folder only)

```
public/data/
  your-section-name/          ← folder name becomes section ID
    meta.json                 ← optional (title, icon, color)
    round1.csv
    round2.csv
    round3.csv                ← any number of rounds
```

**Optional `meta.json`:**

```json
{
  "title": "Java & Spring",
  "description": "Java fundamentals and Spring Boot.",
  "icon": "☕",
  "color": "#059669",
  "roundTitles": { "round1": "Round 1", "round2": "Round 2" },
  "roundDescriptions": { "round1": "Basics", "round2": "Advanced" }
}
```

If `meta.json` is missing, the title is derived from the folder name.

After adding a folder, run `npm run dev` or `npm run build` once so `manifest.json` lists the new section. **Question counts and categories are read live from each CSV** when you open the app (no rebuild needed after editing questions).

If you change how many questions are in a CSV, refresh the page or revisit the section — completion badges only count attempts that match the current question count.

## Customize Timer

Edit `src/config/appConfig.js` → `secondsPerQuestion` (default: 60). Total time = question count × this value. A warning appears if you spend more than this on one question.

## Build for Production

```bash
npm run build
```

Output is in `dist/`.

## Hosting

### Vercel (recommended)

1. Push to GitHub
2. [vercel.com](https://vercel.com) → Import repo
3. Framework: **Vite**, Build: `npm run build`, Output: `dist`
4. Deploy

### Netlify

1. Push to GitHub → Import on [netlify.com](https://netlify.com)
2. Build: `npm run build`, Publish: `dist`
3. SPA routing handled via `public/_redirects`

### GitHub Pages

1. `npm install -D gh-pages`
2. Add `base: '/repo-name/'` in `vite.config.js`
3. Add deploy scripts and run `npm run deploy`

## Features

- **Dynamic sections** — auto-discovered from `public/data/` folders
- **Category grouping** — questions grouped by `topic` column
- **2+ rounds per section** — any `roundN.csv` files detected automatically
- **60s timer** per question with auto-advance
- **Results** with score breakdown by category
- **Review & Revise** — filter by status/topic, group by category
- Progress saved in browser localStorage
