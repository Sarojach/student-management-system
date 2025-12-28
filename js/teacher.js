
// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // ensure sample data exists
    initializeSampleData();

    checkUserRole();
    loadUserName();
    loadDashboardData();
    loadStudents();
    loadNotices();
    loadTimetableForTeacher();

    // keyboard support 
    addClickableKeyHandlers();

    // initial 
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
        if (document.getElementById('timetable')?.classList.contains('active')) loadTimetableForTeacher();
    });
    // handle cross-tab updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'timetable') loadTimetableForTeacher();
    });

    // listen for attendance updates
    document.addEventListener('attendanceRecorded', () => {
        if (document.getElementById('attendance')?.classList.contains('active')) loadAttendanceList();
    });
    window.addEventListener('storage', (e) => {
        if (e.key === 'attendanceRecords') loadAttendanceList();
    });

    
    initHeadingButtons();
});

function initSidebarHandlers() {
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        btn.setAttribute('role', 'button');
        if (!btn.hasAttribute('tabindex')) btn.setAttribute('tabindex', '0');

        btn.addEventListener('click', function(e) {
            const page = btn.getAttribute('data-page') || (btn.getAttribute('onclick') || '').match(/showPage\('([^']+)'\)/)?.[1];
          
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

// 時間割を読み込む（教師用ビュー）

function loadTimetableForTeacher() {
    const timetable = JSON.parse(localStorage.getItem('timetable')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];

    const userEmail = localStorage.getItem('userEmail');
    let teacherName = null;
    const myTeacher = teachers.find(t => t.email === userEmail);
    if (myTeacher) teacherName = myTeacher.name;

    // try to find assigned class from classes list (simple heuristic)
    const myClass = classes[0] || null;

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
        <tbody id="teacherTimetableBody"></tbody>
    `;

    container.appendChild(table);
    const tbody = document.getElementById('teacherTimetableBody');

    // filter: show entries for this teacher or for their assigned class; else show all
    const filtered = timetable.filter(entry => {
        if (teacherName && entry.teacher === teacherName) return true;
        if (myClass && entry.class === myClass.name) return true;
        return false;
    });

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




// Check user role
function checkUserRole() {
    const role = localStorage.getItem('userRole');
    if (role !== 'teacher') {
        window.location.href = '../index.html';
    }
}

// ユーザー名を読み込む

function loadUserName() {
    const email = localStorage.getItem('userEmail');
    document.getElementById('userName').textContent = email || 'ユーザー';
}

// ダッシュボードデータを読み込む

function loadDashboardData() {
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const email = localStorage.getItem('userEmail');
    
    
    // Find teacher's assigned class
    const myClass = classes[0] || null;
    
    if (myClass) {
        document.getElementById('assignedClass').textContent = myClass.name;
        
       
        // Get number of students in this class
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const classStudents = students.filter(s => s.class === myClass.name);
        document.getElementById('classStudentCount').textContent = classStudents.length;
    }
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
            // attendance page uses generateAttendanceCode / UI elements
            loadAttendanceList();
            break;
        case 'students':
            loadStudents();
            break;
        case 'timetable':
            loadTimetableForTeacher();
            break;
        case 'notices':
            loadNotices();
            break;
        default:
            break;
    }
}

// 出席コードを生成

function generateAttendanceCode() {
    
    // Generate random code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // コードを表示
   
    document.getElementById('displayCode').textContent = code;
    document.getElementById('codeDisplay').style.display = 'block';
    document.getElementById('closeBtn').style.display = 'block';
    
    // コードをlocalStorageに保存
   
    const attendanceCodes = JSON.parse(localStorage.getItem('attendanceCodes')) || [];
    attendanceCodes.push({
        code: code,
        date: new Date().toLocaleDateString('ja-JP'),
        time: new Date().toLocaleTimeString('ja-JP'),
        isActive: true
    });
    localStorage.setItem('attendanceCodes', JSON.stringify(attendanceCodes));
}

// 出席を終了

function closeAttendance() {
    document.getElementById('codeDisplay').style.display = 'none';
    document.getElementById('closeBtn').style.display = 'none';
    alert('出席を終了しました');
}

// 学生を読み込む

function loadStudents() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const tbody = document.getElementById('studentsList');
    tbody.innerHTML = '';
    
    students.forEach((student, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
        `;
        tbody.appendChild(row);
    });
}

// Load attendance records for teacher view (shows students who recorded attendance)
function loadAttendanceList() {
    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    const userEmail = localStorage.getItem('userEmail');
    const myTeacher = teachers.find(t => t.email === userEmail);
    const teacherName = myTeacher ? myTeacher.name : null;
    const myClass = classes[0] || null;

    const container = document.getElementById('attendanceList');
    container.innerHTML = '';

    // Filter records for this teacher's class (if available)
    const filtered = records.filter(r => {
        if (teacherName && r.teacher === teacherName) return true; // rare, teacher not in record
        if (myClass && r.class === myClass.name) return true;
        return false;
    });

    if (filtered.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">出席記録がありません</td>';
        container.appendChild(row);
        return;
    }

    filtered.slice().reverse().forEach(rec => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rec.name || rec.email}</td>
            <td>${rec.status}</td>
            <td>${rec.time} ${rec.date}</td>
        `;
        container.appendChild(row);
    });
} 

// お知らせを読み込む

function loadNotices() {
    const notices = JSON.parse(localStorage.getItem('notices')) || [];
    const container = document.getElementById('noticesList');
    container.innerHTML = '';
    
    notices.forEach((notice, index) => {
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

// お知らせを作成

function createNotice() {
    const title = document.getElementById('noticeTitle').value;
    const content = document.getElementById('noticeContent').value;
    
    if (!title || !content) {
        alert('タイトルと内容を入力してください');
        return;
    }
    
    const notices = JSON.parse(localStorage.getItem('notices')) || [];
    notices.push({ title, content, date: new Date().toLocaleDateString('ja-JP') });
    localStorage.setItem('notices', JSON.stringify(notices));
    
    loadNotices();
    closeModal('noticeModal');
    clearInputs(['noticeTitle', 'noticeContent']);
    alert('お知らせが作成されました');
}

// モーダルを開く

function openNoticeModal() {
    document.getElementById('noticeModal').classList.add('active');
}

// モーダルを閉じる

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 入力をクリア

function clearInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// Keyboard activation for clickable cards (Enter / Space)
function addClickableKeyHandlers() {
    document.querySelectorAll('.card.clickable[role="button"]').forEach(el => {
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                el.click();
            }
        });
    });
}

// ログアウト

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    window.location.href = '../index.html';
}