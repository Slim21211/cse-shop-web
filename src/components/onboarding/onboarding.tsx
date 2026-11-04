'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ONBOARDING_STEPS,
  type OnboardingStepKey,
} from '@/lib/onboarding';
import styles from './onboarding.module.scss';

const SPOTLIGHT_PADDING = 6;
const CARD_GAP = 14;
const VIEWPORT_MARGIN = 16;
const CARD_WIDTH = 320;
// Сколько ждать появления элемента: кнопка кабинета в шапке догружается потоком
const TARGET_TIMEOUT_MS = 5000;
const START_DELAY_MS = 500;

// Элемент с нужной меткой, видимый на текущей ширине экрана: на десктопе это пункт
// меню в шапке, на мобильных (меню скрыто) — карточка категории на главной
function findTarget(target: string): HTMLElement | null {
  const elements = document.querySelectorAll<HTMLElement>(
    `[data-onboarding="${target}"]`
  );
  for (const el of elements) {
    if (el.getClientRects().length > 0) return el;
  }
  return null;
}

function saveViewed(steps: OnboardingStepKey[]) {
  // keepalive: запрос дойдёт, даже если пользователь сразу ушёл со страницы
  fetch('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ steps }),
    keepalive: true,
  }).catch((error) => console.error('Onboarding save error:', error));
}

export function Onboarding({ stepKeys }: { stepKeys: OnboardingStepKey[] }) {
  const steps = ONBOARDING_STEPS.filter((step) => stepKeys.includes(step.key));
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);

  const step = started ? steps[index] : undefined;

  // Даём странице отрисоваться, прежде чем затемнять её
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Находим элемент текущего шага и следим за его положением
  useEffect(() => {
    if (!step) return;

    let element: HTMLElement | null = null;
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let observer: MutationObserver | undefined;

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (element) setRect(element.getBoundingClientRect());
      });
    };

    const attach = (found: HTMLElement) => {
      element = found;
      const box = found.getBoundingClientRect();
      if (box.top < 0 || box.bottom > window.innerHeight) {
        found.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      update();
    };

    const found = findTarget(step.target);
    if (found) {
      attach(found);
    } else {
      observer = new MutationObserver(() => {
        const appeared = findTarget(step.target);
        if (appeared) {
          observer?.disconnect();
          clearTimeout(timeout);
          attach(appeared);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      // Элемент так и не появился — переходим дальше, не отмечая шаг просмотренным
      timeout = setTimeout(() => {
        observer?.disconnect();
        setIndex((i) => i + 1);
      }, TARGET_TIMEOUT_MS);
    }

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      observer?.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [step]);

  useEffect(() => {
    if (rect) nextButtonRef.current?.focus({ preventScroll: true });
  }, [rect]);

  if (!step || !rect) return null;

  const isLast = index === steps.length - 1;

  const handleNext = () => {
    saveViewed([step.key]);
    setRect(null);
    setIndex(index + 1);
  };

  const handleSkip = () => {
    saveViewed(steps.slice(index).map((s) => s.key));
    setRect(null);
    setIndex(steps.length);
  };

  // Карточка — под элементом, а если внизу не хватает места — над ним
  const viewportWidth = document.documentElement.clientWidth;
  const cardWidth = Math.min(CARD_WIDTH, viewportWidth - 2 * VIEWPORT_MARGIN);
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - cardWidth / 2, VIEWPORT_MARGIN),
    viewportWidth - cardWidth - VIEWPORT_MARGIN
  );
  const placeAbove = rect.bottom + 220 > window.innerHeight && rect.top > 220;
  const top = placeAbove
    ? rect.top - SPOTLIGHT_PADDING - CARD_GAP
    : rect.bottom + SPOTLIGHT_PADDING + CARD_GAP;

  return createPortal(
    <>
      {/* Перехватывает клики: во время онбординга страница не реагирует */}
      <div className={styles.overlay} />
      <div
        className={styles.spotlight}
        style={{
          top: rect.top - SPOTLIGHT_PADDING,
          left: rect.left - SPOTLIGHT_PADDING,
          width: rect.width + 2 * SPOTLIGHT_PADDING,
          height: rect.height + 2 * SPOTLIGHT_PADDING,
        }}
      />
      <div
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-text"
        style={{
          top,
          left,
          width: cardWidth,
          transform: placeAbove ? 'translateY(-100%)' : undefined,
        }}
      >
        <div className={styles.counter}>
          Шаг {index + 1} из {steps.length}
        </div>
        <h3 id="onboarding-title" className={styles.title}>
          {step.title}
        </h3>
        <p id="onboarding-text" className={styles.text}>
          {step.text}
        </p>
        <div className={styles.actions}>
          {!isLast && (
            <button type="button" className={styles.skip} onClick={handleSkip}>
              Пропустить
            </button>
          )}
          <button
            ref={nextButtonRef}
            type="button"
            className={styles.next}
            onClick={handleNext}
          >
            {isLast ? 'Понятно' : 'Дальше'}
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
