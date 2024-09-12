//Esta parte trae la información de los pokemones
async function fetchPokemons() {
  try {
    const url = `https://pokeapi.co/api/v2/pokemon?language=${selectedLanguage}`;
    const pokemonData = await fetchUrl(url);
    const pokemonList = pokemonData.results;
    const pokemonDetails = await Promise.all(
      pokemonList.map((pokemon) => fetch(pokemon.url))
    );
    const pokemonDataArray = await Promise.all(
      pokemonDetails.map((response) => response.json())
    );

    let nextPageUrl = pokemonData.next;
    while (nextPageUrl) {
      const nextPageData = await fetchUrl(nextPageUrl);
      pokemonList.push(...nextPageData.results);
      nextPageUrl = nextPageData.next;
    }

    const allPokemonDetails = await Promise.all(
      pokemonList.map((pokemon) => fetch(pokemon.url))
    );
    const allPokemonData = await Promise.all(
      allPokemonDetails.map((response) => response.json())
    );

    return allPokemonData;
  } catch (error) {
    console.error("There was an error fetching the Pokémon data:", error);
    return [];
  }
}

async function fetchUrl(url) {
  const response = await fetch(url);
  return response.json();
}

async function renderData(type) {
  const pokecardContainer = document.querySelector("#pokemonCards");
  const pokemonData = await fetchPokemons();

  if (!pokemonData || pokemonData.length === 0) {
    pokecardContainer.innerHTML = "<p>No Pokémon found!</p>";
    return;
  }

  pokemonData.forEach((pokemon) => {
    if (pokemon.types[0].type.name === type.toLowerCase()) {
      const card = document.createElement("div");
      card.classList.add("card");

      const image = document.createElement("img");
      image.src = pokemon.sprites.other["official-artwork"].front_default;

      const title = document.createElement("h2");
      title.textContent =
        pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

      const info = document.createElement("p");
      info.textContent = `#${pokemon.id}`;

      const height = document.createElement("p");
      height.textContent = `Height: ${pokemon.height}`;

      const weight = document.createElement("p");
      weight.textContent = `Weight: ${pokemon.weight.maximum}kg`;

      const body = document.createElement("p");
      body.textContent = pokemon.types
        .map(
          (type) =>
            type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1)
        )
        .join(", ");

      const abilitiesList = document.createElement("ul");
      pokemon.abilities.forEach((ability) => {
        const abilityListItem = document.createElement("li");
        abilityListItem.textContent =
          ability.ability.name.charAt(0).toUpperCase() +
          ability.ability.name.slice(1);
        abilitiesList.appendChild(abilityListItem);
      });
      card.appendChild(image);
      card.appendChild(info);
      card.appendChild(title);
      card.appendChild(height);
      card.appendChild(weight);
      card.appendChild(body);
      card.appendChild(abilitiesList);
      card.addEventListener("click", (event) => {
        const pokemonName = card.querySelector("h2").textContent.toLowerCase();
        console.log(pokemonName);
        getPokemon(pokemonName);
      });

      pokecardContainer.appendChild(card);
    }
  });
  hideLoader();
}

document.addEventListener("DOMContentLoaded", () => {
  renderData("Fire");
});

let selectedLanguage = "en";

function changeLanguage() {
  const languageSelector = document.getElementById("languageSelector");
  selectedLanguage = languageSelector.value;
  getPokemon();
}

document
  .getElementById("languageSelector")
  .addEventListener("change", changeLanguage);

const pokemonCardsContainer = document.getElementById("pokemonCards");
const pokemonSearchInput = document.getElementById("pokemonSearch");

async function getPokemon(pokemonName) {
  let searchQuery = "";
  if (pokemonName === undefined) {
    searchQuery = pokemonSearchInput.value.toLowerCase().trim();
  } else {
    searchQuery = pokemonName;
  }
  console.log(pokemonName);
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${searchQuery}`;

  try {
    const pokemonResponse = await fetch(pokemonUrl);

    if (!pokemonResponse.ok) throw new Error("Pokémon not found");

    const pokemonData = await pokemonResponse.json();

    pokemonCardsContainer.innerHTML = "";

    displayPokemonCard(pokemonData);
  } catch (error) {
    console.error("Error fetching Pokémon:", error);
    pokemonCardsContainer.innerHTML = "<p>Pokémon not found!</p>";
  }
}

function displayPokemonCard(pokemonData) {
  const pokemonCard = document.createElement("div");
  pokemonCard.classList.add("pokemon-card");

  pokemonCard.innerHTML = `
        <div class="maininfo"><img src="${
          pokemonData.sprites.other["official-artwork"].front_default
        }" alt="${pokemonData.name}">
        <h2>${
          pokemonData.name.charAt(0).toUpperCase() + pokemonData.name.slice(1)
        }</h2>
        <p>ID: ${pokemonData.id}</p>
        <p>Height: ${pokemonData.height}</p>
        <p>Weight: ${pokemonData.weight}</p>
        </div>
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

  displayAbilities(pokemonData);

  displayEncounters(pokemonData.id);
}

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
      abilityItem.textContent = `${
        abilityData.name.charAt(0).toUpperCase() + abilityData.name.slice(1)
      }: ${
        effectEntry
          ? effectEntry.short_effect.charAt(0).toUpperCase() +
            effectEntry.short_effect.slice(1)
          : "No description available in selected language"
      }`;
      abilitiesContainer.appendChild(abilityItem);
    } catch (error) {
      console.error("Error fetching ability data:", error);
    }
  });
}

async function displayEncounters(pokemonId) {
  try {
    const encountersUrl = `https://pokeapi.co/api/v2/pokemon/${pokemonId}/encounters`;
    const response = await fetch(encountersUrl);
    const encountersData = await response.json();

    const encountersContainer = document.getElementById(
      `encounters-${pokemonId}`
    );

    encountersContainer.innerHTML = "";

    if (encountersData.length === 0) {
      encountersContainer.innerHTML = `<p>No known encounters.</p>`;
      return;
    }
    const encounterList = document.createElement("div");
    encounterList.classList.add("encounter-list");

    encountersData.forEach((encounter) => {
      const locationItem = document.createElement("span");
      locationItem.classList.add("location-badge");
      locationItem.textContent =
        encounter.location_area.name.charAt(0).toUpperCase() +
        encounter.location_area.name.slice(1).replace(/-/g, " ");
      encounterList.appendChild(locationItem);
    });

    encountersContainer.appendChild(encounterList);
  } catch (error) {
    console.error("Error fetching encounter data:", error);
  }
}

const pokemonTypes = [
  "Fire",
  "Water",
  "Grass",
  "Ice",
  "Electric",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Steel",
  "Dragon",
  "Dark",
  "Fairy",
];
const typeButtonsContainer = document.createElement("div");
typeButtonsContainer.className = "type-buttons";
document.querySelector("main").appendChild(typeButtonsContainer);

pokemonTypes.forEach((type) => {
  const button = document.createElement("button");
  button.textContent = type;
  button.className = `type-button ${type.toLowerCase()}`;
  button.addEventListener("click", () => {
    clean();
    renderData(type);
  });

  typeButtonsContainer.appendChild(button);
});

function clean() {
  document.querySelector("#pokemonCards").innerHTML = "";
}

function hideLoader() {
  const loader = document.querySelector(".loader");
  loader.classList.add("loader-hidden");
}
