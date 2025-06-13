const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения из .env
require('dotenv').config();

const PORT = 3002;

// Импортируем логику API
async function notionHandler(req, res, body) {
  const { name, email, telegram, social, about } = JSON.parse(body);

  // Получаем токен и ID базы из переменных окружения
  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    return {
      status: 500,
      data: { 
        error: 'Notion credentials not configured',
        message: 'NOTION_TOKEN or NOTION_DATABASE_ID not set',
        debug: {
          hasToken: !!notionToken,
          hasDb: !!databaseId
        }
      }
    };
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

  try {
    const fetch = (await import('node-fetch')).default;
    
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
      return {
        status: 200,
        data: { 
          success: true, 
          message: 'Заявка успешно сохранена в Notion!',
          id: result.id
        }
      };
    } else {
      console.error('Ошибка Notion API:', result);
      return {
        status: 400,
        data: { 
          success: false, 
          error: 'Notion API error',
          details: result
        }
      };
    }
  } catch (error) {
    console.error('Ошибка сервера:', error);
    return {
      status: 500,
      data: { 
        success: false, 
        error: 'Server error',
        message: error.message
      }
    };
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (pathname === '/api/test') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'API работает!',
      method: req.method,
      timestamp: new Date().toISOString(),
      env: {
        hasNotionToken: !!process.env.NOTION_TOKEN,
        hasNotionDb: !!process.env.NOTION_DATABASE_ID
      }
    }));
    return;
  }

  if (pathname === '/api/notion' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const result = await notionHandler(req, res, body);
        res.writeHead(result.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result.data));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error', message: error.message }));
      }
    });
    return;
  }

  // Serve static files
  let filePath = '.' + pathname;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/api/test`);
  console.log(`   POST http://localhost:${PORT}/api/notion`);
}); 