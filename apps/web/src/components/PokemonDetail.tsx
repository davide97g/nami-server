import { useEffect, useState, useRef } from 'react';
import { fetchPokemon, extractPokemonId } from '../services/pokemonApi';
import { getServerUrl } from '../config';
import type { Pokemon, PokemonListItem } from '../types/pokemon';

interface PokemonDetailProps {
  pokemon: PokemonListItem | null;
  onClose: () => void;
}

const PokemonDetail = ({ pokemon, onClose }: PokemonDetailProps) => {
  const [pokemonData, setPokemonData] = useState<Pokemon | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetchingSprite, setIsFetchingSprite] = useState<boolean>(false);
  const [spriteResult, setSpriteResult] = useState<{ pokemonId: number; pokemonName: string; smallestSprite: string | null } | null>(null);
  const [isFetchingBitmap, setIsFetchingBitmap] = useState<boolean>(false);
  const [bitmapResult, setBitmapResult] = useState<{ pokemonId: number; pokemonName: string; width: number; height: number; bitmapData: number[]; originalSpriteUrl: string | null } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!pokemon) {
      setPokemonData(null);
      return;
    }

    const loadPokemonData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const pokemonId = extractPokemonId(pokemon.url);
        const data = await fetchPokemon(pokemonId);
        setPokemonData(data);
      } catch (err) {
        setError('Failed to load Pokemon data');
        console.error('Failed to load Pokemon:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPokemonData();
  }, [pokemon]);

  if (!pokemon) return null;

  const getAllSprites = (sprites: Pokemon['sprites']): Array<{ name: string; url: string | null }> => {
    const spriteList: Array<{ name: string; url: string | null }> = [];

    if (sprites.front_default) spriteList.push({ name: 'Front Default', url: sprites.front_default });
    if (sprites.front_shiny) spriteList.push({ name: 'Front Shiny', url: sprites.front_shiny });
    if (sprites.front_female) spriteList.push({ name: 'Front Female', url: sprites.front_female });
    if (sprites.front_shiny_female) spriteList.push({ name: 'Front Shiny Female', url: sprites.front_shiny_female });
    if (sprites.back_default) spriteList.push({ name: 'Back Default', url: sprites.back_default });
    if (sprites.back_shiny) spriteList.push({ name: 'Back Shiny', url: sprites.back_shiny });
    if (sprites.back_female) spriteList.push({ name: 'Back Female', url: sprites.back_female });
    if (sprites.back_shiny_female) spriteList.push({ name: 'Back Shiny Female', url: sprites.back_shiny_female });

    if (sprites.other?.dream_world?.front_default) {
      spriteList.push({ name: 'Dream World', url: sprites.other.dream_world.front_default });
    }
    if (sprites.other?.dream_world?.front_female) {
      spriteList.push({ name: 'Dream World Female', url: sprites.other.dream_world.front_female });
    }

    if (sprites.other?.home?.front_default) {
      spriteList.push({ name: 'Home Front', url: sprites.other.home.front_default });
    }
    if (sprites.other?.home?.front_female) {
      spriteList.push({ name: 'Home Front Female', url: sprites.other.home.front_female });
    }
    if (sprites.other?.home?.front_shiny) {
      spriteList.push({ name: 'Home Front Shiny', url: sprites.other.home.front_shiny });
    }
    if (sprites.other?.home?.front_shiny_female) {
      spriteList.push({ name: 'Home Front Shiny Female', url: sprites.other.home.front_shiny_female });
    }

    if (sprites.other?.['official-artwork']?.front_default) {
      spriteList.push({ name: 'Official Artwork', url: sprites.other['official-artwork'].front_default });
    }
    if (sprites.other?.['official-artwork']?.front_shiny) {
      spriteList.push({ name: 'Official Artwork Shiny', url: sprites.other['official-artwork'].front_shiny });
    }

    if (sprites.other?.showdown?.front_default) {
      spriteList.push({ name: 'Showdown Front', url: sprites.other.showdown.front_default });
    }
    if (sprites.other?.showdown?.front_female) {
      spriteList.push({ name: 'Showdown Front Female', url: sprites.other.showdown.front_female });
    }
    if (sprites.other?.showdown?.front_shiny) {
      spriteList.push({ name: 'Showdown Front Shiny', url: sprites.other.showdown.front_shiny });
    }
    if (sprites.other?.showdown?.front_shiny_female) {
      spriteList.push({ name: 'Showdown Front Shiny Female', url: sprites.other.showdown.front_shiny_female });
    }
    if (sprites.other?.showdown?.back_default) {
      spriteList.push({ name: 'Showdown Back', url: sprites.other.showdown.back_default });
    }
    if (sprites.other?.showdown?.back_female) {
      spriteList.push({ name: 'Showdown Back Female', url: sprites.other.showdown.back_female });
    }
    if (sprites.other?.showdown?.back_shiny) {
      spriteList.push({ name: 'Showdown Back Shiny', url: sprites.other.showdown.back_shiny });
    }
    if (sprites.other?.showdown?.back_shiny_female) {
      spriteList.push({ name: 'Showdown Back Shiny Female', url: sprites.other.showdown.back_shiny_female });
    }

    return spriteList.filter((sprite) => sprite.url !== null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleGetSmallestSprite = async () => {
    if (!pokemonData) return;

    setIsFetchingSprite(true);
    setSpriteResult(null);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/pokemon/smallest-sprite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: pokemonData.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch smallest sprite');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setSpriteResult(result.data);
      } else {
        throw new Error(result.error || 'Failed to get smallest sprite');
      }
    } catch (err) {
      console.error('Error fetching smallest sprite:', err);
      alert('Failed to fetch smallest sprite. Please try again.');
    } finally {
      setIsFetchingSprite(false);
    }
  };

  const renderBitmapToCanvas = (bitmapData: number[], width: number, height: number) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Create ImageData
    const imageData = ctx.createImageData(width, height);
    const bytesPerRow = width / 8;

    // Convert bitmap bytes to pixel data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerRow; x++) {
        const byte = bitmapData[y * bytesPerRow + x];
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = x * 8 + bit;
          if (pixelX >= width) break;

          const pixelIndex = (y * width + pixelX) * 4;
          const isWhite = (byte & (1 << (7 - bit))) !== 0;

          // Set pixel color (invert for display - white pixels become black, black become white)
          imageData.data[pixelIndex] = isWhite ? 0 : 255; // R
          imageData.data[pixelIndex + 1] = isWhite ? 0 : 255; // G
          imageData.data[pixelIndex + 2] = isWhite ? 0 : 255; // B
          imageData.data[pixelIndex + 3] = 255; // A
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const handleGetBitmap = async () => {
    if (!pokemonData) return;

    setIsFetchingBitmap(true);
    setBitmapResult(null);
    try {
      const serverUrl = getServerUrl();
      const response = await fetch(`${serverUrl}/api/pokemon/bitmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: pokemonData.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bitmap');
      }

      const result = await response.json();
      if (result.success && result.data) {
        setBitmapResult(result.data);
        // Render bitmap to canvas
        setTimeout(() => {
          renderBitmapToCanvas(
            result.data.bitmapData,
            result.data.width,
            result.data.height
          );
        }, 100);
      } else {
        throw new Error(result.error || 'Failed to get bitmap');
      }
    } catch (err) {
      console.error('Error fetching bitmap:', err);
      alert('Failed to fetch bitmap. Please try again.');
    } finally {
      setIsFetchingBitmap(false);
    }
  };

  useEffect(() => {
    if (bitmapResult && canvasRef.current) {
      renderBitmapToCanvas(
        bitmapResult.bitmapData,
        bitmapResult.width,
        bitmapResult.height
      );
    }
  }, [bitmapResult]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="dialog"
      aria-modal="true"
      aria-label="Pokemon details"
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        )}

        {pokemonData && !isLoading && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 capitalize mb-2">
                  {pokemonData.name}
                </h2>
                <p className="text-2xl text-gray-600">
                  #{String(pokemonData.id).padStart(3, '0')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
                aria-label="Close"
                tabIndex={0}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Main Image</h3>
                <div className="bg-gray-50 rounded-lg p-6 flex items-center justify-center">
                  {pokemonData.sprites.other?.['official-artwork']?.front_default ? (
                    <img
                      src={pokemonData.sprites.other['official-artwork'].front_default}
                      alt={pokemonData.name}
                      className="w-64 h-64 object-contain"
                    />
                  ) : pokemonData.sprites.front_default ? (
                    <img
                      src={pokemonData.sprites.front_default}
                      alt={pokemonData.name}
                      className="w-64 h-64 object-contain"
                    />
                  ) : (
                    <p className="text-gray-500">No image available</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Information</h3>
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Height:</span>{' '}
                    <span className="text-gray-900">{(pokemonData.height / 10).toFixed(1)} m</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Weight:</span>{' '}
                    <span className="text-gray-900">{(pokemonData.weight / 10).toFixed(1)} kg</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Base Experience:</span>{' '}
                    <span className="text-gray-900">{pokemonData.base_experience}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Types:</span>
                    <div className="flex gap-2 mt-2">
                      {pokemonData.types.map((type) => (
                        <span
                          key={type.slot}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize"
                        >
                          {type.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <button
                      onClick={handleGetSmallestSprite}
                      disabled={isFetchingSprite}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-medium"
                      aria-label="Get smallest sprite"
                    >
                      {isFetchingSprite ? 'Fetching...' : 'Get Smallest Sprite'}
                    </button>
                    {spriteResult && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Smallest Sprite:</p>
                        {spriteResult.smallestSprite ? (
                          <div className="flex flex-col items-center gap-2">
                            <img
                              src={spriteResult.smallestSprite}
                              alt={`${spriteResult.pokemonName} smallest sprite`}
                              className="w-32 h-32 object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            <a
                              href={spriteResult.smallestSprite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {spriteResult.smallestSprite}
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No sprite found</p>
                        )}
                      </div>
                    )}
                    <button
                      onClick={handleGetBitmap}
                      disabled={isFetchingBitmap}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium"
                      aria-label="Get bitmap"
                    >
                      {isFetchingBitmap ? 'Converting...' : 'Get Bitmap (128x64)'}
                    </button>
                    {bitmapResult && (
                      <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">ESP32 OLED Bitmap:</p>
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
                            <canvas
                              ref={canvasRef}
                              className="border border-gray-400"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p><span className="font-medium">Dimensions:</span> {bitmapResult.width} x {bitmapResult.height} pixels</p>
                            <p><span className="font-medium">Bitmap Size:</span> {bitmapResult.bitmapData.length} bytes</p>
                            <p><span className="font-medium">Format:</span> 1-bit monochrome (ESP32 OLED compatible)</p>
                          </div>
                          {bitmapResult.originalSpriteUrl && (
                            <a
                              href={bitmapResult.originalSpriteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              Original Sprite
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">All Sprites</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {getAllSprites(pokemonData.sprites).map((sprite) => (
                  <div
                    key={sprite.name}
                    className="bg-gray-50 rounded-lg p-4 flex flex-col items-center"
                  >
                    <img
                      src={sprite.url || ''}
                      alt={sprite.name}
                      className="w-20 h-20 object-contain mb-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    <p className="text-xs text-gray-600 text-center">{sprite.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonDetail;

