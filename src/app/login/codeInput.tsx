'use client';

import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import styles from './page.module.scss';

const LENGTH = 6;

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  // Вызывается, когда введены все цифры — форма отправляется без нажатия кнопки
  onComplete: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  hasError,
}: CodeInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (index: number) => {
    const input = inputs.current[Math.max(0, Math.min(index, LENGTH - 1))];
    input?.focus();
    input?.select();
  };

  // Вставляет цифры начиная с ячейки index: работает и для одной цифры,
  // и для вставки/автозаполнения всего кода
  const fill = (index: number, digits: string) => {
    const clean = digits.replace(/\D/g, '');
    if (!clean) return;

    const chars = value.padEnd(LENGTH, ' ').split('');
    clean
      .slice(0, LENGTH - index)
      .split('')
      .forEach((digit, i) => (chars[index + i] = digit));

    const next = chars.join('').replace(/\s+$/, '');
    onChange(next);
    focus(index + clean.length);

    if (next.length === LENGTH && !next.includes(' ')) onComplete(next);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = value.padEnd(LENGTH, ' ').split('');
      // Пустая ячейка — стираем предыдущую и переходим на неё
      const target = chars[index] === ' ' ? index - 1 : index;
      if (target < 0) return;
      chars[target] = ' ';
      onChange(chars.join('').replace(/\s+$/, ''));
      focus(target);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focus(index - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focus(index + 1);
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(index, e.clipboardData.getData('text'));
  };

  return (
    <div
      className={`${styles.codeInputs} ${hasError ? styles.codeInputsError : ''}`}
      role="group"
      aria-label="Код из письма"
    >
      {Array.from({ length: LENGTH }, (_, index) => {
        const char = value[index];
        return (
          <input
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            className={styles.codeCell}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            // Автозаполнение кода (iOS/Android) кладёт весь код в первую ячейку
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={LENGTH}
            value={char && char !== ' ' ? char : ''}
            onChange={(e) => fill(index, e.target.value.replace(char ?? '', ''))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={(e) => handlePaste(index, e)}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            autoFocus={index === 0}
            aria-label={`Цифра ${index + 1}`}
          />
        );
      })}
    </div>
  );
}
