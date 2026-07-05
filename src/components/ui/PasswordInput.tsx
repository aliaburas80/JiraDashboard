'use client';
// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-021: shared show/hide toggle for every password/secret input in the app —
// drop-in replacement for a bare <input type="password">. Never logs the value;
// toggling only changes the DOM `type` attribute, so nothing else about the
// field's behavior (autoComplete, validation, form submission) changes.

import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { SvgIcon } from '@/components/ui/SvgIcon';
import styles from './PasswordInput.module.scss';

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Class name applied to the wrapping <div>, not the <input> — use `className` for the input itself. */
  wrapperClassName?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ className, wrapperClassName, ...inputProps }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={clsx('relative', wrapperClassName)}>
        <input
          {...inputProps}
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={clsx(className, styles.hasToggle)}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:text-slate-700"
        >
          <SvgIcon name={visible ? 'eyeOff' : 'eye'} size={16} />
        </button>
      </div>
    );
  },
);
