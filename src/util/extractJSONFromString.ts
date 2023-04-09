export function extractJSONFromString(inputString: string): string | null {
  const regex = /{(?:[^{}]|{(?:[^{}]|{[^{}]*})*})*}/;
  const match = inputString.match(regex);
  return match ? match[0] : null;
}
  