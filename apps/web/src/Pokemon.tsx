import { useState } from 'react';
import PokemonSearch from './components/PokemonSearch';
import PokemonDetail from './components/PokemonDetail';
import type { PokemonListItem } from './types/pokemon';

const Pokemon = () => {
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonListItem | null>(null);

  const handleSelect = (pokemon: PokemonListItem) => {
    setSelectedPokemon(pokemon);
  };

  const handleClose = () => {
    setSelectedPokemon(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Pokemon Search
        </h1>
        
        <div className="mb-8">
          <PokemonSearch onSelect={handleSelect} />
        </div>

        {selectedPokemon && (
          <PokemonDetail pokemon={selectedPokemon} onClose={handleClose} />
        )}
      </div>
    </div>
  );
};

export default Pokemon;

