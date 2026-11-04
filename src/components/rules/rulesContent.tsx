import Image, { type StaticImageData } from 'next/image';
import ispringAvatar from '@/assets/rules/01-ispring-avatar.webp';
import ispringProfile from '@/assets/rules/02-ispring-profile.webp';
import shopHeaderPoints from '@/assets/rules/03-shop-header-points.webp';
import shopLoginButton from '@/assets/rules/04-shop-login-button.webp';
import loginEmail from '@/assets/rules/05-login-email.webp';
import loginCode from '@/assets/rules/06-login-code.webp';
import loginCodeEmail from '@/assets/rules/07-login-code-email.webp';
import catalog from '@/assets/rules/08-catalog.webp';
import cart from '@/assets/rules/09-cart.webp';
import orderModal from '@/assets/rules/10-order-modal.webp';
import orderEmail from '@/assets/rules/11-order-email.webp';
import styles from './rules.module.scss';

const courses = [
  {
    type: 'Базовое обучение',
    description:
      'Обязательное, которое сотрудник пройдёт согласно траектории, которую ему создал и назначил руководитель / наставник',
    points: '20',
  },
  {
    type: 'Софт-скиллы',
    description:
      'Дополнительное обучение, которое расширяет знания сотрудника в разных областях',
    points: '30',
  },
  {
    type: 'Хард-скиллы',
    description:
      'Дополнительное обучение, которое углубляет знания о процессах компании',
    points: '50',
  },
];

const proactivity = [
  { description: 'Создание инструкций, которые востребованы в компании / в подразделении', points: '50' },
  { description: 'Взаимопомощь коллегам', points: '100' },
  { description: 'Участие в оптимизации процесса', points: '150' },
  { description: 'Удержание клиента / прибыль для компании', points: '200' },
];

function Screenshot({
  src,
  alt,
  narrow,
}: {
  src: StaticImageData;
  alt: string;
  // Узкие скриншоты (формы, письма) не растягиваем на всю ширину окна
  narrow?: boolean;
}) {
  return (
    <figure className={`${styles.figure} ${narrow ? styles.narrow : ''}`}>
      <Image
        src={src}
        alt={alt}
        sizes={narrow ? '(max-width: 768px) 90vw, 420px' : '(max-width: 900px) 90vw, 800px'}
        className={styles.image}
      />
    </figure>
  );
}

export default function RulesContent() {
  return (
    <div className={styles.body}>
      <p className={styles.lead}>
        Магазин подарков — это проект для сотрудников компании, чтобы поощрить
        ваши труды приятными и яркими моментами!
      </p>

      <section className={styles.section}>
        <h3>Суть проекта</h3>
        <p>
          Выполняйте свою будничную работу, будьте проактивны, проходите курсы
          iSpring — и получайте за это награды!
        </p>
      </section>

      <section className={styles.section}>
        <h3>Что вам нужно сделать для участия</h3>
        <ul>
          <li>Закрыть испытательный срок</li>
          <li>Являться «линейным» сотрудником в структуре своего подразделения</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Что нужно сделать вашему руководителю для вашего участия</h3>
        <ul>
          <li>
            Подать заявку на почту{' '}
            <a href="mailto:giftshop@cse.ru">giftshop@cse.ru</a> для участия
            подразделения в проекте
          </li>
          <li>Корректно передать орг. структуру вашего подразделения в iSpring</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Как «работают» ваши баллы</h3>
        <ul>
          <li>
            Баллы имеют накопительный эффект, т.е. не «сгорают» по истечении
            какого-то срока
          </li>
          <li>Баллы нельзя подарить другому или обменять на денежные средства</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Как получить баллы</h3>

        <h4>А) Проходите курсы iSpring</h4>
        <p>Баллы начисляются автоматически, сразу после прохождения.</p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Вид курса</th>
                <th>Описание</th>
                <th className={styles.pointsCell}>Баллы</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((row) => (
                <tr key={row.type}>
                  <td className={styles.nameCell}>{row.type}</td>
                  <td>{row.description}</td>
                  <td className={styles.pointsCell}>{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4>Б) Выполняйте свою будничную работу, превышая план, и будьте проактивны!</h4>
        <p>
          Баллы начисляются ежемесячно по результатам подсчётов вашего
          руководителя. Какие критерии учитывает руководитель:
        </p>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Критерий</th>
                <th>Описание</th>
                <th className={styles.pointsCell}>Баллы</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className={styles.nameCell}>Результативность</td>
                <td>
                  Содержит в себе несколько критериев, суть и ценность в баллах
                  которых определяет каждый руководитель самостоятельно
                </td>
                <td className={styles.pointsCell}>до 600</td>
              </tr>
              <tr>
                <td className={styles.nameCell} rowSpan={proactivity.length + 1}>
                  Проактивность
                </td>
                <td colSpan={2} className={styles.groupCell}>
                  Действия по категориям ниже, которые доведены до результата /
                  реализации
                </td>
              </tr>
              {proactivity.map((row) => (
                <tr key={row.description}>
                  <td>{row.description}</td>
                  <td className={styles.pointsCell}>{row.points}</td>
                </tr>
              ))}
              <tr>
                <td className={styles.nameCell}>Индивидуальная благодарность</td>
                <td>
                  Не просто «спасибо» в обычном диалоге от клиента / коллег, а
                  ситуации, когда клиент / коллега отдельно акцентирует внимание и
                  выделяет время на то, чтобы поблагодарить вас. Возможно, даже
                  обращается отдельно ради этого / направляет благодарственное
                  письмо (документ) и пр.
                </td>
                <td className={styles.pointsCell}>100</td>
              </tr>
              <tr>
                <td className={styles.nameCell}>Свободный</td>
                <td>
                  Дополнительные баллы на усмотрение руководителя. Например:
                  помощь в организации мероприятий для компании / офисов,
                  активное участие в подработках и пр.
                </td>
                <td className={styles.pointsCell}>100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h3>Как проверить количество своих баллов</h3>

        <h4>Способ 1 — платформа iSpring</h4>
        <p>Нажмите на аватар своего профиля в верхнем правом углу:</p>
        <Screenshot src={ispringAvatar} alt="Аватар профиля в iSpring" narrow />
        <p>В шапке профиля указано количество ваших баллов:</p>
        <Screenshot src={ispringProfile} alt="Баллы в профиле iSpring" narrow />

        <h4>Способ 2 — сайт Магазина подарков (после авторизации)</h4>
        <p>Количество ваших баллов указано в верхнем правом углу:</p>
        <Screenshot src={shopHeaderPoints} alt="Баллы в шапке сайта магазина" />
      </section>

      <section className={styles.section}>
        <h3>Как авторизоваться на сайте</h3>
        <ol>
          <li>
            Перейдите на сайт магазина и в правом верхнем углу нажмите кнопку
            «Войти».
            <Screenshot src={shopLoginButton} alt="Кнопка «Войти» в шапке сайта" />
          </li>
          <li>
            Введите свою рабочую электронную почту.
            <Screenshot src={loginEmail} alt="Форма ввода почты" narrow />
          </li>
          <li>
            Введите одноразовый код, который пришёл на вашу рабочую почту.
            <Screenshot src={loginCode} alt="Форма ввода кода" narrow />
            <Screenshot src={loginCodeEmail} alt="Письмо с кодом подтверждения" />
          </li>
        </ol>
      </section>

      <section className={styles.section}>
        <h3>Как оформить заказ</h3>
        <ol>
          <li>
            Перейдите в каталог и выберите позицию, нажав кнопку «В корзину».
            После добавления кнопка изменится на «В корзине». Чтобы перейти к
            оформлению заказа, нажмите на иконку корзины рядом с вашим профилем
            в верхнем правом углу.
            <Screenshot src={catalog} alt="Каталог товаров" />
          </li>
          <li>
            В корзине нажмите кнопку «Оформить заказ».
            <Screenshot src={cart} alt="Корзина с кнопкой «Оформить заказ»" />
          </li>
          <li>
            Появится окно с информацией, что заказ нужно подтвердить на вашей
            рабочей почте. После подтверждения с вами свяжется сотрудник
            Магазина подарков, чтобы согласовать условия доставки.
            <Screenshot src={orderModal} alt="Окно «Заказ оформлен»" narrow />
            Пример письма, на которое нужно ответить для подтверждения:
            <Screenshot src={orderEmail} alt="Письмо с составом заказа" narrow />
          </li>
        </ol>
      </section>
    </div>
  );
}
