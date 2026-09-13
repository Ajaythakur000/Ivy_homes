export function cleanDisplayDescription(description?: string): string {
  if (!description) return 'No description available.';
  const trimmed = description.trim();
  if (!trimmed) return 'No description available.';

  const marker = 'Note from the Ivy Homes data team';
  const lowerDesc = trimmed.toLowerCase();
  const lowerMarker = marker.toLowerCase();
  
  const index = lowerDesc.indexOf(lowerMarker);
  
  if (index !== -1) {
    const cleaned = trimmed.substring(0, index).trim();
    return cleaned || 'No description available.';
  }
  
  return trimmed;
}
