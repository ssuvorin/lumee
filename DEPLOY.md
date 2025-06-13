# 🚀 Быстрый деплой на Vercel

## Шаг 1: Подготовка config.js

```bash
# Создайте config.js из примера
cp config.example.js config.js
```

Отредактируйте `config.js` и вставьте ваш Google Apps Script URL:

```javascript
window.LUMEE_CONFIG = {
    formUrl: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
};
```

## Шаг 2: Деплой через Vercel CLI

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Деплой проекта
vercel

# Для продакшн деплоя
vercel --prod
```

## Шаг 3: Деплой через GitHub

1. **Загрузите код на GitHub**:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Подключите к Vercel**:
   - Зайдите на [vercel.com](https://vercel.com)
   - Нажмите "New Project"
   - Выберите ваш GitHub репозиторий
   - Нажмите "Deploy"

## Шаг 4: Настройка домена (опционально)

В настройках проекта на Vercel можете добавить свой домен.

## ✅ Готово!

Ваш сайт будет доступен по адресу типа: `https://lumee-xxx.vercel.app`

## 🔧 Обновления

Для обновления сайта просто сделайте push в GitHub - Vercel автоматически пересоберет проект.

```bash
git add .
git commit -m "Update site"
git push origin main
```

## 🐛 Проблемы?

- Проверьте, что `config.js` создан и содержит правильный URL
- Убедитесь, что Google Apps Script задеплоен как веб-приложение
- Проверьте логи деплоя в панели Vercel 