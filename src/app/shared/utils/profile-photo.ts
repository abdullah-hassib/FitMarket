/** FitMarket is frontend-only; keep uploaded avatars small enough for localStorage. */
export async function readProfilePhoto(file: File): Promise<string> {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.');
  }
  if (file.size > 400 * 1024) {
    throw new Error('Profile photos must be 400 KB or smaller.');
  }

  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not read image.'));
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(file);
  });
  if (!/^data:image\/(jpeg|png|webp);base64,[a-zA-Z0-9+/=]+$/.test(result)) {
    throw new Error('The image could not be processed.');
  }
  return result;
}
