export default async function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight запрос
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { name, email, telegram, social, about } = req.body;

    // Получаем токен и ID базы из переменных окружения
    const notionToken = process.env.NOTION_TOKEN;
    const databaseId = process.env.NOTION_DATABASE_ID;

    if (!notionToken || !databaseId) {
      res.status(500).json({ 
        error: 'Notion credentials not configured',
        message: 'NOTION_TOKEN or NOTION_DATABASE_ID not set',
        debug: {
          hasToken: !!notionToken,
          hasDb: !!databaseId
        }
      });
      return;
    }

    const notionData = {
      parent: {
        database_id: databaseId
      },
      properties: {
        "Name": {
          title: [
            {
              text: {
                content: name || ''
              }
            }
          ]
        },
        "Email": {
          email: email || ''
        },
        "Telegram": {
          rich_text: [
            {
              text: {
                content: telegram || ''
              }
            }
          ]
        },
        "Соцсети": {
          rich_text: [
            {
              text: {
                content: social || ''
              }
            }
          ]
        },
        "О себе": {
          rich_text: [
            {
              text: {
                content: about || ''
              }
            }
          ]
        },
        "Дата": {
          date: {
            start: new Date().toISOString().split('T')[0]
          }
        },
        "Статус": {
          select: {
            name: "Новая"
          }
        }
      }
    };

    console.log('Отправляем в Notion:', JSON.stringify(notionData, null, 2));

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });

    const result = await response.json();
    console.log('Ответ Notion:', result);

    if (response.ok) {
      res.status(200).json({ 
        success: true, 
        message: 'Заявка успешно сохранена в Notion!',
        id: result.id
      });
    } else {
      console.error('Ошибка Notion API:', result);
      res.status(400).json({ 
        success: false, 
        error: 'Notion API error',
        details: result
      });
    }

  } catch (error) {
    console.error('Ошибка сервера:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error',
      message: error.message
    });
  }
} 