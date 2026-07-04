'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Floating feedback button + modal — rendered on every page (P0B-09).
// Never attaches uploaded Jira data.

import { useState, useRef, useEffect } from 'react';
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
  const [open,        setOpen]        = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');
  const [category,    setCategory]    = useState<string>(CATEGORIES[0]);
  const [message,     setMessage]     = useState('');
  const [impact,      setImpact]      = useState<ImpactLevel>('Minor');
  const [canContact,  setCanContact]  = useState(false);
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const triggerRef    = useRef<HTMLButtonElement>(null);

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
    setError('');
    setSubmitted(false);
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
