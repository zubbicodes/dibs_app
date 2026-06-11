export function getFilenameFromUrl(url: string, fallback: string) {
  try {
    const parsedUrl = new URL(url);
    const name = parsedUrl.pathname.split('/').pop();
    return name || fallback;
  } catch {
    return fallback;
  }
}

export async function downloadUrlInBrowser(url: string, filename: string) {
  if (typeof document === 'undefined') return;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  downloadBlobInBrowser(blob, filename);
}

export function downloadCsvInBrowser(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  downloadBlobInBrowser(blob, filename);
}

function downloadBlobInBrowser(blob: Blob, filename: string) {
  if (typeof document === 'undefined') return;

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
