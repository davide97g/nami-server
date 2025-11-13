import type { Pokemon, PokemonListResponse } from '../types/pokemon';

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';

export const fetchPokemonList = async (limit: number = 1000): Promise<PokemonListResponse> => {
  const response = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch Pokemon list');
  }
  return response.json();
};

export const fetchPokemon = async (idOrName: string | number): Promise<Pokemon> => {
  const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${idOrName}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Pokemon: ${idOrName}`);
  }
  return response.json();
};

export const extractPokemonId = (url: string): number => {
  const matches = url.match(/\/pokemon\/(\d+)\//);
  return matches ? parseInt(matches[1], 10) : 0;
};

export const getPokemonImageUrl = (id: number): string => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};

