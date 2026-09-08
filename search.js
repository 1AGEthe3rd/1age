let entities = [];

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const results = document.querySelector("#results");
const resultsLabel = document.querySelector("#results-label");
const quickSearchButtons = document.querySelectorAll(".quick-search");

function normalize(value) {
    return String(value ?? "").toLowerCase().trim();
}

function scoreEntity(entity, query) {
    const terms = normalize(query)
        .split(/\s+/)
        .filter(Boolean);

    let score = 0;

    const name = normalize(entity.name);
    const type = normalize(entity.type);
    const category = normalize(entity.category);
    const description = normalize(entity.description);
    const tags = (entity.tags || []).map(normalize);

    for (const term of terms) {
        if (name === term) {
            score += 20;
        } else if (name.includes(term)) {
            score += 12;
        }

        if (type.includes(term)) {
            score += 8;
        }

        if (category.includes(term)) {
            score += 8;
        }

        if (tags.some(tag => tag === term)) {
            score += 10;
        } else if (tags.some(tag => tag.includes(term))) {
            score += 6;
        }

        if (description.includes(term)) {
            score += 3;
        }
    }

    return score;
}

function searchEntities(query) {
    return entities
        .map(entity => ({
            ...entity,
            score: scoreEntity(entity, query)
        }))
        .filter(entity => entity.score > 0)
        .sort((a, b) => b.score - a.score);
}

function renderResults(items, query) {
    results.innerHTML = "";

    resultsLabel.textContent =
        items.length === 1
            ? `1 result for "${query}"`
            : `${items.length} results for "${query}"`;

    if (items.length === 0) {
        results.innerHTML = `
            <div class="empty-state">
                No results yet. The 1AGE index is still growing.
            </div>
        `;

        return;
    }

    for (const entity of items) {
        const card = document.createElement("article");
        card.className = "result-card";

        card.innerHTML = `
            <div class="result-topline">
                <h2>${entity.name}</h2>
                <span class="result-type">${entity.type}</span>
            </div>

            <p class="result-status">
                ${entity.status}
            </p>

            <p class="result-description">
                ${entity.description}
            </p>

            <div class="result-tags">
                ${(entity.tags || [])
                    .map(tag => `<span>#${tag}</span>`)
                    .join("")}
            </div>

            <a
                class="result-link"
                href="${entity.official_links.website}"
                target="_blank"
                rel="noopener noreferrer"
            >
                Visit official site →
            </a>
        `;

        results.appendChild(card);
    }
}

function runSearch(query) {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
        return;
    }

    searchInput.value = cleanQuery;

    const matches = searchEntities(cleanQuery);

    renderResults(matches, cleanQuery);
}

async function loadEntities() {
    try {
        const response = await fetch("data/entities.json");

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        entities = await response.json();

        resultsLabel.textContent = "Discover the Solana ecosystem.";
    } catch (error) {
        console.error("Failed to load 1AGE Index:", error);

        resultsLabel.textContent = "1AGE Index unavailable.";

        results.innerHTML = `
            <div class="empty-state">
                The search index could not be loaded.
            </div>
        `;
    }
}

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    runSearch(searchInput.value);
});

quickSearchButtons.forEach(button => {
    button.addEventListener("click", () => {
        runSearch(button.dataset.query);
    });
});

loadEntities();
