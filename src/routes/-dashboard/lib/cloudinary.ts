/**
 * Returns an optimised Cloudinary URL for a given public ID.
 * f_auto  — best format for the browser (WebP / AVIF)
 * q_auto  — smart quality compression
 */
export function getCloudinaryImage(publicId: string): string {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${publicId}`
}
