export const LIMITS = {
  title: 80,
  body: 20000,
  photos: 4,
  photoBytes: 6 * 1024 * 1024,
  monthlyMinEntries: 3,
};

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
