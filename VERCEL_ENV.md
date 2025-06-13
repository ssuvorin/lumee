# 🔐 Настройка переменных окружения в Vercel

## 🎯 **Рекомендуемый способ (Environment Variables)**

### Шаг 1: Зайдите в настройки проекта на Vercel

1. Откройте ваш проект на [vercel.com](https://vercel.com)
2. Перейдите в **Settings** → **Environment Variables**

### Шаг 2: Добавьте переменную

**Имя переменной**: `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`  
**Значение**: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`  
**Environments**: Выберите `Production`, `Preview`, `Development`

> ⚠️ **Важно**: Используйте префикс `NEXT_PUBLIC_` чтобы переменная была доступна в браузере

### Шаг 3: Redeploy проекта

После добавления переменной нажмите **Redeploy** в разделе Deployments.

---

## 🔧 **Альтернативные способы**

### Способ 2: Создать config.js на Vercel

1. **В Vercel Dashboard** → **Settings** → **Functions**
2. Создайте файл `api/config.js`:

```javascript
export default function handler(req, res) {
  res.status(200).json({
    formUrl: process.env.GOOGLE_SCRIPT_URL
  });
}
```

3. Обновите `script.js` для загрузки конфига через API

### Способ 3: Build-time injection

Создайте `vercel.json` с build командой:

```json
{
  "build": {
    "env": {
      "GOOGLE_SCRIPT_URL": "@google-script-url"
    }
  }
}
```

---

## ✅ **Проверка работы**

После настройки переменных:

1. Откройте консоль браузера на вашем сайте
2. Отправьте форму
3. В логах должно быть: `"- Найден URL в Vercel env: https://script..."`

---

## 🔒 **Безопасность**

- ✅ URL не попадает в git репозиторий
- ✅ Переменные зашифрованы в Vercel
- ✅ Доступ только у владельца проекта
- ✅ Можно менять без редеплоя кода

---

## 🐛 **Troubleshooting**

**Проблема**: Переменная не найдена  
**Решение**: Убедитесь, что используете префикс `NEXT_PUBLIC_`

**Проблема**: Изменения не применились  
**Решение**: Сделайте Redeploy проекта в Vercel

**Проблема**: Форма не отправляется  
**Решение**: Проверьте консоль браузера на ошибки 