// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// DemoRequest — a "Request a demo" trigger button plus its modal form. Used in
// several spots on the public /promo page (nav, hero, final CTA). The form
// collects who the visitor is, what they need, and why, then POSTs to
// /api/demo-request, which emails the product owner.
//
// The trigger's appearance is owned by the caller via `triggerClassName` so it
// can match the surrounding buttons; the modal owns its own presentation.
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import styles from './DemoRequest.module.scss';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface DemoRequestProps {
  label: string;
  triggerClassName?: string;
}

const FIELDS = [
  { name: 'name', label: 'Full name', type: 'text', placeholder: 'Jane Doe', autoComplete: 'name' },
  { name: 'email', label: 'Work email', type: 'email', placeholder: 'jane@company.com', autoComplete: 'email' },
  { name: 'organization', label: 'Organization', type: 'text', placeholder: 'Acme Inc.', autoComplete: 'organization' },
  { name: 'role', label: 'Your role', type: 'text', placeholder: 'Scrum Master, Delivery Manager…', autoComplete: 'organization-title' },
] as const;

export default function DemoRequest({ label, triggerClassName }: DemoRequestProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => { setMounted(true); }, []);

  // Close on Escape and lock body scroll while open; restore focus on close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstFieldRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    setError(null);
    if (status !== 'success') setStatus('idle');
    triggerRef.current?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('submitting');
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      organization: String(form.get('organization') ?? ''),
      role: String(form.get('role') ?? ''),
      need: String(form.get('need') ?? ''),
      justification: String(form.get('justification') ?? ''),
    };

    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus('error');
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Network error. Please check your connection and try again.');
    }
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className={triggerClassName}
        onClick={() => {
          setOpen(true);
          setStatus('idle');
        }}
      >
        {label}
      </button>

      {mounted && open && createPortal(
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className={styles.dialog} ref={dialogRef}>
            <button type="button" className={styles.dialogClose} onClick={close} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>

            {status === 'success' ? (
              <div className={styles.success}>
                <span className={styles.successMark} aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h2 id={titleId} className={styles.dialogTitle}>
                  Request sent
                </h2>
                <p className={styles.dialogSub}>
                  Thanks — your demo request is on its way. We&rsquo;ll be in touch at the email you
                  provided.
                </p>
                <button type="button" className={styles.submit} onClick={close}>
                  Done
                </button>
              </div>
            ) : (
              <>
                <header className={styles.dialogHead}>
                  <p className={styles.dialogKicker}>Request a demo</p>
                  <h2 id={titleId} className={styles.dialogTitle}>
                    Let&rsquo;s see your delivery clearly.
                  </h2>
                  <p className={styles.dialogSub}>
                    Tell us who you are and what you need. We&rsquo;ll reach out to set up a walkthrough.
                  </p>
                </header>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                  <div className={styles.fieldGrid}>
                    {FIELDS.map((field, i) => (
                      <label key={field.name} className={styles.field}>
                        <span className={styles.fieldLabel}>{field.label}</span>
                        <input
                          ref={i === 0 ? firstFieldRef : undefined}
                          className={styles.input}
                          type={field.type}
                          name={field.name}
                          placeholder={field.placeholder}
                          autoComplete={field.autoComplete}
                          required
                          maxLength={2000}
                        />
                      </label>
                    ))}
                  </div>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>What do you need?</span>
                    <textarea
                      className={styles.textarea}
                      name="need"
                      rows={2}
                      required
                      maxLength={2000}
                      placeholder="e.g. sprint health and forecasting across 4 teams"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Why are you interested? (justification)</span>
                    <textarea
                      className={styles.textarea}
                      name="justification"
                      rows={3}
                      required
                      minLength={20}
                      maxLength={2000}
                      placeholder="Tell us about the problem you're trying to solve."
                    />
                  </label>

                  {error && (
                    <p className={styles.error} role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className={clsx(styles.submit, status === 'submitting' && styles.submitting)}
                    disabled={status === 'submitting'}
                  >
                    {status === 'submitting' ? 'Sending…' : 'Send request'}
                  </button>
                  <p className={styles.privacyNote}>
                    We only use these details to follow up about a demo.
                  </p>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
