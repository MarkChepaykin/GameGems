// ══════════════════════════════════════════
//  i18n
// ══════════════════════════════════════════
const T = {
  ru: {
    // HUD
    moves:'ХОДЫ', score:'СЧЁТ',
    // Экраны — результаты
    win:'🎉 Победа!', lose:'💔 Почти!',
    next_level:'Следующий ▶', retry:'🔄 Ещё раз',
    // Навигация
    back:'← Назад', to_menu:'🏠 В меню',
    // Меню
    play:'🎮 Играть', season_btn:'🏆 Сезон', tournament_btn:'⚔️ Турнир',
    shop_btn:'🛒 Магазин', settings_btn:'⚙️ Настройки',
    // Уровни
    choose_level:'Выбор уровня', level:'Уровень',
    // Пре-геймплей
    ready:'Готовы?', start:'▶ Начать!', boosters_lbl:'Бустеры (перед уровнем):',
    // Пауза
    pause:'⏸ Пауза', resume:'▶ Продолжить',
    // Экран поражения
    lose_sub_moves:'Ходы закончились',
    want_continue:'Хотите продолжить?',
    buy_moves:'+5 ходов — 900 🪙',
    ad_moves:'📺 Реклама → +3 хода',
    buy_continue:'▶ Продолжить — 2 💎',
    // Магазин
    shop_title:'🛒 Магазин',
    tab_coins:'🪙 Монеты', tab_crystals:'💎 Кристаллы', tab_special:'⚡ Особое',
    // Настройки
    settings_title:'⚙️ Настройки',
    sound:'🔊 Звук', lang_lbl:'🌐 Язык', vibro:'📳 Вибрация',
    on:'ВКЛ', off:'ВЫКЛ',
    // Жизни
    lives_full:'Жизни полные',
    lives_inf:'∞ ещё ',
    next_life:'+❤️ через ',
    // Тосты
    toast_not_enough_coins:'Недостаточно монет!',
    toast_not_enough_crystals:'Недостаточно кристаллов!',
    toast_ad_life:'+1 жизнь за рекламу!',
    toast_ad_coins:'+50 монет за рекламу!',
    toast_ad_moves:'+3 хода за рекламу!',
    toast_no_boosters:'Недостаточно монет для бустеров!',
    // Счёт (победа)
    win_score_lbl:'Счёт:',
    // Ход
    moves_lbl:'Ходов:',
  },
  en: {
    // HUD
    moves:'MOVES', score:'SCORE',
    // Results
    win:'🎉 You Win!', lose:'💔 So Close!',
    next_level:'Next ▶', retry:'🔄 Try Again',
    // Navigation
    back:'← Back', to_menu:'🏠 Menu',
    // Menu
    play:'🎮 Play', season_btn:'🏆 Season', tournament_btn:'⚔️ Tournament',
    shop_btn:'🛒 Shop', settings_btn:'⚙️ Settings',
    // Levels
    choose_level:'Choose Level', level:'Level',
    // Pregame
    ready:'Ready?', start:'▶ Start!', boosters_lbl:'Boosters (pre-level):',
    // Pause
    pause:'⏸ Pause', resume:'▶ Resume',
    // Lose screen
    lose_sub_moves:'Out of moves',
    want_continue:'Want to continue?',
    buy_moves:'+5 moves — 900 🪙',
    ad_moves:'📺 Ad → +3 moves',
    buy_continue:'▶ Continue — 2 💎',
    // Shop
    shop_title:'🛒 Shop',
    tab_coins:'🪙 Coins', tab_crystals:'💎 Crystals', tab_special:'⚡ Special',
    // Settings
    settings_title:'⚙️ Settings',
    sound:'🔊 Sound', lang_lbl:'🌐 Language', vibro:'📳 Vibration',
    on:'ON', off:'OFF',
    // Lives
    lives_full:'Full lives',
    lives_inf:'∞ left ',
    next_life:'+❤️ in ',
    // Toasts
    toast_not_enough_coins:'Not enough coins!',
    toast_not_enough_crystals:'Not enough crystals!',
    toast_ad_life:'+1 life for watching ad!',
    toast_ad_coins:'+50 coins for watching ad!',
    toast_ad_moves:'+3 moves for watching ad!',
    toast_no_boosters:'Not enough coins for boosters!',
    // Win score
    win_score_lbl:'Score:',
    // Moves
    moves_lbl:'Moves:',
  },
};
function t(k) { return (T[state.lang]||T.ru)[k]||k; }

// Существительные-финалы с грамматическим родом [перевод, род: m/f/n/pl]
const EP_NOUNS_RU = {
  Cavern:['Пещера','f'], Ridge:['Хребет','m'], Shore:['Берег','m'],
  Shores:['Берега','pl'], Peak:['Вершина','f'], Peaks:['Вершины','pl'],
  Valley:['Долина','f'], Grotto:['Грот','m'], Tower:['Башня','f'],
  Ocean:['Океан','m'], Grove:['Роща','f'], Jungle:['Джунгли','pl'],
  Cliffs:['Утёсы','pl'], Cliff:['Утёс','m'], Fortress:['Крепость','f'],
  Tundra:['Тундра','f'], Outpost:['Форпост','m'], Abyss:['Бездна','f'],
  Lagoon:['Лагуна','f'], Plains:['Равнины','pl'], Mountain:['Гора','f'],
  Summit:['Вершина','f'], Ravine:['Ущелье','n'], Springs:['Источники','pl'],
  Shoals:['Отмели','pl'], Depths:['Глубины','pl'], Basin:['Котловина','f'],
  Glen:['Лощина','f'], Landing:['Причал','m'], Canyon:['Каньон','m'],
  Garden:['Сад','m'], Junction:['Развилка','f'], Falls:['Водопад','m'],
  Reef:['Риф','m'], Atoll:['Атолл','m'], Lake:['Озеро','n'],
  Bay:['Залив','m'], Isle:['Остров','m'], Island:['Остров','m'],
  Harbor:['Гавань','f'], Marsh:['Болото','n'], Oasis:['Оазис','m'],
  Mesa:['Меса','f'], Delta:['Дельта','f'], Vale:['Долина','f'],
  Pass:['Перевал','m'], Steppes:['Степи','pl'], Savanna:['Саванна','f'],
  Trail:['Тропа','f'], Gorge:['Ущелье','n'], Cove:['Бухта','f'],
  Domain:['Владения','pl'], Wilderness:['Дикоземье','n'], Realm:['Царство','n'],
  Dungeon:['Подземелье','n'], Keep:['Крепость','f'], Crossing:['Переправа','f'],
  Crossroads:['Перекрёсток','m'], Tunnel:['Туннель','m'], Shaft:['Шахта','f'],
  Zone:['Зона','f'], Territory:['Территория','f'], Expanse:['Просторы','pl'],
  Vault:['Хранилище','n'], Gate:['Врата','pl'], Gateway:['Врата','pl'],
  Sanctuary:['Убежище','n'], Sanctum:['Святилище','n'], Arena:['Арена','f'],
  Alcove:['Ниша','f'], Arch:['Арка','f'], Arches:['Арки','pl'],
  Echo:['Эхо','n'], Nexus:['Узел','m'], Cascade:['Каскад','m'],
  Chamber:['Чертог','m'], Tides:['Приливы','pl'], Compass:['Компас','m'],
  Ascent:['Подъём','m'], Uplands:['Нагорья','pl'], Quarry:['Карьер','m'],
  Spire:['Шпиль','m'], Heights:['Высоты','pl'], Spiral:['Спираль','f'],
  Plateau:['Плато','n'], Wasteland:['Пустошь','f'], Wastes:['Пустоши','pl'],
  Forest:['Лес','m'], Lair:['Логово','n'], Nest:['Гнездо','n'],
  Temple:['Храм','m'], Citadel:['Цитадель','f'], Kingdom:['Королевство','n'],
  Ruins:['Руины','pl'], Ruin:['Руины','pl'], Tomb:['Гробница','f'],
  Crypt:['Крипта','f'], Labyrinth:['Лабиринт','m'], Maze:['Лабиринт','m'],
  Prison:['Тюрьма','f'], Throne:['Трон','m'], Palace:['Дворец','m'],
  Castle:['Замок','m'], Archive:['Архив','m'], Laboratory:['Лаборатория','f'],
  Workshop:['Мастерская','f'], Foundry:['Литейня','f'], Forge:['Кузница','f'],
  Smithy:['Кузница','f'], Kiln:['Горн','m'], Furnace:['Горн','m'],
  Meadow:['Луг','m'], Swamp:['Болото','n'], Bay:['Залив','m'],
  Watchtower:['Дозорная башня','f'],
};

// Прилагательные (мужской род — автоматически согласуются с родом финального существительного)
const EP_ADJS_RU = {
  Crystal:'Кристальный', Ruby:'Рубиновый', Sapphire:'Сапфировый',
  Diamond:'Алмазный', Emerald:'Изумрудный', Amethyst:'Аметистовый',
  Topaz:'Топазовый', Opal:'Опаловый', Garnet:'Гранатовый', Jade:'Нефритовый',
  Citrine:'Цитриновый', Obsidian:'Обсидиановый', Turquoise:'Бирюзовый',
  Onyx:'Ониксовый', Aquamarine:'Аквамариновый', Lapis:'Лазурный',
  Pearl:'Жемчужный', Prism:'Призматический', Alexandrite:'Александритовый',
  Zircon:'Цирконовый', Tanzanite:'Танзанитовый', Tourmaline:'Турмалиновый',
  Spinel:'Шпинелевый', Rhodonite:'Родонитовый', Malachite:'Малахитовый',
  Chrysocolla:'Хризоколловый', Labradorite:'Лабрадоритовый',
  Peridot:'Перидотовый', Iolite:'Иолитовый', Kunzite:'Кунцитовый',
  Sphalerite:'Сфалеритовый', Fluorite:'Флюоритовый', Calcite:'Кальцитовый',
  Halite:'Галитовый', Pyrite:'Пиритовый', Magnetite:'Магнетитовый',
  Hematite:'Гематитовый', Galena:'Галенитовый', Cinnabar:'Киноварный',
  Azurite:'Азуритовый', Atacamite:'Атакамитовый', Vivianite:'Вивианитовый',
  Dioptase:'Диоптазовый', Cuprite:'Купритовый', Quartz:'Кварцевый',
  Golden:'Золотой', Silver:'Серебряный', Ivory:'Костяной',
  Crimson:'Алый', Scarlet:'Пурпурный', Violet:'Фиолетовый', Teal:'Бирюзовый',
  Azure:'Лазурный', Amber:'Янтарный', Dark:'Тёмный', Blazing:'Пылающий',
  Frozen:'Ледяной', Gleaming:'Сверкающий', Shimmering:'Мерцающий',
  Sparkling:'Искристый', Radiant:'Сияющий', Brilliant:'Блистательный',
  Dazzling:'Ослепительный', Lustrous:'Лучистый', Neon:'Неоновый',
  Rainbow:'Радужный', Ancient:'Древний', Forgotten:'Забытый', Lost:'Потерянный',
  Sacred:'Священный', Hidden:'Скрытый', Secret:'Тайный', Mystic:'Мистический',
  Arcane:'Тайный', Enchanted:'Зачарованный', Runic:'Рунический',
  Electric:'Электрический', Volcanic:'Вулканический', Cosmic:'Космический',
  Astral:'Астральный', Celestial:'Небесный', Lunar:'Лунный', Solar:'Солнечный',
  Eternal:'Вечный', Timeless:'Вечный', Ageless:'Вечный', Boundless:'Бескрайний',
  Infinite:'Бесконечный', Primordial:'Первозданный', Submerged:'Затопленный',
  Flooded:'Затопленный', Sunken:'Затопленный', Drowned:'Потопленный',
  Underground:'Подземный', Subterranean:'Подземный', Windswept:'Ветреный',
  Harmonic:'Гармонический', Tidal:'Приливный', Parallel:'Параллельный',
  Alternate:'Альтернативный', Iron:'Железный', Steel:'Стальной',
  Bronze:'Бронзовый', Copper:'Медный', Mithril:'Митрильный',
  Adamantine:'Адамантиновый', Orichalcum:'Орихалковый', Shadow:'Теневой',
  Concealed:'Скрытый', Shrouded:'Укутанный', Veiled:'Завуалированный',
  Obscured:'Скрытый', Covert:'Тайный', Bone:'Костяной',
};

// Неизменяемые слова (не прилагательные — существительные-определители, составные слова)
const EP_FIXED_RU = {
  Lightning:'Молния', Thunder:'Гром', Storm:'Шторм', Tempest:'Буря',
  Tornado:'Торнадо', Hurricane:'Ураган', Cyclone:'Циклон', Aurora:'Аврора',
  Twilight:'Сумерки', Frostfire:'Ледяной огонь', Sunfire:'Солнечный огонь',
  Moonfire:'Лунный огонь', Moonstone:'Лунный камень', Sunstone:'Солнечный камень',
  Stardust:'Звёздная пыль', Starfall:'Звездопад', Starlight:'Звёздный свет',
  Nebula:'Туманность', Galaxy:'Галактика', Comet:'Комета', Meteor:'Метеор',
  Nova:'Нова', Pulsar:'Пульсар', Quasar:'Квазар', Universe:'Вселенная',
  Multiverse:'Мультивселенная', Vortex:'Вихрь', Rift:'Разлом',
  Portal:'Портал', Dimension:'Измерение', Void:'Пустота', Drift:'Дрейф',
  Rune:'Руна', Glyph:'Глиф', Sigil:'Сигил', Omen:'Знамение',
  Prophecy:'Пророчество', Oracle:'Оракул', Vision:'Видение', Dream:'Мечта',
  Nightmare:'Кошмар', Phantom:'Фантом', Specter:'Призрак', Spirit:'Дух',
  Ghost:'Призрак', Soul:'Душа', Essence:'Суть', Aura:'Аура', Mana:'Мана',
  Charm:'Чары', Curse:'Проклятие', Hex:'Гекс', Jinx:'Сглаз', Ward:'Оберег',
  Spell:'Заклинание', Spellbook:'Книга заклинаний', Grimoire:'Гримуар',
  Tome:'Фолиант', Scroll:'Свиток', Codex:'Кодекс', Cipher:'Шифр',
  Riddle:'Загадка', Mystery:'Тайна', Enigma:'Загадка', Illusion:'Иллюзия',
  Mirage:'Мираж', Mirror:'Зеркало', Reflection:'Отражение',
  Dragon:'Дракон', Phoenix:'Феникс', Griffin:'Грифон', Unicorn:'Единорог',
  Chimera:'Химера', Wyvern:'Виверна', Drake:'Дрейк', Serpent:'Змей',
  Basilisk:'Василиск', Hydra:'Гидра', Kraken:'Кракен', Leviathan:'Левиафан',
  Behemoth:'Бехемот', Titan:'Титан', Colossus:'Колосс', Giant:'Великан',
  Cyclops:'Циклоп', Minotaur:'Минотавр', Sphinx:'Сфинкс', Gorgon:'Горгона',
  Harpy:'Гарпия', Siren:'Сирена', Nymph:'Нимфа', Faery:'Фея', Pixie:'Пикси',
  Sprite:'Дух', Wisp:'Огонёк', Wraith:'Призрак', Revenant:'Ревенант', Lich:'Лич',
  Hero:'Герой', Knight:'Рыцарь', Paladin:'Паладин', Ranger:'Следопыт',
  Rogue:'Плут', Mage:'Маг', Wizard:'Волшебник', Sorcerer:'Чародей',
  Warlock:'Чернокнижник', Witch:'Ведьма', Shaman:'Шаман', Sage:'Мудрец',
  Scholar:'Учёный', Druid:'Друид', Champion:'Чемпион', Warrior:'Воин',
  Wanderer:'Странник', Nomad:'Кочевник', Explorer:'Исследователь',
  Adventurer:'Искатель', Pioneer:'Первопроходец', Trailblazer:'Первопроходец',
  Pathfinder:'Следопыт', Navigator:'Навигатор', Voyager:'Мореплаватель',
  Traveller:'Путешественник', Journeyer:'Странник', Pilgrim:'Паломник',
  Scout:'Разведчик', Hunter:'Охотник', Stalker:'Сталкер', Seeker:'Искатель',
  Quester:'Искатель', Roamer:'Бродяга', Drifter:'Странник',
  Gem:'Самоцвет', Jewel:'Самоцвет', Shard:'Осколок', Facet:'Грань',
  Orb:'Сфера', Scepter:'Скипетр', Crown:'Корона', Wand:'Жезл', Staff:'Посох',
  Relic:'Реликвия', Artefact:'Артефакт', Elixir:'Эликсир',
  Gemfield:'Самоцветное поле', Gemstone:'Самоцвет', Gemwork:'Ювелирное',
  Goldwork:'Золотых дел', Silverwork:'Серебряных дел',
  Breeze:'Бриз', Gale:'Шквал', Mist:'Туман', Fog:'Туман', Haze:'Дымка',
  Wave:'Волна', Eddy:'Водоворот', Swirl:'Вихрь', Surge:'Волна',
  Current:'Течение', Cloud:'Облако', Whirlwind:'Вихрь',
  Light:'Свет', Spectrum:'Спектр', Frequency:'Частота', Resonance:'Резонанс',
  Pulse:'Пульс', Decay:'Разложение',
  Starforged:'Звёздной ковки', Moonforged:'Лунной ковки',
  Sunforged:'Солнечной ковки', Stormforged:'Грозовой ковки',
  Soulforged:'Душевной ковки', Heartforged:'Сердечной ковки',
  Mindforged:'Разумной ковки', Dreamforged:'Мечтательной ковки',
  Visionforged:'Провиденческой ковки', Crystalforged:'Кристальной ковки',
};

// Согласует прилагательное (мужской род) с родом финального существительного
function _agreeAdj(adj, gender) {
  if (gender === 'm') return adj;
  if (adj.endsWith('ый') || adj.endsWith('ой') || adj.endsWith('ий')) {
    const stem = adj.slice(0, -2);
    const last = stem[stem.length - 1] || '';
    const velar = 'гкхжшщч'.includes(last);
    const soft = adj.endsWith('ий') && !velar;
    if (gender === 'f')  return stem + (soft ? 'яя' : 'ая');
    if (gender === 'n')  return stem + (soft ? 'ее' : 'ое');
    if (gender === 'pl') return stem + ((soft || velar) ? 'ие' : 'ые');
  }
  return adj;
}

// Возвращает локализованное название эпизода (для ru — пословный перевод с согласованием)
function getEpName(ep) {
  if (state.lang !== 'ru') return ep.name;
  const words = ep.name.split(' ');
  const lastEn = words[words.length - 1].replace(/'s$/, '');
  const nounData = EP_NOUNS_RU[lastEn];
  const gender = nounData ? nounData[1] : 'm';
  const nounRu = nounData ? nounData[0] : lastEn;

  const prefixRu = words.slice(0, -1).map(w => {
    const c = w.replace(/'s$/, '');
    if (EP_FIXED_RU[c]) return EP_FIXED_RU[c];
    if (EP_ADJS_RU[c])  return _agreeAdj(EP_ADJS_RU[c], gender);
    if (EP_NOUNS_RU[c]) return EP_NOUNS_RU[c][0]; // существительное-определитель
    return w;
  });

  return [...prefixRu, nounRu].join(' ');
}

// Применяет язык ко всем элементам с data-i18n
function applyLang() {
  const L = T[state.lang] || T.ru;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (L[key] !== undefined) el.textContent = L[key];
  });
  // Кнопки toggle — только ON/OFF тексты (не data-i18n, управляются refreshSettings)
  refreshSettings();
}

