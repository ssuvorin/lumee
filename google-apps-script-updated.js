function doPost(e) {
  try {
    let data;
    
    // Пробуем получить данные из отдельных полей формы
    if (e.parameter && (e.parameter.name || e.parameter.email)) {
      // Данные пришли как отдельные поля формы
      data = {
        name: e.parameter.name || '',
        email: e.parameter.email || '',
        telegram: e.parameter.telegram || '',
        social: e.parameter.social || '',
        about: e.parameter.about || ''
      };
      Logger.log('Получены данные через отдельные поля формы');
      Logger.log('Параметры: ' + JSON.stringify(e.parameter));
    } else if (e.parameter && e.parameter.data) {
      // Данные пришли через FormData как JSON
      data = JSON.parse(e.parameter.data);
      Logger.log('Получены данные через FormData: ' + e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      // Данные пришли как JSON
      data = JSON.parse(e.postData.contents);
      Logger.log('Получены данные через JSON: ' + e.postData.contents);
    } else {
      Logger.log('Не удалось получить данные. e.parameter: ' + JSON.stringify(e.parameter));
      Logger.log('e.postData: ' + JSON.stringify(e.postData));
      throw new Error('Не удалось получить данные из запроса');
    }

    Logger.log('Обрабатываем данные: ' + JSON.stringify(data));

    // Открываем таблицу по ID
    const spreadsheetId = '1T_I2kyDOB2OXhymuPkwkLShhenRfiFqRB8XXagup32w';
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    // Используем первый лист или создаем лист "Заявки"
    let sheet;
    try {
      sheet = ss.getSheetByName('Заявки');
      Logger.log('Используем лист "Заявки"');
    } catch (error) {
      // Если лист "Заявки" не найден, используем первый лист
      sheet = ss.getSheets()[0];
      Logger.log('Используем первый лист: ' + sheet.getName());
    }

    // Если первая ячейка пустая — добавляем заголовки
    if (!sheet.getRange(1, 1).getValue()) {
      const headers = [['Дата', 'Имя', 'Email', 'Telegram', 'Другие соцсети', 'О себе']];
      sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);

      // Стили для шапки
      const headerRange = sheet.getRange(1, 1, 1, headers[0].length);
      headerRange.setFontWeight('bold')
                 .setBackground('#E8B4A6')
                 .setFontColor('#FFFFFF');
      Logger.log('Добавлены заголовки');
    }

    // Формируем и добавляем новую строку
    const newRow = [
      new Date(),
      data.name || '',
      data.email || '',
      data.telegram || '',
      data.social || '',
      data.about || ''
    ];
    
    Logger.log('Добавляем строку: ' + JSON.stringify(newRow));
    sheet.appendRow(newRow);

    // Стили для добавленной строки
    const lastRow = sheet.getLastRow();
    const dataRange = sheet.getRange(lastRow, 1, 1, newRow.length);
    dataRange.setBorder(true, true, true, true, true, true);
    sheet.autoResizeColumns(1, newRow.length);

    Logger.log('Заявка успешно сохранена в строку: ' + lastRow);

    // Успешный ответ
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Заявка успешно сохранена!',
        row: lastRow
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Логируем ошибку в журнале Apps Script
    Logger.log('Ошибка при обработке заявки: ' + error);
    Logger.log('Стек ошибки: ' + error.stack);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Произошла ошибка при сохранении заявки: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Обработка GET запросов (для тестирования)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Google Apps Script работает!',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Функция для локального тестирования
function testScript() {
  const fakeEvent = {
    parameter: {
      name: 'Тестовое имя',
      email: 'test@example.com',
      telegram: '@testuser',
      social: 'Instagram: @test',
      about: 'Это тестовая заявка для проверки работы скрипта'
    }
  };
  
  const response = doPost(fakeEvent);
  Logger.log('Результат теста: ' + response.getContent());
} 