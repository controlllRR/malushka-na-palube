const { Telegraf, session } = require('telegraf');

// ГЛОБАЛЬНЫЙ МАССИВ ТОВАРОВ
const products = [
  {
    name: 'Мёд',
    sizes: [0.15, 0.5, 0.75, 1],
    baseWeight: 0.15,
    basePrice: 2500,
    photo: 'med.jpg'
  },
  {
    name: 'кoкaин VHQ',
    sizes: [0.5, 1, 1.5, 2],
    baseWeight: 0.5,
    basePrice: 7500,
    photo: 'kokain.jpg'
  },
  {
    name: 'Меф крис White luxe',
    sizes: [0.5, 1, 1.5, 2],
    baseWeight: 0.5,
    basePrice: 1800,
    photo: 'mef.jpg'
  },
  {
    name: 'Альфа VHQ Green крис',
    sizes: [0.5, 1, 1.5, 2],
    baseWeight: 0.5,
    basePrice: 2800,
    photo: 'alpha_green.jpg'
  },
  {
    name: 'Альфа VHQ White крис',
    sizes: [0.5, 1, 1.5, 2],
    baseWeight: 0.5,
    basePrice: 2800,
    photo: 'alpha_white.jpg'
  },
  {
    name: 'гaшиш ice-O-Lator',
    sizes: [0.5, 1, 1.5, 2],
    baseWeight: 0.5,
    basePrice: 1200,
    photo: 'hash.jpg'
  },
  {
    name: 'мaрихуaнa AMNESIA VHQ',
    sizes: [0.5, 1, 1.5, 2],
    baseWeight: 0.5,
    basePrice: 1100,
    photo: 'marisha.jpg'
  }
];

// Хранилище заказов (в реальном проекте лучше использовать базу данных)
const orders = [];
const adminSessions = new Set();

// Вставь сюда свой токен Telegram-бота
const bot = new Telegraf('7588793773:AAFoVTS0MZS-v4ri6sb5CdglYiZxuqPYQhE');
bot.use(session());

// Команда для входа в админ-панель
bot.command('admin', (ctx) => {
  ctx.reply(
    '🔐 <b>Админ-панель</b>\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '\n' +
    'Введите пароль для входа в админ-панель:',
    { parse_mode: 'HTML' }
  );
  
  // Устанавливаем флаг ожидания пароля
  ctx.session = ctx.session || {};
  ctx.session.waitingForAdminPassword = true;
});

// Команда /start должна быть после команды /admin
bot.command('start', (ctx) => {
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '👋 <b>Добро пожаловать в <i>Малышку на палубе</i>!</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '<b>О магазине:</b>\n' +
        '🔥 <b>Малышка на палубе</b> — только лучший продукт VHQ!\n' +
        '\n' +
        '⚠️ <b>ВНИМАНИЕ</b>\n' +
        'По вопросам зависших платежей: @MalushkaOperator или <b>+888 0724 8219</b>\n' +
        '\n' +
        '✅ <b>Гарантия качества и анонимности</b>\n' +
        '\n' +
        '🔒 Продолжая, вы соглашаетесь с <b>политикой конфиденциальности</b> (см. кнопку ниже).',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📄 Открыть политику', callback_data: 'open_privacy' }
          ],
          [
            { text: '✅ Согласиться и продолжить', callback_data: 'continue' }
          ]
        ]
      }
    }
  );
});

// Обработчик текстовых сообщений для админ-авторизации
bot.on('text', (ctx) => {
  // Проверяем, что это не команда
  if (ctx.message.text.startsWith('/')) {
    return;
  }
  
  if (ctx.session && ctx.session.waitingForAdminPassword) {
    const password = ctx.message.text;
    
    if (password === 'robertloh') {
      // Успешная авторизация
      adminSessions.add(ctx.from.id);
      delete ctx.session.waitingForAdminPassword;
      
      ctx.reply(
        '✅ <b>Доступ разрешен!</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        'Добро пожаловать в админ-панель.',
        {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📊 Просмотр всех заказов', callback_data: 'admin_view_orders' }
              ],
              [
                { text: '📈 Статистика', callback_data: 'admin_stats' }
              ],
              [
                { text: '🚪 Выйти из админ-панели', callback_data: 'admin_logout' }
              ]
            ]
          }
        }
      );
    } else {
      // Неверный пароль
      delete ctx.session.waitingForAdminPassword;
      ctx.reply(
        '❌ <b>Неверный пароль!</b>\n' +
        'Доступ запрещен.',
        { parse_mode: 'HTML' }
      );
    }
  }
});

// Обработчик просмотра заказов
bot.action('admin_view_orders', async (ctx) => {
  if (!adminSessions.has(ctx.from.id)) {
    return ctx.reply('❌ Доступ запрещен!');
  }
  
  if (orders.length === 0) {
    return ctx.reply(
      '📭 <b>Заказов пока нет</b>\n' +
      'Ожидайте новых заказов от пользователей.',
      { parse_mode: 'HTML' }
    );
  }
  
  // Создаем список заказов
  let ordersList = '📊 <b>Список всех заказов:</b>\n' +
                   '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  orders.forEach((order, index) => {
    const user = order.user;
    const cityName = getCityName(order.cityKey);
    const districtName = order.districtName;
    const product = order.product;
    const size = order.size;
    const price = order.price;
    const paymentMethod = order.paymentMethod === 'card' ? '💳 Карта' : '₿ Биткоин';
    const status = order.status || '⏳ В обработке';
    const date = new Date(order.timestamp).toLocaleString('ru-RU');
    const paymentProof = order.paymentProof
      ? `<a href="${order.paymentProof}">Открыть</a>`
      : 'Нет';
    ordersList += `${index + 1}. <b>Заказ #${order.id}</b>\n` +
                  `👤 <b>Пользователь:</b> ${user.first_name} ${user.last_name || ''} (@${user.username || 'без username'})\n` +
                  `🆔 <b>ID:</b> <code>${user.id}</code>\n` +
                  `🏙️ <b>Город:</b> ${cityName}\n` +
                  `📍 <b>Район:</b> ${districtName}\n` +
                  `🛍️ <b>Товар:</b> ${product}\n` +
                  `📏 <b>Вес:</b> ${size}\n` +
                  `💰 <b>Цена:</b> ${price}₽\n` +
                  `💳 <b>Способ оплаты:</b> ${paymentMethod}\n` +
                  `🖼️ <b>Скриншот оплаты:</b> ${paymentProof}\n` +
                  `📅 <b>Дата:</b> ${date}\n` +
                  `📊 <b>Статус:</b> ${status}\n` +
                  '━━━━━━━━━━━━━━━━━━━━━━\n\n';
  });
  
  // Разбиваем на части, если сообщение слишком длинное
  const maxLength = 4096;
  if (ordersList.length > maxLength) {
    const parts = [];
    for (let i = 0; i < ordersList.length; i += maxLength) {
      parts.push(ordersList.slice(i, i + maxLength));
    }
    
    for (let i = 0; i < parts.length; i++) {
      await ctx.reply(
        parts[i] + (i === parts.length - 1 ? '\n📊 <b>Всего заказов:</b> ' + orders.length : ''),
        { parse_mode: 'HTML' }
      );
    }
  } else {
    ctx.reply(
      ordersList + `📊 <b>Всего заказов:</b> ${orders.length}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🔄 Обновить список', callback_data: 'admin_view_orders' }
            ],
            [
              { text: '⬅️ Назад в админ-панель', callback_data: 'admin_back' }
            ]
          ]
        }
      }
    );
  }
});

// Обработчик статистики
bot.action('admin_stats', async (ctx) => {
  if (!adminSessions.has(ctx.from.id)) {
    return ctx.reply('❌ Доступ запрещен!');
  }
  
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.price, 0);
  const cardPayments = orders.filter(order => order.paymentMethod === 'card').length;
  const btcPayments = orders.filter(order => order.paymentMethod === 'btc').length;
  
  // Статистика по товарам
  const productStats = {};
  orders.forEach(order => {
    if (!productStats[order.product]) {
      productStats[order.product] = { count: 0, revenue: 0 };
    }
    productStats[order.product].count++;
    productStats[order.product].revenue += order.price;
  });
  
  let stats = '📈 <b>Статистика магазина</b>\n' +
              '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
              `📊 <b>Общее количество заказов:</b> ${totalOrders}\n` +
              `💰 <b>Общая выручка:</b> ${totalRevenue}₽\n` +
              `💳 <b>Оплата картой:</b> ${cardPayments}\n` +
              `₿ <b>Оплата биткоином:</b> ${btcPayments}\n\n` +
              '🛍️ <b>Статистика по товарам:</b>\n';
  
  Object.entries(productStats).forEach(([product, data]) => {
    stats += `• ${product}: ${data.count} заказов, ${data.revenue}₽\n`;
  });
  
  ctx.reply(
    stats,
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔄 Обновить статистику', callback_data: 'admin_stats' }
          ],
          [
            { text: '⬅️ Назад в админ-панель', callback_data: 'admin_back' }
          ]
        ]
      }
    }
  );
});

// Обработчик возврата в админ-панель
bot.action('admin_back', async (ctx) => {
  if (!adminSessions.has(ctx.from.id)) {
    return ctx.reply('❌ Доступ запрещен!');
  }
  
  ctx.reply(
    '🔐 <b>Админ-панель</b>\n' +
    '━━━━━━━━━━━━━━━━━━━━━━\n' +
    '\n' +
    'Выберите действие:',
    {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📊 Просмотр всех заказов', callback_data: 'admin_view_orders' }
          ],
          [
            { text: '📈 Статистика', callback_data: 'admin_stats' }
          ],
          [
            { text: '🚪 Выйти из админ-панели', callback_data: 'admin_logout' }
          ]
        ]
      }
    }
  );
});

// Обработчик выхода из админ-панели
bot.action('admin_logout', async (ctx) => {
  adminSessions.delete(ctx.from.id);
  ctx.reply(
    '🚪 <b>Выход выполнен</b>\n' +
    'Вы вышли из админ-панели.',
    { parse_mode: 'HTML' }
  );
});

// Функция для получения названия города по ключу
function getCityName(cityKey) {
  const cityNames = {
    'city_moskva': 'Москва',
    'city_sankt_peterburg': 'Санкт-Петербург',
    'city_novosibirsk': 'Новосибирск',
    'city_ekaterinburg': 'Екатеринбург',
    'city_kazan': 'Казань',
    'city_nizhniy_novgorod': 'Нижний Новгород',
    'city_chelyabinsk': 'Челябинск',
    'city_ufa': 'Уфа',
    'city_krasnodar': 'Краснодар',
    'city_smolensk': 'Смоленск',
    'city_ryazan': 'Рязань',
    'city_voronezh': 'Воронеж'
  };
  return cityNames[cityKey] || cityKey;
}



bot.action('continue', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {
    // Если не удалось удалить (например, уже удалено), просто игнорируем
  }
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '💳 <b>Ваш баланс:</b> <code>0</code> рублей\n' +
        '🎁 <b>Скидки и акции:</b> <i>Пока отсутствуют</i>\n' +
        '\n' +
        '🛒 <b>Добро пожаловать в магазин радости!</b>\n' +
        'Выберите нужный раздел ниже:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛍️ В наличии', callback_data: 'in_stock' },
            { text: '👤 Личный кабинет', callback_data: 'profile' }
          ],
          [
            { text: '💳 Проблема с оплатой?', callback_data: 'payment_problem' }
          ],
          [
            { text: '⭐️ Отзывы клиентов [437]', callback_data: 'reviews' }
          ],
          [
            { text: '🎉 Получить 200₽ на счёт!', callback_data: 'bonus' }
          ]
        ]
      }
    }
  );
});

bot.action('profile', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '👤 <b>Личный кабинет</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '<b>Баланс RUB:</b> <code>0</code>₽\n' +
        '<b>Баланс BTC:</b> <code>0.00000000</code>₿\n' +
        '\n' +
        '<b>Покупок:</b> <code>0</code> шт\n' +
        '<b>Отзывы:</b> <code>0</code> шт\n' +
        '\n' +
        '💬 <i>Выбери нужный пункт меню ниже:</i>',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⬅️ Вернуться на главную', callback_data: 'continue' }
          ]
        ]
      }
    }
  );
});

bot.action('bonus', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '🎁 <b>Бонус 200₽</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '💡 <i>Бонус будет начислен на ваш баланс в течение 15 минут после первой покупки.</i>\n' +
        '\n' +
        '⏳ <b>Статус:</b> <code>Бонус ещё не активирован</code>\n',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⬅️ Вернуться на главную', callback_data: 'continue' }
          ]
        ]
      }
    }
  );
});

bot.action('payment_problem', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '💸 <b>Проблема с оплатой?</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '👤 <b>Оператор:</b> @MalushkaOperator\n' +
        '🤖 <b>Бот:</b> @MalushkaNaPalubeBot\n' +
        '🤖 <b>Второй бот:</b> <i>не указан</i>\n' +
        '\n' +
        '📄 <b>Список счетов и история платежей</b>\n' +
        'Здесь находится ваша история платежей. Также вы можете проверить любую заявку по времени или номеру.\n' +
        '\n' +
        'Для проверки заявки — выберите нужную из списка и нажмите <b>Проверить оплату</b>.',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⬅️ Главное меню', callback_data: 'continue' }
          ]
        ]
      }
    }
  );
});

bot.action('reviews', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '⭐️ <b>Отзывы клиентов</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '😔 <b>Ошибка!</b>\n' +
        'Не удалось загрузить отзывы.\n' +
        'Проверьте соединение с интернетом и попробуйте ещё раз.\n' +
        '\n' +
        '💡 <i>Возможно, сервер временно недоступен или вы используете VPN/прокси.</i>',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⬅️ Вернуться в главное меню', callback_data: 'continue' }
          ]
        ]
      }
    }
  );
});

bot.action('in_stock', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  const cities = [
    { name: 'Москва', key: 'city_moskva' },
    { name: 'Санкт Петербург', key: 'city_sankt_peterburg' },
    { name: 'Новосибирск', key: 'city_novosibirsk' },
    { name: 'Екатеринбург', key: 'city_ekaterinburg' },
    { name: 'Казань', key: 'city_kazan' },
    { name: 'Нижний Новгород', key: 'city_nizhniy_novgorod' },
    { name: 'Челябинск', key: 'city_chelyabinsk' },
    { name: 'Уфа', key: 'city_ufa' },
    { name: 'Краснодар', key: 'city_krasnodar' },
    { name: 'Смоленск', key: 'city_smolensk' },
    { name: 'Рязань', key: 'city_ryazan' },
    { name: 'Воронеж', key: 'city_voronezh' }
  ];
  // Диагностика: выводим все callback_data и ключи
  console.log('Кнопки городов:');
  cities.forEach(city => console.log(city.key));
  console.log('Ключи в cityDistricts:');
  console.log(Object.keys(cityDistricts));
  const cityButtons = cities.map(city => [
    { text: city.name, callback_data: city.key }
  ]);
  cityButtons.push([{ text: '⬅️ Вернуться в главное меню', callback_data: 'continue' }]);

  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '🏙️ <b>Выберите город</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        'Доступны заказы в следующих городах:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: cityButtons
      }
    }
  );
});

const cityDistricts = {
  city_moskva: [
    'Центральный', 'Северный', 'Северо-Восточный', 'Восточный', 'Юго-Восточный', 'Южный', 'Юго-Западный', 'Западный', 'Северо-Западный', 'Зеленоградский', 'Новомосковский', 'Троицкий'
  ],
  city_sankt_peterburg: [
    'Адмиралтейский', 'Василеостровский', 'Выборгский', 'Калининский', 'Кировский', 'Колпинский', 'Красногвардейский', 'Красносельский', 'Кронштадтский', 'Курортный', 'Московский', 'Невский', 'Петроградский', 'Петродворцовый', 'Приморский', 'Пушкинский', 'Фрунзенский', 'Центральный'
  ],
  city_novosibirsk: [
    'Центральный', 'Железнодорожный', 'Заельцовский', 'Калининский', 'Кировский', 'Ленинский', 'Октябрьский', 'Первомайский', 'Советский', 'Дзержинский'
  ],
  city_ekaterinburg: [
    'Верх-Исетский', 'Железнодорожный', 'Кировский', 'Ленинский', 'Октябрьский', 'Орджоникидзевский', 'Чкаловский'
  ],
  city_kazan: [
    'Авиастроительный', 'Вахитовский', 'Кировский', 'Московский', 'Ново-Савиновский', 'Приволжский', 'Советский'
  ],
  city_nizhniy_novgorod: [
    'Автозаводский', 'Канавинский', 'Ленинский', 'Московский', 'Нижегородский', 'Приокский', 'Советский', 'Сормовский'
  ],
  city_chelyabinsk: [
    'Центральный', 'Советский', 'Курчатовский', 'Калининский', 'Ленинский', 'Металлургический', 'Тракторозаводский'
  ],
  city_ufa: [
    'Калининский', 'Кировский', 'Ленинский', 'Октябрьский', 'Орджоникидзевский', 'Советский', 'Демский'
  ],
  city_krasnodar: [
    'Центральный', 'Западный', 'Карасунский', 'Прикубанский', 'Восточно-Кругликовский', 'Фестивальный'
  ],
  city_smolensk: [
    'Ленинский', 'Промышленный', 'Заднепровский'
  ],
  city_ryazan: [
    'Московский', 'Октябрьский', 'Советский', 'Железнодорожный'
  ],
  city_voronezh: [
    'Центральный', 'Коминтерновский', 'Ленинский', 'Левобережный', 'Советский', 'Железнодорожный', 'Северный'
  ]
};

Object.keys(cityDistricts).forEach(cityKey => {
  bot.action(cityKey, async (ctx) => {
    console.log('Выбран город:', cityKey); // Лог для отладки
    try {
      await ctx.deleteMessage();
    } catch (e) {}
    const districts = cityDistricts[cityKey];
    const districtButtons = districts.map(d => [{ text: d, callback_data: `district_${cityKey}_${d.replace(/ |-/g, '_').toLowerCase()}` }]);
    districtButtons.push([{ text: '⬅️ Назад к городам', callback_data: 'in_stock' }]);
    ctx.replyWithPhoto(
      { source: 'welcome.jpg' },
      {
        caption:
          '🏙️ <b>Выберите район</b>\n' +
          '━━━━━━━━━━━━━━━━━━━━━━\n' +
          '\n' +
          'Доступны заказы в выбранном городе:',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: districtButtons
        }
      }
    );
  });
});

// Обработка выбора района (для всех городов)
bot.action(/^district_.*$/, async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  // Получаем название города и района из callback_data
  const data = ctx.match[0];
  // Пример: district_city_moskva_центральный
  // Отделяем всё после последнего _ как район
  const lastUnderscore = data.lastIndexOf('_');
  const cityKey = data.slice(8, lastUnderscore); // между 'district_' и последним '_'
  const districtName = data.slice(lastUnderscore + 1);
  
  // Кнопки товаров в столбик
  const productButtons = products.map((product, index) => {
    // Минимальный размер и цена
    const minSize = product.sizes[0];
    const minPrice = Math.round(product.basePrice * (minSize / product.baseWeight));
    return [
      {
        text: `${product.name} (от ${minPrice}₽)`,
        callback_data: `product_${cityKey}_${districtName}_${index}`
      }
    ];
  });
  productButtons.push([{ text: '⬅️ Назад к районам', callback_data: cityKey }]);

  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '🛍️ <b>Каталог товаров</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        'Выберите интересующий товар или вернитесь к выбору района.',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: productButtons
      }
    }
  );
});

// Обработка выбора товара
bot.action(/^product_.*$/, async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  const data = ctx.match[0];
  // product_citykey_districtname_index
  const parts = data.split('_');
  const cityKey = parts[1] + '_' + parts[2];
  const districtName = parts.slice(3, parts.length - 1).join('_');
  const productIndex = parseInt(parts[parts.length - 1], 10);
  const product = products[productIndex];

  // Кнопки размеров
  const sizeButtons = product.sizes.map(size => [
    {
      text: `${size.toString().replace('.', ',')}гр`,
      callback_data: `size|${cityKey}|${districtName}|${productIndex}|${size}`
    }
  ]);
  sizeButtons.push([{ text: '⬅️ Назад к товарам', callback_data: `district_${cityKey}_${districtName}` }]);

  ctx.replyWithPhoto(
    { source: product.photo },
    {
      caption:
        `🛍️ <b>${product.name}</b>\n` +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        'Выберите вес:',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: sizeButtons
      }
    }
  );
});

// Обработка выбора размера
bot.action(/^size\|.*$/, async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  const data = ctx.match[0];
  // size|cityKey|districtName|productIndex|size
  const parts = data.split('|');
  const cityKey = parts[1];
  const districtName = parts[2];
  const productIndex = parseInt(parts[3], 10);
  const size = parseFloat(parts[4].replace(',', '.'));
  const product = products[productIndex];

  // Цена рассчитывается пропорционально
  const price = Math.round(product.basePrice * (size / product.baseWeight));
  const sizeDisplay = size.toString().replace('.', ',');

  ctx.replyWithPhoto(
    { source: product.photo },
    {
      caption:
        `🛍️ <b>${product.name} — ${sizeDisplay}гр</b>\n` +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        `\n💰 <b>Цена:</b> <code>${price}₽</code>\n` +
        '📦 <b>В наличии:</b> <code>Да</code>\n' +
        '\n' +
        '💳 <i>Для оформления заказа нажмите кнопку ниже:</i>',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 Оформить заказ', callback_data: `order|${cityKey}|${districtName}|${productIndex}|${size}` }
          ],
          [
            { text: '⬅️ Назад к весам', callback_data: `product_${cityKey}_${districtName}_${productIndex}` }
          ]
        ]
      }
    }
  );
});

// Обработчик оформления заказа
bot.action(/^order\|.*$/, async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  
  const data = ctx.match[0];
  // order|cityKey|districtName|productIndex|size
  const parts = data.split('|');
  const cityKey = parts[1];
  const districtName = parts[2];
  const productIndex = parseInt(parts[3], 10);
  const size = parseFloat(parts[4].replace(',', '.'));
  const product = products[productIndex];
  const price = Math.round(product.basePrice * (size / product.baseWeight));
  const sizeDisplay = size.toString().replace('.', ',');
  
  // Сохраняем данные заказа в контексте пользователя
  ctx.session = ctx.session || {};
  ctx.session.currentOrder = {
    product: product.name,
    size: sizeDisplay,
    price: price,
    cityKey: cityKey,
    districtName: districtName,
    productIndex: productIndex
  };

  ctx.replyWithPhoto(
    { source: product.photo },
    {
      caption:
        `💳 <b>Оформление заказа</b>\n` +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        `\n🛍️ <b>Товар:</b> ${product.name}\n` +
        `📏 <b>Вес:</b> ${sizeDisplay}гр\n` +
        `💰 <b>Сумма к оплате:</b> <code>${price}₽</code>\n` +
        '\n' +
        '💳 <i>Выберите способ оплаты:</i>',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '💳 Банковская карта', callback_data: `payment_card|${cityKey}|${districtName}|${productIndex}|${size}` }
          ],
          [
            { text: '₿ Биткоин', callback_data: `payment_btc|${cityKey}|${districtName}|${productIndex}|${size}` }
          ],
          [
            { text: '⬅️ Назад к товару', callback_data: `size|${cityKey}|${districtName}|${productIndex}|${size}` }
          ]
        ]
      }
    }
  );
});

// Обработчик выбора оплаты картой
bot.action(/^payment_card\|.*$/, async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  ctx.session = ctx.session || {};
  if (!ctx.session.currentOrder) {
    return ctx.reply('❗️ Не удалось найти ваш заказ. Пожалуйста, начните оформление заново.');
  }
  const data = ctx.callbackQuery.data;
  const parts = data.split('|');
  const cityKey = parts[1];
  const districtName = parts[2];
  const productIndex = parseInt(parts[3], 10);
  const size = parseFloat(parts[4].replace(',', '.'));
  const product = products[productIndex];
  const price = Math.round(product.basePrice * (size / product.baseWeight));
  const sizeDisplay = size.toString().replace('.', ',');
  
  // Сохраняем способ оплаты
  ctx.session.currentOrder.paymentMethod = 'card';

  ctx.replyWithPhoto(
    { source: product.photo },
    {
      caption:
        `💳 <b>Оплата картой</b>\n` +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        `\n🛍️ <b>Товар:</b> ${product.name}\n` +
        `📏 <b>Вес:</b> ${sizeDisplay}гр\n` +
        `💰 <b>Сумма к оплате:</b> <code>${price}₽</code>\n` +
        '\n' +
        '💳 <b>Реквизиты для оплаты:</b>\n' +
        'Номер карты: <code>2200702002685183</code>\n' +
        'Получатель: <b>Кирилл А.</b>\n' +
        '\n' +
        '📸 <i>После оплаты отправьте скриншот чека или подтверждения перевода.</i>',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📸 Отправить скриншот оплаты', callback_data: 'upload_payment_proof' }
          ],
          [
            { text: '⬅️ Назад к способам оплаты', callback_data: `order|${cityKey}|${districtName}|${productIndex}|${size}` }
          ]
        ]
      }
    }
  );
});

// Обработчик выбора оплаты биткоином
bot.action(/^payment_btc\|.*$/, async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  ctx.session = ctx.session || {};
  if (!ctx.session.currentOrder) {
    return ctx.reply('❗️ Не удалось найти ваш заказ. Пожалуйста, начните оформление заново.');
  }
  const data = ctx.callbackQuery.data;
  const parts = data.split('|');
  const cityKey = parts[1];
  const districtName = parts[2];
  const productIndex = parseInt(parts[3], 10);
  const size = parseFloat(parts[4].replace(',', '.'));
  const product = products[productIndex];
  const price = Math.round(product.basePrice * (size / product.baseWeight));
  const sizeDisplay = size.toString().replace('.', ',');
  
  // Сохраняем способ оплаты
  ctx.session.currentOrder.paymentMethod = 'btc';

  ctx.replyWithPhoto(
    { source: product.photo },
    {
      caption:
        `₿ <b>Оплата биткоином</b>\n` +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        `\n🛍️ <b>Товар:</b> ${product.name}\n` +
        `📏 <b>Вес:</b> ${sizeDisplay}гр\n` +
        `💰 <b>Сумма к оплате:</b> <code>${price}₽</code>\n` +
        '\n' +
        '₿ <b>Биткоин кошелек:</b>\n' +
        '<code>1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</code>\n' +
        '\n' +
        '📸 <i>После оплаты отправьте скриншот транзакции.</i>',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📸 Отправить скриншот оплаты', callback_data: 'upload_payment_proof' }
          ],
          [
            { text: '⬅️ Назад к способам оплаты', callback_data: `order|${cityKey}|${districtName}|${productIndex}|${size}` }
          ]
        ]
      }
    }
  );
});

// Обработчик кнопки "Отправить скриншот оплаты"
bot.action('upload_payment_proof', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  
  ctx.session = ctx.session || {};
  ctx.session.waitingForPaymentProof = true;
  
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '📸 <b>Отправка подтверждения оплаты</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        '📤 <i>Отправьте скриншот чека, подтверждения перевода или транзакции.</i>\n' +
        '\n' +
        '⚠️ <b>Важно:</b> Убедитесь, что на скриншоте видны:\n' +
        '• Сумма перевода\n' +
        '• Реквизиты получателя\n' +
        '• Дата и время операции',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '⬅️ Отменить заказ', callback_data: 'cancel_order' }
          ]
        ]
      }
    }
  );
});

// Обработчик отмены заказа
bot.action('cancel_order', async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  
  ctx.session = ctx.session || {};
  delete ctx.session.currentOrder;
  delete ctx.session.waitingForPaymentProof;
  
  ctx.replyWithPhoto(
    { source: 'welcome.jpg' },
    {
      caption:
        '❌ <b>Заказ отменен</b>\n' +
        '━━━━━━━━━━━━━━━━━━━━━━\n' +
        '\n' +
        'Заказ был отменен. Вы можете оформить новый заказ.',
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🛍️ Вернуться в каталог', callback_data: 'continue' }
          ]
        ]
      }
    }
  );
});

// Обработчик приема фото/документов (скриншотов оплаты)
bot.on(['photo', 'document'], async (ctx) => {
  if (!ctx.session || !ctx.session.waitingForPaymentProof) {
    return;
  }
  
  const order = ctx.session.currentOrder;
  if (!order) {
    return;
  }
  
  try {
    await ctx.deleteMessage();
  } catch (e) {}
  
  // Получаем файл
  let file;
  if (ctx.message.photo) {
    file = ctx.message.photo[ctx.message.photo.length - 1]; // Самое большое фото
  } else if (ctx.message.document) {
    file = ctx.message.document;
  }
  
  if (file) {
    // Здесь можно сохранить файл или отправить администратору
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    
    // Создаем уникальный ID заказа
    const orderId = Date.now().toString();
    
    // Сохраняем заказ в массив
    const newOrder = {
      id: orderId,
      user: {
        id: ctx.from.id,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name,
        username: ctx.from.username
      },
      product: order.product,
      size: order.size,
      price: order.price,
      paymentMethod: order.paymentMethod,
      cityKey: order.cityKey,
      districtName: order.districtName,
      productIndex: order.productIndex,
      paymentProof: fileLink.href,
      timestamp: new Date(),
      status: '⏳ В обработке'
    };
    
    orders.push(newOrder);
    
    ctx.replyWithPhoto(
      { source: 'welcome.jpg' },
      {
        caption:
          '✅ <b>Подтверждение оплаты получено!</b>\n' +
          '━━━━━━━━━━━━━━━━━━━━━━\n' +
          '\n' +
          `🛍️ <b>Товар:</b> ${order.product}\n` +
          `📏 <b>Вес:</b> ${order.size}\n` +
          `💰 <b>Сумма:</b> ${order.price}₽\n` +
          `💳 <b>Способ оплаты:</b> ${order.paymentMethod === 'card' ? 'Карта' : 'Биткоин'}\n` +
          '\n' +
          '⏳ <i>Ваш заказ принят в обработку. Ожидайте подтверждения от оператора.</i>\n' +
          '\n' +
          '📞 <b>По вопросам:</b> @MalushkaOperator',
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛍️ Новый заказ', callback_data: 'continue' }
            ]
          ]
        }
      }
    );
    
    // Очищаем сессию
    delete ctx.session.currentOrder;
    delete ctx.session.waitingForPaymentProof;
    
    // Отправляем уведомление администратору
    try {
      await ctx.telegram.sendMessage('@MalushkaOperator', 
        `🆕 <b>Новый заказ!</b>\n` +
        `━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🛍️ <b>Товар:</b> ${order.product}\n` +
        `📏 <b>Вес:</b> ${order.size}\n` +
        `💰 <b>Сумма:</b> ${order.price}₽\n` +
        `💳 <b>Способ оплаты:</b> ${order.paymentMethod === 'card' ? 'Карта' : 'Биткоин'}\n` +
        `👤 <b>Пользователь:</b> ${ctx.from.first_name} ${ctx.from.last_name || ''} (@${ctx.from.username || 'без username'})\n` +
        `🆔 <b>ID:</b> <code>${ctx.from.id}</code>\n` +
        `🖼️ <b>Скриншот:</b> <a href="${fileLink.href}">Открыть</a>`,
        { parse_mode: 'HTML' }
      );
    } catch (e) {
      console.log('Ошибка отправки уведомления админу:', e.message);
    }
    
    // Отправляем правила магазина
    setTimeout(async () => {
      try {
        await ctx.reply(
          '📋 <b>ДЕЛАЯ ПОКУПКИ ВЫ СОГЛАШАЕТЕСЬ С ПРАВИЛАМИ МАЛЫШКА НА ПАЛУБЕ!</b>\n' +
          '━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '<b>1. ДЛЯ РАССМОТРЕНИЯ ВОПРОСА О НЕНАХОДЕ, СНИМАЙТЕ МОМЕНТ ПОДЪЕМА В ЛЮБОЕ ВРЕМЯ СУТОК❗️ СО ВСЕМИ ОРИЕНТИРАМИ КАК НА ФОТО У КУРЬЕРА❗️</b>\n\n' +
          '🔻 <b>ЗАПИСЬ НАЧИНАЕМ ЗА 20 МЕТРОВ ДО МЕСТА!</b> 🎥\n\n' +
          '<b>2. ВОПРОС О НЕНАХОДЕ С ВИДЕО, КОТОРОЕ БУДЕТ СНЯТО С ПОВТОРНЫХ ПОИСКОВ, ПРИНИМАТЬСЯ НЕ БУДЕТ!</b> ❌\n\n' +
          '<b>3. ПОДНЯВ КЛАД, НЕ СПЕШИТЕ РАСПАКОВЫВАТЬ ЕГО. ПРИНЕСИТЕ ДОМОЙ И ПОЛОЖИТЕ НА ВЕСЫ СНАЧАЛА В УПАКОВКЕ, ПОТОМ БЕЗ.</b>\n' +
          '🔻 <b>САМО СОБОЙ, МОМЕНТЫ ВЗВЕШИВАНИЯ И РАСПАКОВКИ ДОЛЖНЫ ФИКСИРОВАТЬСЯ НА ВИДЕО.</b>\n\n' +
          '❗️ <b>ВНИМАНИЕ❗️</b>\n\n' +
          'Можете не рассчитывать на замену, если:\n\n' +
          '🔹Вы обратились по вопросу ненахода/недовеса спустя 12 часов после выдачи адреса❗️\n' +
          '🔹У вас меньше 5 покупок в нашем магазине❗️\n' +
          '🔹Вы не выполнили правила рассмотрения вопросов о ненаходах и не довесах❗️\n' +
          '━━━━━━━━━━━ ⸙ ━━━━━━━━━━\n' +
          '❗️<b>И НЕБОЛЬШАЯ ИНСТРУКЦИЯ ПО СЪЕМУ КЛАДОВ</b> ✔️\n\n' +
          '<b>1.</b> После того как вы получили свой адрес, внимательно проверьте все фото, найдите для себя ориентир ❗️\n' +
          '<b>2.</b> Подходя к месту клада, начинайте съёмку. Без паники и не спеша изучите местность ❗️\n' +
          '<b>3.</b> После того, как нашли место, аккуратно начинайте искать в УКАЗАННОМ МЕСТЕ❗️\n' +
          '<b>4.</b> Если не удаётся найти, то расширьте свои поиски по 2 см❗️\n' +
          '<b>5.</b> Открывая диспут, отправьте оператору, ваше видео и изложите Вашу ситуацию.\n\n' +
          '<b>ВАЖНО!!!</b> При обращении к оператору в лс ПИСАТЬ ОДНИМ СООБЩЕНИЕМ, ИНФОРАМАТИВНО И ПО СУЩЕСТВУ, БЕЗ ФЛУДА И СОТНИ СООБЩЕНИЙ НЕ ПО ДЕЛУ.\n' +
          'Обращения покупателя с флудом и прочим, отвлекающим от сути, будут рассматриваться в самую последнюю очередь.\n\n' +
          '🔹Фото вашего заказа с бота.\n' +
          '🔹Видео с поисков.\n' +
          '🔹Четко и внятно опишите проблему, без мата, истерики, шантажа, угроз и проклятий\n\n' +
          '❗️<b>В случае не выполнения правил, магазин имеет право отказать</b>❗️\n\n' +
          '<b>Админы:</b>\n' +
          '@потом добавлю',
          { parse_mode: 'HTML' }
        );
      } catch (e) {
        console.log('Ошибка отправки правил:', e.message);
      }
    }, 2000); // Отправляем через 2 секунды после подтверждения
  }
});

bot.action('open_privacy', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    await ctx.replyWithDocument({ source: 'privacy.pdf' }, { caption: 'Политика конфиденциальности' });
  } catch (e) {}
});

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM')); 