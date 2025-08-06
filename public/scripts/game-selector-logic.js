import getAIResponse from '../../src/utils/SendToLLM.js';
import { marked } from 'marked';

// We wrap our entire logic in an exported function
export function initializeGameSelector({ maxSelection, buttonText, id }) {
  const container = document.getElementById(`game-selector-${id}`);
  // If the selector is not on the page, do nothing.
  if (!container) return;

  const inputEl = document.getElementById(`game-search-input-${id}`);
  const resultsEl = document.getElementById(`search-results-${id}`);
  const selectedEl = document.getElementById(`selected-games-${id}`);
  const countEl = document.getElementById(`count-${id}`);
  const submitBtn = document.getElementById(`submit-btn-${id}`);
  const aiResponseEl = document.getElementById(`ai-response-${id}`);

  let selected = [];
  let debounceTimeout;

  function debouncedSearch(value) {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => searchGames(value), 300);
  }

  async function searchGames(query) {
    console.log("🔍 searchGames:", query);
    if (!query || query.length < 2) {
      resultsEl.innerHTML = "";
      return;
    }
    resultsEl.innerHTML = '<li class="italic text-gray-400 p-2">Searching…</li>';
    
    try {
      const res = await fetch(`/api/rawg-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      console.log("✅ proxy results:", data);
      resultsEl.innerHTML = "";

      if (data.error) {
        resultsEl.innerHTML = `<li class="text-red-500 italic p-2">${data.error}</li>`;
        return;
      }
      
      if (!data.results || !data.results.length) {
        resultsEl.innerHTML = '<li class="italic text-gray-400 p-2">No results found.</li>';
        return;
      }

      for (const game of data.results) {
        const li = document.createElement("li");
        li.className = "p-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors duration-200 border-gray-200 dark:border-slate-600";
        
        // Create a more detailed display
        const releaseYear = game.released ? new Date(game.released).getFullYear() : "Unknown";
        const platforms = game.platforms ? game.platforms.slice(0, 3).map(p => p.platform.name).join(", ") : "";
        
        li.innerHTML = `
          <div class="font-medium text-gray-900 dark:text-gray-100">${game.name}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            ${releaseYear}${platforms ? ` • ${platforms}` : ""}
          </div>
        `;
        
        li.onclick = () => addGame(game);
        resultsEl.appendChild(li);
      }
    } catch (err) {
      console.error("❌ fetch error:", err);
      resultsEl.innerHTML = '<li class="text-red-500 italic p-2">Fetch error. Check console for details.</li>';
    }
  }

  function addGame(game) {
    if (selected.length >= maxSelection) {
      alert(`You can only select up to ${maxSelection} games.`);
      return;
    }
    
    if (selected.find(g => g.id === game.id)) {
      alert("This game is already selected!");
      return;
    }
    
    selected.push({ 
      id: game.id, 
      name: game.name,
      released: game.released,
      platforms: game.platforms
    });
    renderSelected();
    
    // Clear search results after selection
    resultsEl.innerHTML = "";
    inputEl.value = "";
  }

  function removeGame(index) {
    selected.splice(index, 1);
    renderSelected();
  }

  function renderSelected() {
    selectedEl.innerHTML = "";
    
    selected.forEach((game, index) => {
      const li = document.createElement("li");
      li.className = "flex items-center justify-between p-3 bg-blue-50 dark:bg-slate-700 rounded-lg border border-blue-200 dark:border-slate-600";
      
      const releaseYear = game.released ? new Date(game.released).getFullYear() : "Unknown";
      
      li.innerHTML = `
        <div>
          <div class="font-medium text-gray-900 dark:text-gray-100">${game.name}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">${releaseYear}</div>
        </div>
        <button class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200">
          Remove
        </button>
      `;
      
      li.querySelector("button").onclick = () => removeGame(index);
      selectedEl.appendChild(li);
    });
    
    countEl.textContent = selected.length;
    submitBtn.disabled = selected.length !== maxSelection;
    
    // Update button text based on selection count
    if (selected.length === 0) {
      submitBtn.textContent = buttonText;
    } else if (selected.length < maxSelection) {
      submitBtn.textContent = `Select ${maxSelection - selected.length} more game${maxSelection - selected.length > 1 ? 's' : ''}`;
    } else {
      submitBtn.textContent = buttonText;
    }
  }

  async function handleSubmit() {
    if (selected.length !== maxSelection) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = '🧠 AI is thinking...';
    aiResponseEl.innerHTML = `
      <div class="prose dark:prose-invert max-w-none">
        <div class="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <p class="italic">Analyzing your game selection... this may take a moment.</p>
        </div>
      </div>
    `;

    let prompt;
    
    if (maxSelection === 2) { 
      // Comparator Logic
      try {
        const gameDetails = await Promise.all(
          selected.map(game => 
            fetch(`/api/rawg-game-details?id=${game.id}`)
              .then(res => res.json())
          )
        );
        
        const [game1, game2] = gameDetails;

        prompt = `
As a video game expert, provide a comprehensive comparison between these two games: **${game1.name}** and **${game2.name}**.

**Game 1: ${game1.name}**
- Release Date: ${game1.released || 'Unknown'}
- Metacritic Score: ${game1.metacritic || 'N/A'}
- Genres: ${game1.genres?.map(g => g.name).join(', ') || 'Unknown'}
- Platforms: ${game1.platforms?.slice(0, 5).map(p => p.platform.name).join(', ') || 'Unknown'}
- Description: ${game1.description_raw ? game1.description_raw.substring(0, 1000) + '...' : 'No description available'}

**Game 2: ${game2.name}**
- Release Date: ${game2.released || 'Unknown'}
- Metacritic Score: ${game2.metacritic || 'N/A'}
- Genres: ${game2.genres?.map(g => g.name).join(', ') || 'Unknown'}
- Platforms: ${game2.platforms?.slice(0, 5).map(p => p.platform.name).join(', ') || 'Unknown'}
- Description: ${game2.description_raw ? game2.description_raw.substring(0, 1000) + '...' : 'No description available'}

Please provide a detailed comparison covering:

## 📊 **Quick Comparison**
Create a side-by-side comparison of key aspects.

## 🎮 **Gameplay & Mechanics**
Compare the core gameplay loops, mechanics, and player interactions.

## 🎨 **Presentation & Style**
Analyze graphics, art direction, sound design, and overall aesthetic.

## 📖 **Story & Content**
Compare narrative depth, content volume, and storytelling approach.

## 🎯 **Target Audience**
Who would prefer each game and why?

## 💡 **Valuable Insights**
- Which game offers better value for different types of players?
- Key deciding factors between the two
- Final recommendation based on different player preferences

Format your response in well-structured Markdown with clear sections and engaging analysis.
        `;
      } catch (err) {
        console.error("Error fetching game details:", err);
        aiResponseEl.innerHTML = `
          <div class="prose dark:prose-invert max-w-none">
            <p class="text-red-500">❌ Error fetching game details: ${err.message}</p>
          </div>
        `;
        submitBtn.disabled = false;
        submitBtn.textContent = buttonText;
        return;
      }
    } else { 
      // Recommender Logic (for 5 games)
      const gameNames = selected.map(g => g.name).join(', ');
      
      prompt = `
As a gaming expert AI, I've been given these ${maxSelection} favorite games: **${gameNames}**.

Based on this curated selection, please provide **5 excellent game recommendations** that align with these preferences.

## 🎮 **Your Gaming Profile Analysis**
First, analyze the common threads in the selected games (genres, themes, mechanics, target audience, etc.).

## 🌟 **Personalized Recommendations**

For each of the 5 recommendations, provide:

### **[Game Title]**
- **Why You'll Love It**: A compelling explanation of why this game fits perfectly with the selected favorites. Reference specific elements from the chosen games.
- **Key Highlights**: 2-3 standout features that make this game special
- **Best For**: What type of gaming session or mood this game suits

## 💎 **Valuable Insights**
- **Your Gaming DNA**: What patterns emerge from your game choices?
- **Recommendation Strategy**: Why these 5 games were chosen over thousands of others
- **Next Steps**: Suggestions for exploring new gaming territories based on your tastes

Make your recommendations diverse enough to offer variety while staying true to the player's demonstrated preferences. Use an engaging, knowledgeable tone that shows deep understanding of gaming culture.

Format everything in clean, readable Markdown.
      `;
    }

    try {
      const aiResponse = await getAIResponse(prompt);
      
      if (aiResponse) {
        aiResponseEl.innerHTML = `
          <div class="prose prose-lg dark:prose-invert max-w-none bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-lg border border-blue-100 dark:border-slate-700">
            ${marked(aiResponse)}
          </div>
        `;
      } else {
        throw new Error("The AI returned an empty response.");
      }
    } catch (error) {
      console.error("AI Response Error:", error);
      aiResponseEl.innerHTML = `
        <div class="prose dark:prose-invert max-w-none">
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p class="text-red-600 dark:text-red-400 font-medium">❌ AI Analysis Failed</p>
            <p class="text-red-500 dark:text-red-300 text-sm mt-1">${error.message}</p>
            <p class="text-gray-600 dark:text-gray-400 text-sm mt-2">Please try again or check your API configuration.</p>
          </div>
        </div>
      `;
    } finally {
      submitBtn.disabled = selected.length !== maxSelection;
      submitBtn.textContent = buttonText;
    }
  }

  // Initialize the component
  renderSelected();

  // Add event listeners
  inputEl.addEventListener("input", e => debouncedSearch(e.target.value.trim()));
  inputEl.addEventListener("keydown", e => { 
    if (e.key === "Enter") {
      e.preventDefault();
      // Optionally trigger search immediately on Enter
      const value = e.target.value.trim();
      if (value.length >= 2) {
        clearTimeout(debounceTimeout);
        searchGames(value);
      }
    }
  });
  submitBtn.addEventListener("click", handleSubmit);

  console.log(`✅ GameSelector initialized for instance: ${id}`);
}