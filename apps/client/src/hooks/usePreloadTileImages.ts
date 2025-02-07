import { useEffect } from 'react';
import { TILE_IMAGES } from '@/utils/tileImagesConfig';

export const usePreloadTileImages = () => {
  useEffect(() => {
    const preloadImages = (imageUrls: string[]) => {
      imageUrls.forEach((url) => {
        const img = new Image();
        img.src = url;
      });
    };

    preloadImages(Object.values(TILE_IMAGES));
  }, []);
};
