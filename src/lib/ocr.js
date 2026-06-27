const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

export const extractTextFromImage = async (file) => {
  if (!file) {
    throw new Error('Please choose an image file.');
  }

  const allowedTypes = [
    'image/png', 'image/jpeg', 'image/webp', 'image/bmp',
    'image/heic', 'image/heif',
  ];

  if (!allowedTypes.includes(file.type) && !file.name?.match(/\.(heic|heif)$/i)) {
    throw new Error('Only PNG, JPG, WEBP, BMP, and HEIC images are supported.');
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Image is too large. Please upload a file under 20 MB.');
  }

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/ocr', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to extract text from image.');
  }

  const text = data.text?.replace(/\s+/g, ' ').trim();

  if (!text) {
    throw new Error('No readable text was found in this image.');
  }

  return text;
};

export const getImageConfidence = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch('/api/ocr', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return data.confidence || 'medium';
};
