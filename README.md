# PlayTested

**Game Review & Comparison Platform with a work-in-progress AI feature**

PlayTested is a modern, static‑site game review platform built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com). It combines traditional markdown content with AI‑driven features, allowing users to:

* Publish detailed game reviews with frontmatter metadata, image galleries, pros/cons, and ratings
* Search for games via the RAWG API
* Select multiple titles and generate AI‑powered recommendations or side‑by‑side comparisons

## 🚀 Features

* **Markdown‑based Reviews**: Write in familiar markdown with YAML frontmatter for metadata (title, date, tags, gallery, score).
* **Content-packed homepage**: Complete with a featured post carousel and latest posts card.
* **Image Galleries**: Embed a gallery in each review.
* **Dark Mode**: Toggle between light and dark themes seamlessly.
* **AI Recommender & Comparator**: Use the `/api/recommend` and `/api/compare` endpoints to get LLM‑powered insights based on selected games.
* **RAWG Integration**: Search and fetch cover art and release data from the RAWG API.
* **Responsive Design**: Mobile‑friendly layout powered by Tailwind CSS.

## 📦 Tech Stack
* **Framework**: Astro (Static Site Generator)
* **Styling**: Tailwind CSS
* **AI**: Google Gemini or OpenAI via OpenRouter API
* **Game Data**: RAWG API
* **Hosting**: Cloudflare Pages

## 🔧 Prerequisites
* Node.js ≥ 18.x
* npm or yarn
* RAWG API
* OpenRouter API

## ⚙️ Project Structure

```
├── public/                # Static assets (images, favicon)
├── src/
│   ├── components/        # Reusable .Astro & UI components
│   ├── GameSelector.astro # Search & AI selection widget
│   ├── content/           # Markdown review files (frontmatter + body) and images
│   ├── layouts/           # Astro layouts (BlogLayout, Header, Footer)
│   ├── pages/             # Routes (index.astro, article/[slug].astro)
│   └── utils/             # Helper scripts (SendToLLM.js, RAWG search)
│   
├── .env                   # Environment variables
├── astro.config.mjs       # Astro configuration
├── tailwind.config.cjs    # Tailwind CSS config
└── package.json           # Scripts & dependencies
```

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---
