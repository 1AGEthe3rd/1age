const entities = [
    {
        name: "Jupiter",
        type: "Project",
        category: "DeFi",
        description: "Solana liquidity infrastructure and trading platform.",
        tags: ["swap", "defi", "trading", "aggregator"],
        website: "https://jup.ag"
    },
    {
        name: "Phantom",
        type: "Wallet",
        category: "Wallet",
        description: "A crypto wallet used throughout the Solana ecosystem.",
        tags: ["wallet", "mobile", "browser", "beginner"],
        website: "https://phantom.com"
    },
    {
        name: "Helius",
        type: "Tool",
        category: "Infrastructure",
        description: "Developer infrastructure and APIs for building on Solana.",
        tags: ["rpc", "api", "developer", "infrastructure"],
        website: "https://helius.dev"
    },
    {
        name: "Backpack",
        type: "Wallet",
        category: "Wallet",
        description: "A wallet and trading platform built for the crypto ecosystem.",
        tags: ["wallet", "trading", "mobile", "solana"],
        website: "https://backpack.app"
    },
    {
        name: "Superteam",
        type: "Community",
        category: "Community",
        description: "A global community helping people build, earn, and contribute in the Solana ecosystem.",
        tags: ["community", "jobs", "grants", "builders", "earn"],
        website: "https://superteam.fun"
    }
];

const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const results = document.querySelector("#results");
const resultsLabel = document.querySelector("#results-label");
const quickSearchButtons = document.querySelectorAll(".quick-search");

function normalize(value) {
    return value.toLowerCase().trim();
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
    const tags = entity.tags.map(normalize);

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

            <p class="result-description">
                ${entity.description}
            </p>

            <div class="result-tags">
                ${entity.tags.map(tag => `<span>#${tag}</span>`).join("")}
            </div>

            <a
                class="result-link"
                href="${entity.website}"
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

searchForm.addEventListener("submit", event => {
    event.preventDefault();
    runSearch(searchInput.value);
});

quickSearchButtons.forEach(button => {
    button.addEventListener("click", () => {
        runSearch(button.dataset.query);
    });
});
