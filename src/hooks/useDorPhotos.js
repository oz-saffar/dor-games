import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to load Dor's photos dynamically.
 * Uses Vite's import.meta.glob to discover every image in the folder at build time —
 * works regardless of filename, no hardcoded names needed.
 */
export const useDorPhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Glob public dir — keys are file paths like /public/assets/dor_photos/dor6.jpg
        const imageModules = import.meta.glob(
          '/public/assets/dor_photos/*.{jpg,jpeg,png,gif,JPG,JPEG,PNG,GIF}',
          { eager: true, query: '?url', import: 'default' }
        );

        // For files in /public, Vite returns the value as the path string with ?url suffix.
        // Strip /public and ?url to get the runtime-accessible URL e.g. /assets/dor_photos/dor6.jpg
        const photoUrls = Object.values(imageModules)
          .filter((v) => typeof v === 'string' && v.length > 0)
          .map((v) => v.replace(/^\/public/, '').replace(/\?url$/, ''));

        if (photoUrls.length > 0) {
          if (import.meta.env.DEV) {
            console.log('🖼️ Photo system ready! Found', photoUrls.length, 'photos');
          }
          setPhotos(photoUrls);
          return;
        }

        // Glob found nothing (photos were absent at build time but exist on the server).
        // Fall back to the known range — the server serves them at runtime.
        const keyUrls = Object.keys(imageModules).map((p) => p.replace('/public', ''));
        if (keyUrls.length > 0) {
          if (import.meta.env.DEV) {
            console.log('🖼️ Key-based fallback,', keyUrls.length, 'photos');
          }
          setPhotos(keyUrls);
          return;
        }

        throw new Error('no photos found by glob');
      } catch {
        // Runtime fallback: photos live on the server even if absent at build time
        const fallback = [];
        for (let i = 6; i <= 29; i++) {
          fallback.push(`/assets/dor_photos/dor${i}.jpg`);
        }
        if (import.meta.env.DEV) {
          console.log('🖼️ Runtime fallback, using', fallback.length, 'photo paths');
        }
        setPhotos(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadPhotos();
  }, []);

  const getRandomPhoto = useCallback(() => {
    if (photos.length === 0) return null;
    return photos[Math.floor(Math.random() * photos.length)];
  }, [photos]);

  return {
    photos,
    hasPhotos: photos.length > 0,
    isLoading,
    getRandomPhoto
  };
};
