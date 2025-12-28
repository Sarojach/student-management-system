
// Initialize sample data in localStorage
function initializeSampleData() {
    const students = JSON.parse(localStorage.getItem('students'));
    if (!students) {
        localStorage.setItem('students', JSON.stringify([
            { name: 'タナカ', email: 'tanaka@example.com', class: '1年A組' },
            { name: 'ヨシダ', email: 'yasida@example.com', class: '1年B組' }
        ]));
    }
    
    const teachers = JSON.parse(localStorage.getItem('teachers'));
    if (!teachers) {
        localStorage.setItem('teachers', JSON.stringify([
            { name: '佐藤先生', email: 'sato@example.com', subject: '数学' },
            { name: '渡辺先生', email: 'watanabe@example.com', subject: '英語' }
        ]));
    }
    
    const classes = JSON.parse(localStorage.getItem('classes'));
    if (!classes) {
        localStorage.setItem('classes', JSON.stringify([
            { name: '1年A組', teacher: '佐藤先生' },
            { name: '1年B組', teacher: '渡辺先生' }
        ]));
    }

    // Timetable sample data
    const timetable = JSON.parse(localStorage.getItem('timetable'));
    if (!timetable) {
        localStorage.setItem('timetable', JSON.stringify([
            { day: '月', time: '09:00-10:00', class: '1年A組', subject: '数学', teacher: '佐藤先生' },
            { day: '月', time: '10:00-11:00', class: '1年B組', subject: '英語', teacher: '渡辺先生' },
            { day: '火', time: '09:00-10:00', class: '1年A組', subject: '英語', teacher: '渡辺先生' }
        ]));
    }

    // Sample accounts (admin creates accounts) — for demo purposes
    const accounts = JSON.parse(localStorage.getItem('accounts'));
    if (!accounts) {
        localStorage.setItem('accounts', JSON.stringify([
            { role: 'admin', name: '管理者', email: 'admin@example.com', password: 'admin123' },
            { role: 'teacher', name: '佐藤先生', email: 'sato@example.com', password: 'teach123' },
            { role: 'student', name: '田中太郎', email: 'tanaka@example.com', password: 'stud123' }
        ]));
    }

    // set footer year if footer exists on the page
    try { setFooterYear(); } catch (e) { /* ignore if DOM not ready */ }
} 

// 日付をフォーマット

function formatDate(date) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(date).toLocaleDateString('ja-JP', options);
}

// 時刻をフォーマット

function formatTime(date) {
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return new Date(date).toLocaleTimeString('ja-JP', options);
}

// ローカルストレージからデータを取得
function getStorageData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}


// Save data to localStorage
function saveStorageData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// Check if user is authenticated
function isUserAuthenticated() {
    return localStorage.getItem('isLoggedIn') === 'true';
}

// ユーザーのロールを取得
function getUserRole() {
    return localStorage.getItem('userRole');
}

// ユーザーのメールアドレスを取得
function getUserEmail() {
    return localStorage.getItem('userEmail');
}

// ボタンをDisableにして処理中状態を表示
// Disable button to show processing state
function disableButton(buttonElement, text = '処理中...') {
    buttonElement.disabled = true;
    buttonElement.textContent = text;
}

// ボタンをEnableにして元のテキストに戻す
// Enable button and restore original text
function enableButton(buttonElement, text = 'アクション') {
    buttonElement.disabled = false;
    buttonElement.textContent = text;
}

// Simple validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return strength;
}

// URLパラメータを取得
function getUrlParameter(name) {
    const url = new URL(window.location);
    return url.searchParams.get(name);
}

// ページをリダイレクト
function redirectPage(url) {
    window.location.href = url;
}

// Reload page
function reloadPage() {
    location.reload();
}

// Delay execution function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Set footer year
function setFooterYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
} 