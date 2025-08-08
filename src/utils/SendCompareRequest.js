export default async function sendCompareRequest(gameA, gameB) {
  // Development fallback for offline mode
  if (typeof window !== 'undefined' && !navigator.onLine) {
    console.warn('Offline mode detected. Using mock comparison.');
    return `${gameA} is compared with ${gameB}. (This is a mock response.)`;
  }

  const res = await fetch('/api/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameA, gameB })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error || `Compare failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}
