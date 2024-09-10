async function fetchPokemons() {
  try {
    // Fetch a list of Pokémon (limit=20 by default)
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=20");
    const dataPokemon = await response.json();
    const pokemonList = dataPokemon.results;

    // Fetch detailed information for each Pokémon
    const pokemonDetails = await Promise.all(
      pokemonList.map((pokemon) => fetch(pokemon.url))
    );

    // Convert each fetched response to JSON (Pokemon details)
    const pokemonData = await Promise.all(
      pokemonDetails.map((response) => response.json())
    );

    return pokemonData;
  } catch (error) {
    console.error("There was an error fetching the Pokémon data:", error);
    return []; // Return an empty array in case of error
  }
}

async function renderData() {
  const pokecardContainer = document.querySelector("#pokemonCards"); // Make sure this exists in your HTML
  const pokemonData = await fetchPokemons(); // Fetch Pokémon data

  if (!pokemonData || pokemonData.length === 0) {
    pokecardContainer.innerHTML = "<p>No Pokémon found!</p>";
    return;
  }

  // Clear any previous Pokémon cards (if necessary)
  pokecardContainer.innerHTML = "";

  // Render each Pokémon card
  pokemonData.forEach((pokemon) => {
    const card = document.createElement("div");
    card.classList.add("card");

    // Pokémon Name (Title)
    const title = document.createElement("h2");
    title.textContent = pokemon.name;

    // Pokémon Types
    const body = document.createElement("p");
    body.textContent = `Types: ${pokemon.types
      .map((type) => type.type.name)
      .join(", ")}`;

    // Abilities List
    const abilitiesList = document.createElement("ul");
    pokemon.abilities.forEach((ability) => {
      const abilityListItem = document.createElement("li");
      abilityListItem.textContent = ability.ability.name;
      abilitiesList.appendChild(abilityListItem);
    });

    // Append name, types, and abilities to the card
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(abilitiesList);

    // Append the card to the container
    pokecardContainer.appendChild(card);
  });
}

// Call renderData to load Pokémon cards when the page is loaded
document.addEventListener("DOMContentLoaded", () => {
  renderData();
});

let selectedLanguage = "en";

// Change the language when the user selects a different language
function changeLanguage() {
  const languageSelector = document.getElementById("languageSelector");
  selectedLanguage = languageSelector.value;
  getPokemon(); // Refetch the Pokémon data with the selected language
}

// Event listener to detect language change
document
  .getElementById("languageSelector")
  .addEventListener("change", changeLanguage);

const pokemonCardsContainer = document.getElementById("pokemonCards");
const pokemonSearchInput = document.getElementById("pokemonSearch");

// Fetch Pokémon data based on user search and display it
async function getPokemon() {
  const searchQuery = pokemonSearchInput.value.toLowerCase().trim();
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${searchQuery}`;

  try {
    const pokemonResponse = await fetch(pokemonUrl);

    if (!pokemonResponse.ok) throw new Error("Pokémon not found");

    const pokemonData = await pokemonResponse.json();

    // Clear previous search results
    pokemonCardsContainer.innerHTML = "";

    displayPokemonCard(pokemonData);
  } catch (error) {
    console.error("Error fetching Pokémon:", error);
    pokemonCardsContainer.innerHTML = "<p>Pokémon not found!</p>";
  }
}

// Display a Pokémon card with basic info
function displayPokemonCard(pokemonData) {
  const pokemonCard = document.createElement("div");
  pokemonCard.classList.add("pokemon-card");

  pokemonCard.innerHTML = `
        <img src="${pokemonData.sprites.other["official-artwork"].front_default}" alt="${pokemonData.name}">
        <h2>${pokemonData.name}</h2>
        <p>ID: ${pokemonData.id}</p>
        <div class="pokemon-abilities">
            <h3>Abilities:</h3>
            <ul id="abilities-${pokemonData.id}"></ul>
        </div>
        <div class="pokemon-encounters">
            <h3>Encounters:</h3>
            <ul id="encounters-${pokemonData.id}"></ul>
        </div>
    `;
  pokemonCardsContainer.appendChild(pokemonCard);

  // Fetch and display abilities
  displayAbilities(pokemonData);

  // Fetch and display encounters
  displayEncounters(pokemonData.id);
}

// Fetch and display abilities for a Pokémon
async function displayAbilities(pokemonData) {
  const abilitiesContainer = document.getElementById(
    `abilities-${pokemonData.id}`
  );
  pokemonData.abilities.forEach(async (abilityInfo) => {
    try {
      const abilityUrl = abilityInfo.ability.url;
      const response = await fetch(abilityUrl);
      const abilityData = await response.json();

      const effectEntry = abilityData.effect_entries.find(
        (entry) => entry.language.name === selectedLanguage
      );

      const abilityItem = document.createElement("li");
      abilityItem.textContent = `${abilityData.name}: ${
        effectEntry
          ? effectEntry.short_effect
          : "No description available in selected language"
      }`;
      abilitiesContainer.appendChild(abilityItem);
    } catch (error) {
      console.error("Error fetching ability data:", error);
    }
  });
}

// Fetch and display encounter locations for a Pokémon
async function displayEncounters(pokemonId) {
  try {
    const encountersUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`;
    const response = await fetch(encountersUrl);
    const encountersData = await response.json();

    const encountersContainer = document.getElementById(
      `encounters-${pokemonId}`
    );
    encountersData.forEach((encounter) => {
      const locationItem = document.createElement("li");
      locationItem.textContent = encounter.location_area.name.replace(
        /-/g,
        " "
      );
      encountersContainer.appendChild(locationItem);
    });
  } catch (error) {
    console.error("Error fetching encounter data:", error);
  }
}
