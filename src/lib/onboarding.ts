// Шаги онбординга на главной. target — значение атрибута data-onboarding у элемента,
// который подсвечивается. Ключ шага хранится в БД: при переименовании шаг покажется заново.
export const ONBOARDING_STEPS = [
  {
    key: 'merch',
    target: 'merch',
    title: 'Мерч компании',
    text: 'Фирменная одежда, аксессуары и сувениры с логотипом КСЭ — обменивайте на них заработанные баллы.',
  },
  {
    key: 'gifts',
    target: 'gifts',
    title: 'Подарки отдела',
    text: 'Эксклюзивные подарки для сотрудников подразделений, участвующих в проекте.',
  },
  {
    key: 'rules',
    target: 'rules',
    title: 'Правила',
    text: 'Кто может участвовать, за что начисляются баллы и как оформить заказ — всё собрано здесь.',
  },
  {
    key: 'account',
    target: 'account',
    title: 'Личный кабинет',
    text: 'Ваш баланс баллов и история заказов. Здесь же можно выйти из аккаунта.',
  },
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];
export type OnboardingStepKey = OnboardingStep['key'];

export const ONBOARDING_STEP_KEYS: readonly string[] = ONBOARDING_STEPS.map(
  (step) => step.key
);
