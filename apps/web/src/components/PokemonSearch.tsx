import { useState, useEffect, useRef } from 'react';
import { fetchPokemonList, extractPokemonId, getPokemonImageUrl } from '../services/pokemonApi';
import type { PokemonListItem } from '../types/pokemon';

interface PokemonSearchProps {
  onSelect: (pokemon: PokemonListItem) => void;
}

const PokemonSearch = ({ onSelect }: PokemonSearchProps) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pokemonList, setPokemonList] = useState<PokemonListItem[]>([]);
  const [filteredPokemon, setFilteredPokemon] = useState<PokemonListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPokemonList = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPokemonList(1000);
        setPokemonList(data.results);
      } catch (error) {
        console.error('Failed to load Pokemon list:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPokemonList();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPokemon([]);
      setShowDropdown(false);
      return;
    }

    const filtered = pokemonList.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredPokemon(filtered.slice(0, 10));
    setShowDropdown(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm, pokemonList]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (pokemon: PokemonListItem) => {
    setSearchTerm('');
    setShowDropdown(false);
    setSelectedIndex(-1);
    onSelect(pokemon);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || filteredPokemon.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredPokemon.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredPokemon.length) {
          handleSelect(filteredPokemon[selectedIndex]);
        } else if (filteredPokemon.length > 0) {
          handleSelect(filteredPokemon[0]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInputFocus = () => {
    if (filteredPokemon.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          placeholder="Search for a Pokemon..."
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          aria-label="Pokemon search input"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
        />
        <svg
          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {showDropdown && filteredPokemon.length > 0 && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {filteredPokemon.map((pokemon, index) => {
            const pokemonId = extractPokemonId(pokemon.url);
            const imageUrl = getPokemonImageUrl(pokemonId);
            const isSelected = index === selectedIndex;

            return (
              <div
                key={pokemon.name}
                onClick={() => handleSelect(pokemon)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="text-sm font-medium text-gray-500 w-12">
                  #{String(pokemonId).padStart(3, '0')}
                </span>
                <img
                  src={imageUrl}
                  alt={pokemon.name}
                  className="w-12 h-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                <span className="flex-1 text-lg font-medium text-gray-900 capitalize">
                  {pokemon.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {showDropdown && filteredPokemon.length === 0 && searchTerm.trim() !== '' && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No Pokemon found
        </div>
      )}
    </div>
  );
};

export default PokemonSearch;

