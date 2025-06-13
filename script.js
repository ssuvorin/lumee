// Initialize AOS animations
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: true,
        offset: 100
    });
});

// Enhanced parallax effect for hero elements
document.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    
    // Parallax for doodles
    const doodles = document.querySelectorAll('.doodle');
    doodles.forEach((element, index) => {
        const speed = 0.3 + (index * 0.1);
        const yPos = -(scrolled * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
    });
    
    // Parallax for depth layers
    const depthLayers = document.querySelectorAll('.depth-layer');
    depthLayers.forEach((layer, index) => {
        const speed = 0.1 + (index * 0.05);
        const yPos = -(scrolled * speed);
        const rotation = scrolled * 0.02;
        layer.style.transform = `translate3d(0, ${yPos}px, 0) rotate(${rotation}deg)`;
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form handling
const form = document.getElementById('applicationForm');
const submitButton = form.querySelector('.submit-button');

// Получение URL для отправки формы
let cachedFormUrl = null;

const getFormSubmissionUrl = async () => {
    console.log('🔍 Проверяем источники URL:');
    
    // Если уже загружали, возвращаем кэшированное значение
    if (cachedFormUrl !== null) {
        console.log('- Используем кэшированный URL:', cachedFormUrl);
        return cachedFormUrl;
    }
    
    // Проверяем локальный config.js (для разработки)
    if (typeof window !== 'undefined' && window.LUMEE_CONFIG && window.LUMEE_CONFIG.formUrl) {
        console.log('- Найден URL в config.js:', window.LUMEE_CONFIG.formUrl);
        cachedFormUrl = window.LUMEE_CONFIG.formUrl;
        return cachedFormUrl;
    }
    
    // Загружаем конфигурацию с API (для продакшена)
    try {
        console.log('- Загружаем конфигурацию с API...');
        const response = await fetch('/api/config');
        const config = await response.json();
        
        console.log('- Ответ API:', config);
        
        if (config.status === 'success' && config.formUrl) {
            console.log('- Найден URL в API:', config.formUrl);
            cachedFormUrl = config.formUrl;
            return cachedFormUrl;
        } else {
            console.log('- API вернул:', config.message || 'URL не настроен');
        }
    } catch (error) {
        console.log('- Ошибка загрузки API:', error.message);
    }
    
    console.log('- URL не найден, работаем в демо-режиме');
    console.log('- Проверьте: добавлена ли переменная GOOGLE_SCRIPT_URL в Vercel?');
    cachedFormUrl = null;
    return null;
};

// Form submission
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        telegram: formData.get('telegram'),
        social: formData.get('social'),
        about: formData.get('about')
    };
    
    // Validate form
    if (!validateForm(data)) {
        return;
    }
    
    // Show loading state
    showLoadingState();
    
    // Send to Google Sheets
    sendToGoogleSheets(data);
});

async function sendToGoogleSheets(data) {
    try {
        const formUrl = await getFormSubmissionUrl();
        
        console.log('🔍 Отладка отправки формы:');
        console.log('- formUrl:', formUrl);
        console.log('- данные:', data);
        
        // Если URL не настроен, показываем демо-режим
        if (!formUrl) {
            console.log('📝 Демо-режим: Google Apps Script URL не настроен');
            setTimeout(() => {
                showSuccessState();
                console.log('📝 Демо-режим: Данные формы:', data);
                setTimeout(() => {
                    form.reset();
                    resetButtonState();
                }, 3000);
            }, 2000);
            return;
        }

        // Определяем, работаем ли мы на localhost
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';

        if (isLocalhost) {
            console.log('🏠 Localhost: используем iframe метод для обхода CORS');
            await sendViaIframe(formUrl, data);
        } else {
            console.log('🌐 Production: используем обычный fetch запрос');
            await sendViaFetch(formUrl, data);
        }

    } catch (error) {
        console.error('❌ Ошибка отправки:', error);
        console.error('❌ Тип ошибки:', error.name);
        console.error('❌ Сообщение ошибки:', error.message);
        
        showErrorState('Произошла ошибка при отправке формы');
        setTimeout(() => {
            resetButtonState();
        }, 3000);
    }
}

// Отправка через fetch (для production)
async function sendViaFetch(formUrl, data) {
    console.log('🚀 Отправляем через fetch на:', formUrl);
    
    const formData = new FormData();
    Object.keys(data).forEach(key => {
        formData.append(key, data[key] || '');
        console.log(`- ${key}: ${data[key] || ''}`);
    });
    
    const response = await fetch(formUrl, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Google Apps Script требует no-cors
    });
    
    console.log('✅ Fetch запрос отправлен');
    
    // Показываем успех
    setTimeout(() => {
        showSuccessState();
        setTimeout(() => {
            form.reset();
            resetButtonState();
        }, 3000);
    }, 1000);
}

// Отправка через iframe (для localhost)
async function sendViaIframe(formUrl, data) {
    console.log('🚀 Отправляем через скрытую форму на:', formUrl);
    
    // Создаем скрытую форму для отправки без CORS проблем
    const hiddenForm = document.createElement('form');
    hiddenForm.method = 'POST';
    hiddenForm.action = formUrl;
    hiddenForm.target = 'hidden-iframe';
    hiddenForm.style.display = 'none';
    
    // Создаем скрытые поля
    const fields = ['name', 'email', 'telegram', 'social', 'about'];
    fields.forEach(fieldName => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = fieldName;
        input.value = data[fieldName] || '';
        hiddenForm.appendChild(input);
        console.log(`- ${fieldName}: ${data[fieldName] || ''}`);
    });
    
    // Создаем скрытый iframe для получения ответа
    let iframe = document.getElementById('hidden-iframe');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'hidden-iframe';
        iframe.name = 'hidden-iframe';
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    
    // Добавляем форму в документ и отправляем
    document.body.appendChild(hiddenForm);
    
    console.log('🚀 Отправляем скрытую форму...');
    hiddenForm.submit();
    
    // Удаляем форму после отправки
    setTimeout(() => {
        document.body.removeChild(hiddenForm);
    }, 1000);
    
    // Показываем успех (мы не можем проверить реальный ответ из-за CORS)
    setTimeout(() => {
        console.log('✅ Форма отправлена через iframe');
        showSuccessState();
        // Reset form after success
        setTimeout(() => {
            form.reset();
            resetButtonState();
        }, 3000);
    }, 2000);
}

function validateForm(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Пожалуйста, расскажи, как к тебе обращаться');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Пожалуйста, укажи корректный email');
    }
    
    if (!data.telegram || data.telegram.trim().length < 2) {
        errors.push('Пожалуйста, укажи свой Telegram для добавления в чаты');
    }
    
    if (!data.about || data.about.trim().length < 20) {
        errors.push('Расскажи чуть подробнее о себе (минимум 20 символов)');
    }
    
    if (errors.length > 0) {
        showErrors(errors);
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showErrors(errors) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());
    
    // Create error container
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-message';
    errorContainer.style.cssText = `
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-size: 0.9rem;
        animation: slideIn 0.3s ease-out;
    `;
    
    const errorList = document.createElement('ul');
    errorList.style.cssText = 'margin: 0; padding-left: 20px;';
    
    errors.forEach(error => {
        const errorItem = document.createElement('li');
        errorItem.textContent = error;
        errorList.appendChild(errorItem);
    });
    
    errorContainer.appendChild(errorList);
    form.insertBefore(errorContainer, form.firstChild);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (errorContainer.parentNode) {
            errorContainer.remove();
        }
    }, 5000);
}

function showLoadingState() {
    const buttonText = submitButton.querySelector('span');
    const buttonArrow = submitButton.querySelector('.button-arrow');
    
    buttonText.textContent = 'Отправляем заявку...';
    buttonArrow.style.animation = 'spin 1s linear infinite';
    submitButton.disabled = true;
    submitButton.style.opacity = '0.7';
}

function showSuccessState() {
    const buttonText = submitButton.querySelector('span');
    const buttonArrow = submitButton.querySelector('.button-arrow');
    
    buttonText.textContent = 'Заявка отправлена! ✨';
    buttonArrow.style.animation = 'none';
    submitButton.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
    
    // Show success message
    showSuccessMessage();
}

function showErrorState(message) {
    const buttonText = submitButton.querySelector('span');
    const buttonArrow = submitButton.querySelector('.button-arrow');
    
    buttonText.textContent = 'Ошибка отправки';
    buttonArrow.style.animation = 'none';
    submitButton.style.background = 'linear-gradient(135deg, #ff6b6b, #ff8e8e)';
    
    // Show error message
    showErrorMessage(message);
}

function resetButtonState() {
    const buttonText = submitButton.querySelector('span');
    const buttonArrow = submitButton.querySelector('.button-arrow');
    
    buttonText.textContent = 'Присоединиться к&nbsp;lumee';
    buttonArrow.style.animation = 'none';
    submitButton.disabled = false;
    submitButton.style.opacity = '1';
    submitButton.style.background = '';
}

function showSuccessMessage() {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--peach), var(--light-peach));
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        animation: slideInRight 0.5s ease-out;
        max-width: 320px;
    `;
    
    successMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12l2 2 4-4"></path>
                <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <div>
                <div style="font-weight: 600; margin-bottom: 5px;">Спасибо за заявку!</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">Я свяжусь с тобой в течение суток ✨</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(successMessage);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
        successMessage.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.remove();
            }
        }, 500);
    }, 6000);
}

function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message-popup';
    errorMessage.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 20px 25px;
        border-radius: 15px;
        box-shadow: var(--shadow-medium);
        z-index: 1000;
        animation: slideInRight 0.5s ease-out;
        max-width: 320px;
    `;
    
    errorMessage.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <div>
                <div style="font-weight: 600; margin-bottom: 5px;">Ошибка отправки</div>
                <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorMessage);
    
    // Auto-remove after 6 seconds
    setTimeout(() => {
        errorMessage.style.animation = 'slideOutRight 0.5s ease-out';
        setTimeout(() => {
            if (errorMessage.parentNode) {
                errorMessage.remove();
            }
        }, 500);
    }, 6000);
}

// Add custom CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes titleAppear {
        from { 
            opacity: 0; 
            transform: translateY(30px) scale(0.9);
            filter: blur(5px);
        }
        to { 
            opacity: 1; 
            transform: translateY(0) scale(1);
            filter: blur(0px);
        }
    }
    
    @keyframes subtitleAppear {
        from { 
            opacity: 0; 
            transform: translateY(20px);
        }
        to { 
            opacity: 1; 
            transform: translateY(0);
        }
    }
    
    .hero-title-animated {
        animation: titleAppear 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    }
    
    .hero-subtitle-animated {
        animation: subtitleAppear 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        animation-delay: 0.6s;
        opacity: 0;
    }
    
    /* Enhanced hover effects */
    .benefit-card:hover .benefit-icon svg {
        filter: drop-shadow(0 5px 15px rgba(232, 180, 166, 0.3));
    }
    
    .step:hover .step-icon svg {
        filter: drop-shadow(0 5px 15px rgba(232, 180, 166, 0.3));
    }
    
    /* Enhanced floating animation for doodles */
    .doodle-1 {
        animation: float 8s ease-in-out infinite;
    }
    
    .doodle-2 {
        animation: float 10s ease-in-out infinite reverse;
    }
    
    .doodle-3 {
        animation: float 9s ease-in-out infinite;
    }
    
    .doodle-4 {
        animation: float 11s ease-in-out infinite reverse;
    }
    
    .doodle-5 {
        animation: float 7s ease-in-out infinite;
    }
    
    /* Depth layers animation enhancement */
    .depth-layer {
        will-change: transform;
    }
`;
document.head.appendChild(style);

// Intersection Observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.benefit-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Enhanced form interactions
document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentNode.style.transform = 'scale(1.02)';
        this.parentNode.style.transition = 'transform 0.2s ease';
    });
    
    input.addEventListener('blur', function() {
        this.parentNode.style.transform = 'scale(1)';
    });
    
    // Add character counter for textarea
    if (input.type === 'textarea' || input.tagName === 'TEXTAREA') {
        input.addEventListener('input', function() {
            const charCount = this.value.length;
            const minCount = 20;
            
            // Remove existing counter
            const existingCounter = this.parentNode.querySelector('.char-counter');
            if (existingCounter) {
                existingCounter.remove();
            }
            
            // Add counter if needed
            if (charCount > 0) {
                const counter = document.createElement('div');
                counter.className = 'char-counter';
                counter.style.cssText = `
                    position: absolute;
                    bottom: -20px;
                    right: 10px;
                    font-size: 0.8rem;
                    color: ${charCount >= minCount ? 'var(--peach)' : 'var(--warm-gray)'};
                    transition: color 0.3s ease;
                `;
                counter.textContent = `${charCount}/${minCount}+ символов`;
                this.parentNode.appendChild(counter);
            }
        });
    }
});

// Add micro-interactions
document.querySelectorAll('.benefit-card, .step').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add hover effects for hero features
document.querySelectorAll('.feature-item').forEach(item => {
    item.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.05)';
    });
    
    item.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Animate hero elements on load
window.addEventListener('load', () => {
    const heroTitle = document.querySelector('.hero-title .title-main');
    const heroSubtitle = document.querySelector('.hero-title .title-script');
    const heroBadge = document.querySelector('.hero-badge');
    const heroFeatures = document.querySelectorAll('.feature-item');
    
    // Animate badge
    if (heroBadge) {
        heroBadge.style.opacity = '0';
        heroBadge.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            heroBadge.style.transition = 'all 0.6s ease';
            heroBadge.style.opacity = '1';
            heroBadge.style.transform = 'translateY(0)';
        }, 200);
    }
    
    // Animate title with new animation
    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.classList.add('hero-title-animated');
    }
    
    // Animate subtitle
    if (heroSubtitle) {
        heroSubtitle.classList.add('hero-subtitle-animated');
    }
    
    // Animate features
    heroFeatures.forEach((feature, index) => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';
        setTimeout(() => {
            feature.style.transition = 'all 0.5s ease';
            feature.style.opacity = '1';
            feature.style.transform = 'translateY(0)';
        }, 1200 + (index * 150));
    });
});

console.log('✨ lumee landing page загружен! Добро пожаловать в уютный круг ✨'); 