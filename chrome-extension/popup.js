const translations = {
  en: {
    'not-logged-in': 'Not logged in',
    'logged-in': 'Logged in',
    'login': 'Login to Dashboard',
    'logout': 'Logout',
    'full-name': 'Full Name *',
    'email': 'Email *',
    'phone': 'Phone',
    'company': 'Company',
    'notes': 'Notes',
    'capture-lead': 'Capture Lead',
    'auto-fill-hint': 'Auto-filled from page',
    'success': 'Lead captured successfully!',
    'error': 'Error capturing lead. Please try again.',
    'login-required': 'Please login first',
  },
  ar: {
    'not-logged-in': 'غير مسجل الدخول',
    'logged-in': 'مسجل الدخول',
    'login': 'تسجيل الدخول',
    'logout': 'تسجيل الخروج',
    'full-name': 'الاسم الكامل *',
    'email': 'البريد الإلكتروني *',
    'phone': 'الهاتف',
    'company': 'الشركة',
    'notes': 'ملاحظات',
    'capture-lead': 'التقاط العميل المحتمل',
    'auto-fill-hint': 'تم الملء التلقائي من الصفحة',
    'success': 'تم التقاط العميل المحتمل بنجاح!',
    'error': 'خطأ في التقاط العميل المحتمل. حاول مرة أخرى.',
    'login-required': 'يرجى تسجيل الدخول أولاً',
  },
};

let currentLang = 'en';

function updateLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.getAttribute('data-i18n');
    if (translations[lang][key]) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translations[lang][key];
      } else {
        element.textContent = translations[lang][key];
      }
    }
  });

  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;

  chrome.storage.local.set({ language: lang });
}

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    updateLanguage(btn.dataset.lang);
  });
});

chrome.storage.local.get(['user', 'language'], (result) => {
  if (result.language) {
    updateLanguage(result.language);
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === result.language);
    });
  }

  if (result.user) {
    document.getElementById('authSection').classList.add('hidden');
    document.getElementById('captureSection').classList.remove('hidden');
    autoFillFromPage();
  }
});

document.getElementById('loginButton').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://your-app-url.com/auth/login' });
});

document.getElementById('logoutButton').addEventListener('click', () => {
  chrome.storage.local.remove('user', () => {
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('captureSection').classList.add('hidden');
    showMessage(translations[currentLang]['logged-out'] || 'Logged out', 'success');
  });
});

document.getElementById('captureButton').addEventListener('click', async () => {
  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;
  const company = document.getElementById('company').value;
  const notes = document.getElementById('notes').value;

  if (!fullName || !email) {
    showMessage('Please fill required fields', 'error');
    return;
  }

  const button = document.getElementById('captureButton');
  button.disabled = true;
  button.textContent = 'Capturing...';

  try {
    const result = await chrome.storage.local.get(['user']);
    if (!result.user) {
      showMessage(translations[currentLang]['login-required'], 'error');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const leadData = {
      full_name: fullName,
      email: email,
      phone: phone || null,
      company: company || null,
      position: null,
      source: 'extension',
      status: 'new',
      notes: notes || null,
      metadata: {
        url: tab.url,
        title: tab.title,
        captured_at: new Date().toISOString(),
      },
    };

    const response = await fetch('https://your-api-url.com/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${result.user.token}`,
      },
      body: JSON.stringify(leadData),
    });

    if (response.ok) {
      showMessage(translations[currentLang]['success'], 'success');
      clearForm();
    } else {
      showMessage(translations[currentLang]['error'], 'error');
    }
  } catch (error) {
    console.error('Error capturing lead:', error);
    showMessage(translations[currentLang]['error'], 'error');
  } finally {
    button.disabled = false;
    button.textContent = translations[currentLang]['capture-lead'];
  }
});

function showMessage(text, type) {
  const messageEl = document.getElementById('message');
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove('hidden');

  setTimeout(() => {
    messageEl.classList.add('hidden');
  }, 3000);
}

function clearForm() {
  document.getElementById('fullName').value = '';
  document.getElementById('email').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('company').value = '';
  document.getElementById('notes').value = '';
}

async function autoFillFromPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.tabs.sendMessage(tab.id, { action: 'extractData' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Could not extract data from page');
        return;
      }

      if (response && response.data) {
        if (response.data.email) {
          document.getElementById('email').value = response.data.email;
        }
        if (response.data.name) {
          document.getElementById('fullName').value = response.data.name;
        }
        if (response.data.company) {
          document.getElementById('company').value = response.data.company;
        }
        if (response.data.phone) {
          document.getElementById('phone').value = response.data.phone;
        }
      }
    });
  } catch (error) {
    console.error('Error auto-filling:', error);
  }
}
