document.addEventListener('DOMContentLoaded', function() {
    // ensure sample data exists (also sets footer year)
    initializeSampleData();

    checkUserRole();
    loadUserName();
    loadDashboardData();
    loadAttendanceHistory();
    loadNotices();

    // load timetable for student
    loadTimetableForStudent();

    // make headings clickable
    initHeadingButtons();

    // initial hash -> load page
    if (location.hash && location.hash.length > 1) {
        const h = location.hash.substring(1);
        if (document.getElementById(h)) showPage(h);
    }

    window.addEventListener('hashchange', function() {
        const h = location.hash.substring(1);
        if (document.getElementById(h)) showPage(h);
    });

    initSidebarHandlers();

    // refresh timetable when it changes (same window)
    document.addEventListener('timetableUpdated', () => {
        if (document.getElementById('timetable')?.classList.contains('active')) loadTimetableForStudent();
    });
    // handle cross-tab updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'timetable') loadTimetableForStudent();
    });
});

function initSidebarHandlers() {
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.setAttribute('role', 'button');
        if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex', '0');

        btn.addEventListener('click', function(e) {
            const page = btn.getAttribute('data-page') || (btn.getAttribute('onclick') || '').match(/showPage\('([^']+)'\)/)?.[1];
            // If this is a link that opens a new tab, let it open and do not navigate current tab
            if (btn.tagName === 'A' && btn.target === '_blank') return;
            if (page) {
                e.preventDefault();
                showPage(page);
            }
        });

        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                btn.click();
            }
        });
    });
}

// Make each page <h2> clickable: navigate to its page id on click (and via Enter/Space)
function initHeadingButtons() {
    document.querySelectorAll('.page > h2').forEach(h => {
        h.setAttribute('role', 'button');
        if (!h.hasAttribute('tabindex')) h.setAttribute('tabindex', '0');
        h.classList.add('h2-button');
        h.addEventListener('click', function() {
            const pageId = h.parentElement?.id;
            if (pageId) showPage(pageId);
        });
        h.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                h.click();
            }
        });
    });
} 

// ユーザーロールをチェック

function checkUserRole() {
    const role = localStorage.getItem('userRole');
    if (role !== 'student') {
        window.location.href = '../index.html';
    }
}

// ユーザー名を読み込む

function loadUserName() {
    const email = localStorage.getItem('userEmail');
    document.getElementById('userName').textContent = email || 'ユーザー';
}


// Load dashboard data
function loadDashboardData() {
    const email = localStorage.getItem('userEmail');
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const student = students.find(s => s.email === email);
    
    if (student) {
        document.getElementById('studentClass').textContent = student.class;
    }
    
    
    // Calculate attendance statistics
    const attendanceHistory = JSON.parse(localStorage.getItem('myAttendance')) || [];
    const presentCount = attendanceHistory.filter(a => a.status === '出席').length;
    const absentCount = attendanceHistory.filter(a => a.status === '欠席').length;
    
    document.getElementById('presentCount').textContent = presentCount;
    document.getElementById('absentCount').textContent = absentCount;
}

// ページを表示

function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });

    const pageEl = document.getElementById(pageName);
    if (pageEl) pageEl.classList.add('active');

    const clickedBtn = document.querySelector(`.sidebar-item[data-page="${pageName}"]`) || document.querySelector(`.sidebar-item[onclick="showPage('${pageName}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');

    // update hash
    if (location.hash.substring(1) !== pageName) {
        history.replaceState(null, '', '#' + pageName);
    }

    // Load page-specific data
    switch (pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'attendance':
            // attendance page uses submitAttendance UI
            break;
        case 'attendanceRecord':
            loadAttendanceHistory();
            break;
        case 'timetable':
            loadTimetableForStudent();
            break;
        case 'notices':
            loadNotices();
            break;
        default:
            break;
    }
}


// Submit attendance
function submitAttendance() {
    const code = document.getElementById('attendanceCode').value.trim().toUpperCase();
    const messageDiv = document.getElementById('attendanceMessage');
    
    if (!code) {
        showAttendanceMessage('コードを入力してください', 'danger');
        return;
    }
    
    // Check if code is valid
    const attendanceCodes = JSON.parse(localStorage.getItem('attendanceCodes')) || [];
    const validCode = attendanceCodes.find(ac => ac.code === code && ac.isActive);
    
    if (!validCode) {
        showAttendanceMessage('無効なコードです', 'danger');
        return;
    }
    
    // 出席を記録
    const myAttendance = JSON.parse(localStorage.getItem('myAttendance')) || [];
    const userEmail = localStorage.getItem('userEmail');
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const me = students.find(s => s.email === userEmail) || { name: '', class: '' };

    const record = {
        email: userEmail,
        name: me.name || '',
        class: me.class || '',
        status: '出席',
        date: new Date().toLocaleDateString('ja-JP'),
        time: new Date().toLocaleTimeString('ja-JP'),
        code: code
    };

    myAttendance.push({
        status: '出席',
        date: record.date,
        time: record.time,
        code: code
    });
    localStorage.setItem('myAttendance', JSON.stringify(myAttendance));

    // also save to global attendanceRecords so teachers/admins can see it
    const attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    attendanceRecords.push(record);
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));

    // notify other parts of the app in this window
    document.dispatchEvent(new CustomEvent('attendanceRecorded', { detail: { email: userEmail, class: me.class } }));

    // フォームをクリア
    document.getElementById('attendanceCode').value = '';
    
    // Show success message
    showAttendanceMessage('出席が記録されました！', 'success');
    
    // Update dashboard
    setTimeout(() => {
        loadDashboardData();
        loadAttendanceHistory();
    }, 1000);
}

// Show attendance message
function showAttendanceMessage(message, type) {
    const messageDiv = document.getElementById('attendanceMessage');
    messageDiv.className = 'alert alert-' + type;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 3000);
}

// 出席履歴を読み込む
function loadAttendanceHistory() {
    const attendance = JSON.parse(localStorage.getItem('myAttendance')) || [];
    const tbody = document.getElementById('attendanceHistory');
    tbody.innerHTML = '';
    
    if (attendance.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">記録なし</td>';
        tbody.appendChild(row);
        return;
    }
    
    attendance.forEach((record, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td><span class="status-badge status-${record.status === '出席' ? 'present' : 'absent'}">${record.status}</span></td>
            <td>${record.time}</td>
        `;
        tbody.appendChild(row);
    });
}

// お知らせを読み込む
function loadNotices() {
    const notices = JSON.parse(localStorage.getItem('notices')) || [];
    const container = document.getElementById('noticesList');
    container.innerHTML = '';
    
    if (notices.length === 0) {
        const noNotice = document.createElement('div');
        noNotice.className = 'card';
        noNotice.innerHTML = '<p style="color: #999;">お知らせはありません</p>';
        container.appendChild(noNotice);
        return;
    }
    
    notices.forEach((notice) => {
        const noticeCard = document.createElement('div');
        noticeCard.className = 'card';
        noticeCard.innerHTML = `
            <h3>${notice.title}</h3>
            <p>${notice.content}</p>
            <p style="font-size: 12px; color: #999;">作成日: ${notice.date}</p>
        `;
        container.appendChild(noticeCard);
    });
}

// Load timetable for student
function loadTimetableForStudent() {
    const timetable = JSON.parse(localStorage.getItem('timetable')) || [];
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const userEmail = localStorage.getItem('userEmail');
    const me = students.find(s => s.email === userEmail);
    const myClass = me ? me.class : null;

    const container = document.getElementById('timetableContent');
    container.innerHTML = '';

    if (timetable.length === 0) {
        container.innerHTML = '<p>時間割が設定されていません。</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>曜日</th>
                <th>時間</th>
                <th>クラス</th>
                <th>科目</th>
                <th>教師</th>
            </tr>
        </thead>
        <tbody id="studentTimetableBody"></tbody>
    `;

    container.appendChild(table);
    const tbody = document.getElementById('studentTimetableBody');

    const filtered = myClass ? timetable.filter(entry => entry.class === myClass) : timetable;

    (filtered.length ? filtered : timetable).forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.day}</td>
            <td>${entry.time}</td>
            <td>${entry.class}</td>
            <td>${entry.subject}</td>
            <td>${entry.teacher}</td>
        `;
        tbody.appendChild(row);
    });
}

// ログアウト
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    window.location.href = '../index.html';
}