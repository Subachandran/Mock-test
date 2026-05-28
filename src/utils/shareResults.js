import html2canvas from 'html2canvas';

const CAPTURE_OPTIONS = {
  backgroundColor: '#161926',
  scale: 2,
  useCORS: true,
  logging: false,
  onclone: (clonedDoc) => {
    const root = clonedDoc.querySelector('.results-share-target');
    if (root) {
      root.style.borderRadius = '14px';
    }
  },
};

export async function captureElementAsCanvas(element) {
  if (!element) throw new Error('Nothing to capture');
  return html2canvas(element, CAPTURE_OPTIONS);
}

export async function downloadResultsImage(element, filename) {
  const canvas = await captureElementAsCanvas(element);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1);
  link.click();
}

export async function shareOrDownloadResults(element, filename, shareTitle) {
  const canvas = await captureElementAsCanvas(element);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png', 1);
  });

  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareTitle,
        files: [file],
      });
      return { method: 'share' };
    } catch (err) {
      if (err.name === 'AbortError') return { method: 'cancelled' };
    }
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
  URL.revokeObjectURL(link.href);
  return { method: 'download' };
}

export function buildResultsFilename(sectionId, roundId, pct) {
  const date = new Date().toISOString().slice(0, 10);
  const safeSection = (sectionId || 'section').replace(/[^a-z0-9-]/gi, '-');
  const safeRound = (roundId || 'round').replace(/[^a-z0-9-]/gi, '-');
  return `mock-test-${safeSection}-${safeRound}-${pct}pct-${date}.png`;
}

export function buildFullMockResultsFilename(mockId, displayPct) {
  const date = new Date().toISOString().slice(0, 10);
  const safeMock = (mockId || 'full-mock').replace(/[^a-z0-9-]/gi, '-');
  return `mock-test-full-${safeMock}-${displayPct}pct-${date}.png`;
}
