// utils/localImageUtils.js

/**
 * Maps plant names to local image files from the assets folder
 * @param {string} plantName - The name of the plant
 * @returns {string} - The path to the local image file
 */
export const getLocalImagePath = (plantName) => {
  const plantNameLower = plantName.toLowerCase();
  
  // Map common plant names to local image files
  if (plantNameLower.includes('aloe') || plantNameLower.includes('aloevera')) {
    return '/assets/aloevera_plant.jpeg';
  } else if (plantNameLower.includes('money')) {
    return '/assets/money_plant.jpeg';
  } else if (plantNameLower.includes('rose')) {
    return '/assets/rose_plant.jpeg';
  } else if (plantNameLower.includes('snake')) {
    return '/assets/snake_plant.jpeg';
  } else if (plantNameLower.includes('tulip')) {
    return '/assets/tulip_plant.jpeg';
  }
  
  // Default to a random plant image if no match is found
  const plantImages = [
    '/assets/aloevera_plant.jpeg',
    '/assets/money_plant.jpeg',
    '/assets/rose_plant.jpeg',
    '/assets/snake_plant.jpeg',
    '/assets/tulip_plant.jpeg'
  ];
  
  // Use the first character of the plant name to deterministically select an image
  const index = plantNameLower.charCodeAt(0) % plantImages.length;
  return plantImages[index];
};
