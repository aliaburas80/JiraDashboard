'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Floating feedback button + modal — rendered on every page (P0B-09).
// Never attaches uploaded Jira data.

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import styles from './FeedbackButton.module.scss';

const CATEGORIES = [
  'Suggestion',
  'Problem/Bug',
  'Feature Request',
  'Complaint',
  'Question',
  'Data/Calculation Concern',
  'Other',
] as const;

type ImpactLevel = 'Minor' | 'Affects My Work' | 'Blocks Me';
const IMPACTS: ImpactLevel[] = ['Minor', 'Affects My Work', 'Blocks Me'];

// P0B-09: reduced-scale JPEG at moderate quality keeps the capture small —
// this is a submitted-with-the-report screenshot, not an archival copy.
const SCREENSHOT_SCALE   = 0.6;
const SCREENSHOT_QUALITY = 0.6;

function getBrowserFamily(): string {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome'))  return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari'))  return 'Safari';
  if (ua.includes('Edge'))    return 'Edge';
  return 'Other';
}

export function FeedbackButton() {
  const pathname = usePathname();
  const [open,        setOpen]        = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [category,    setCategory]    = useState<string>(CATEGORIES[0]);
  const [message,     setMessage]     = useState('');
  const [impact,      setImpact]      = useState<ImpactLevel>('Minor');
  const [canContact,  setCanContact]  = useState(false);
  const [screenshot,  setScreenshot]  = useState<string | null>(null);
  const [capturing,   setCapturing]   = useState(false);
  const [screenshotError, setScreenshotError] = useState('');
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const triggerRef    = useRef<HTMLButtonElement>(null);
  const isAuthPage = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/change-password',
  ].some(path => pathname === path || pathname.startsWith(`${path}/`));

  // Trap focus inside modal when open.
  useEffect(() => {
    if (open) firstFieldRef.current?.focus();
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  function handleClose() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function reset() {
    setCategory(CATEGORIES[0]);
    setMessage('');
    setImpact('Minor');
    setCanContact(false);
    setScreenshot(null);
    setScreenshotError('');
    setError('');
    setSubmitted(false);
  }

  // P0B-09: user-initiated, previewed capture — never automatic. The modal is
  // already open and the user explicitly clicks this button; nothing is
  // captured or sent without that action, and the resulting thumbnail is
  // shown before submission so the user can remove/retake it.
  async function handleCaptureScreenshot() {
    setScreenshotError('');
    setCapturing(true);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(document.body, { scale: SCREENSHOT_SCALE, logging: false });
      setScreenshot(canvas.toDataURL('image/jpeg', SCREENSHOT_QUALITY));
    } catch {
      setScreenshotError("Couldn't capture a screenshot. You can still submit without one.");
    } finally {
      setCapturing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) { setError('Please enter at least a few words.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message:       message.trim(),
          impactLevel:   impact,
          canContact,
          page:          window.location.pathname,
          browserFamily: getBrowserFamily(),
          screenshot:    screenshot ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? 'Submission failed. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthPage) return null;

  return (
    <>
      {/* Floating trigger */}
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => { reset(); setOpen(true); }}
        aria-label="Open feedback form"
        aria-haspopup="dialog"
      >
        💬 Feedback
      </button>

      {/* Modal */}
      {open && (
        <div
          className={styles.backdrop}
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
          >
            {/* Header */}
            <div className={styles.modalHeader}>
              <h2 id="feedback-modal-title" className={styles.modalTitle}>
                Share your feedback
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={handleClose}
                aria-label="Close feedback form"
              >
                ×
              </button>
            </div>

            {submitted ? (
              <div className={styles.success}>
                <div className={styles.successIcon} aria-hidden="true">✅</div>
                <p className={styles.successTitle}>Thank you!</p>
                <p className={styles.successSub}>Your feedback has been recorded.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                {/* Category */}
                <div className={styles.field}>
                  <label htmlFor="fb-category" className={styles.label}>Category</label>
                  <select
                    id="fb-category"
                    ref={firstFieldRef}
                    className={styles.select}
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Message */}
                <div className={styles.field}>
                  <label htmlFor="fb-message" className={styles.label}>
                    Your feedback <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="fb-message"
                    className={styles.textarea}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your suggestion, issue, or question…"
                    rows={4}
                    maxLength={2000}
                    required
                    aria-required="true"
                  />
                </div>

                {/* Impact level */}
                <div className={styles.field}>
                  <p className={styles.label} id="fb-impact-label">Impact on your work</p>
                  <div className={styles.impactRow} role="group" aria-labelledby="fb-impact-label">
                    {IMPACTS.map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        className={`${styles.impactChip}${impact === lvl ? ` ${styles.impactChipActive}` : ''}`}
                        onClick={() => setImpact(lvl)}
                        aria-pressed={impact === lvl}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screenshot (P0B-09) — opt-in, previewed before submit; never automatic */}
                <div className={styles.field}>
                  <p className={styles.label}>Screenshot (optional)</p>
                  {screenshot ? (
                    <div className={styles.screenshotPreviewWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- a locally captured data URI, not an optimizable remote asset */}
                      <img src={screenshot} alt="Captured screenshot preview" className={styles.screenshotPreview} />
                      <button
                        type="button"
                        className={styles.screenshotRemoveBtn}
                        onClick={() => setScreenshot(null)}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.screenshotBtn}
                      onClick={handleCaptureScreenshot}
                      disabled={capturing}
                    >
                      {capturing ? 'Capturing…' : '📷 Add a screenshot'}
                    </button>
                  )}
                  {screenshotError && <p className={styles.screenshotNote}>{screenshotError}</p>}
                </div>

                {/* Contact opt-in */}
                <div className={styles.checkRow}>
                  <input
                    type="checkbox"
                    id="fb-contact"
                    checked={canContact}
                    onChange={e => setCanContact(e.target.checked)}
                  />
                  <label htmlFor="fb-contact" className={styles.checkLabel}>
                    May we contact you about this feedback?
                  </label>
                </div>

                {error && <p className={styles.errorNote} role="alert">{error}</p>}

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? 'Sending…' : 'Send feedback'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
