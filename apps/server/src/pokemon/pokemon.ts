import sharp from "sharp";

const POKEAPI_BASE_URL = "https://pokeapi.co/api/v2";
const MAX_WIDTH = 128;
const MAX_HEIGHT = 64;

interface PokemonSprites {
  front_default: string | null;
  front_shiny: string | null;
  front_female: string | null;
  front_shiny_female: string | null;
  back_default: string | null;
  back_shiny: string | null;
  back_female: string | null;
  back_shiny_female: string | null;
  other?: {
    dream_world?: {
      front_default: string | null;
      front_female: string | null;
    };
    home?: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
    };
    "official-artwork"?: {
      front_default: string | null;
      front_shiny: string | null;
    };
    showdown?: {
      front_default: string | null;
      front_female: string | null;
      front_shiny: string | null;
      front_shiny_female: string | null;
      back_default: string | null;
      back_female: string | null;
      back_shiny: string | null;
      back_shiny_female: string | null;
    };
  };
  versions?: {
    [generation: string]: {
      [version: string]: {
        front_default: string | null;
        front_female: string | null;
        front_shiny: string | null;
        front_shiny_female: string | null;
        back_default: string | null;
        back_female: string | null;
        back_shiny: string | null;
        back_shiny_female: string | null;
      };
    };
  };
}

interface PokemonResponse {
  id: number;
  name: string;
  sprites: PokemonSprites;
}

/**
 * Recursively collect all sprite URLs from the sprites object
 */
const collectAllSprites = (sprites: PokemonSprites): string[] => {
  const spriteUrls: string[] = [];

  const collect = (obj: any): void => {
    if (typeof obj === "string" && obj !== null) {
      spriteUrls.push(obj);
    } else if (typeof obj === "object" && obj !== null) {
      Object.values(obj).forEach((value) => {
        collect(value);
      });
    }
  };

  collect(sprites);
  return spriteUrls.filter((url) => url.trim() !== "");
};

/**
 * Fetch image size from URL
 */
const getImageSize = async (url: string): Promise<number> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      return parseInt(contentLength, 10);
    }
    // If content-length is not available, fetch the full image
    const imageResponse = await fetch(url);
    const blob = await imageResponse.blob();
    return blob.size;
  } catch (error) {
    console.error(`Error fetching image size for ${url}:`, error);
    return Infinity; // Return Infinity if we can't determine size
  }
};

/**
 * Find the smallest sprite by file size
 */
const findSmallestSprite = async (
  sprites: PokemonSprites
): Promise<string | null> => {
  const allSprites = collectAllSprites(sprites);

  if (allSprites.length === 0) {
    return null;
  }

  // Fetch sizes for all sprites
  const spriteSizes = await Promise.all(
    allSprites.map(async (url) => ({
      url,
      size: await getImageSize(url),
    }))
  );

  // Sort by size and return the smallest
  spriteSizes.sort((a, b) => a.size - b.size);
  return spriteSizes[0]?.url || null;
};

/**
 * Convert PNG image to bitmap format for ESP32 OLED displays
 * Returns 1-bit monochrome bitmap data with dimensions
 */
const convertToBitmap = async (
  imageUrl: string
): Promise<{
  width: number;
  height: number;
  bitmapData: number[];
}> => {
  try {
    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image metadata to calculate resize dimensions
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || MAX_WIDTH;
    const originalHeight = metadata.height || MAX_HEIGHT;

    // Calculate resize dimensions maintaining aspect ratio
    let width = originalWidth;
    let height = originalHeight;
    const aspectRatio = originalWidth / originalHeight;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      if (aspectRatio > 1) {
        // Landscape
        width = MAX_WIDTH;
        height = Math.round(MAX_WIDTH / aspectRatio);
        if (height > MAX_HEIGHT) {
          height = MAX_HEIGHT;
          width = Math.round(MAX_HEIGHT * aspectRatio);
        }
      } else {
        // Portrait or square
        height = MAX_HEIGHT;
        width = Math.round(MAX_HEIGHT * aspectRatio);
        if (width > MAX_WIDTH) {
          width = MAX_WIDTH;
          height = Math.round(MAX_WIDTH / aspectRatio);
        }
      }
    }

    // Ensure width is byte-aligned (multiple of 8) for OLED displays
    const byteAlignedWidth = Math.ceil(width / 8) * 8;

    // Process image: resize, convert to grayscale, threshold to 1-bit
    const processedImage = await sharp(imageBuffer)
      .resize(byteAlignedWidth, height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .greyscale()
      .threshold(128) // Convert to 1-bit (0 or 255)
      .raw()
      .toBuffer();

    // Convert to bitmap byte array format
    // Each byte represents 8 pixels horizontally (MSB first for SSD1306)
    const bitmapData: number[] = [];
    const bytesPerRow = byteAlignedWidth / 8;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < bytesPerRow; x++) {
        let byte = 0;
        for (let bit = 0; bit < 8; bit++) {
          const pixelX = x * 8 + bit;
          const pixelIndex = y * byteAlignedWidth + pixelX;
          const pixelValue = processedImage[pixelIndex] || 0;
          // If pixel is white (255), set bit to 1 (OLED displays typically invert)
          // If pixel is black (0), set bit to 0
          if (pixelValue > 127) {
            byte |= 1 << (7 - bit); // MSB first
          }
        }
        bitmapData.push(byte);
      }
    }

    return {
      width: byteAlignedWidth,
      height,
      bitmapData,
    };
  } catch (error: any) {
    throw new Error(`Failed to convert image to bitmap: ${error.message}`);
  }
};

/**
 * Fetch Pokemon details and return the smallest sprite
 */
export const getPokemonSmallestSprite = async (
  id: number
): Promise<{
  pokemonId: number;
  pokemonName: string;
  smallestSprite: string | null;
}> => {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon: ${response.statusText}`);
    }

    const pokemon: PokemonResponse = (await response.json()) as PokemonResponse;
    const smallestSprite = await findSmallestSprite(pokemon.sprites);

    return {
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      smallestSprite,
    };
  } catch (error: any) {
    throw new Error(`Failed to get Pokemon smallest sprite: ${error.message}`);
  }
};

/**
 * Fetch Pokemon details, get smallest sprite, and convert to bitmap
 */
export const getPokemonBitmap = async (
  id: number
): Promise<{
  pokemonId: number;
  pokemonName: string;
  width: number;
  height: number;
  bitmapData: number[];
  originalSpriteUrl: string | null;
}> => {
  try {
    const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Pokemon: ${response.statusText}`);
    }

    const pokemon: PokemonResponse = (await response.json()) as PokemonResponse;
    const smallestSprite = await findSmallestSprite(pokemon.sprites);

    if (!smallestSprite) {
      throw new Error("No sprite found for this Pokemon");
    }

    const bitmap = await convertToBitmap(smallestSprite);

    return {
      pokemonId: pokemon.id,
      pokemonName: pokemon.name,
      width: bitmap.width,
      height: bitmap.height,
      bitmapData: bitmap.bitmapData,
      originalSpriteUrl: smallestSprite,
    };
  } catch (error: any) {
    throw new Error(`Failed to get Pokemon bitmap: ${error.message}`);
  }
};
