const STUDY_HUB_UI_KEY = 'mocktest_study_hub_ui';

export function loadStudyHubUiState() {
  try {
    const raw = sessionStorage.getItem(STUDY_HUB_UI_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Merge partial UI state into session storage. */
export function saveStudyHubUiState(patch) {
  const prev = loadStudyHubUiState() || {};
  sessionStorage.setItem(
    STUDY_HUB_UI_KEY,
    JSON.stringify({
      ...prev,
      ...patch,
    })
  );
}

export function getInitialStudyHubUiState() {
  const saved = loadStudyHubUiState();
  return {
    groupBySection: Boolean(saved?.groupBySection),
    collapsedGroups: new Set(
      Array.isArray(saved?.collapsedGroups) ? saved.collapsedGroups.filter(Boolean) : []
    ),
    scrollY: typeof saved?.scrollY === 'number' && saved.scrollY >= 0 ? saved.scrollY : 0,
  };
}

/** Call before navigating away from Study Hub so scroll is not lost. */
export function saveStudyHubScrollNow(scrollY = window.scrollY) {
  if (typeof scrollY !== 'number' || scrollY < 0) return;
  saveStudyHubUiState({ scrollY });
}

/**
 * Retry scroll restore until content height allows it or attempts are exhausted.
 * Returns a cancel function.
 */
export function restoreStudyHubScroll(targetY) {
  if (targetY <= 0) return () => {};

  let cancelled = false;
  let attempts = 0;
  const maxAttempts = 30;

  const tryRestore = () => {
    if (cancelled) return;

    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const y = Math.min(targetY, maxScroll);
    window.scrollTo(0, y);

    const reached = Math.abs(window.scrollY - y) <= 3;
    const tallEnough = document.documentElement.scrollHeight > window.innerHeight + 80;

    if (reached || (tallEnough && attempts >= 4) || attempts >= maxAttempts) {
      return;
    }

    attempts += 1;
    setTimeout(tryRestore, attempts < 5 ? 0 : 60);
  };

  tryRestore();
  requestAnimationFrame(tryRestore);
  const timer = setTimeout(tryRestore, 120);
  const timer2 = setTimeout(tryRestore, 280);

  return () => {
    cancelled = true;
    clearTimeout(timer);
    clearTimeout(timer2);
  };
}
