// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // ensure sample data exists
    initializeSampleData();

    checkUserRole();
    loadUserName();
    loadDashboardData();
    loadStudents();
    loadTeachers();
    loadClasses();
    loadTimetable();
    // load accounts management UI
    loadAccounts();

    // add keyboard support for clickable cards (Enter / Space)
    addClickableKeyHandlers();

    // refresh accounts list when accounts change (same window)
    document.addEventListener('accountsUpdated', () => {
        if (document.getElementById('accounts')?.classList.contains('active')) loadAccounts();
        // also refresh students/teachers pages if they're visible so account creation is reflected immediately
        if (document.getElementById('students')?.classList.contains('active')) loadStudents();
        if (document.getElementById('teachers')?.classList.contains('active')) loadTeachers();
    });
    // handle cross-tab updates
    window.addEventListener('storage', (e) => { if (e.key === 'accounts') loadAccounts(); });

    // If URL contains a hash, open that page on load
    if (location.hash && location.hash.length > 1) {
        const h = location.hash.substring(1);
        // ensure element exists before showing
        if (document.getElementById(h)) showPage(h);
    }

    // handle manual hash changes (back/forward navigation)
    window.addEventListener('hashchange', function() {
        const h = location.hash.substring(1);
        if (document.getElementById(h)) showPage(h);
    });

    // initialize sidebar 
    initSidebarHandlers();
});

function initSidebarHandlers() {
    document.querySelectorAll('.sidebar-item').forEach(btn => {
        // ensure accessible
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
// Check user role
function checkUserRole() {
    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
        window.location.href = '../index.html';
    }
}

// ユーザー名を読み込む

function loadUserName() {
    const email = localStorage.getItem('userEmail');
    document.getElementById('userName').textContent = email || 'ユーザー';
}

// ページを表示
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from all menu items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected page
    const pageEl = document.getElementById(pageName);
    if (pageEl) pageEl.classList.add('active');

    // prefer data-page selector but fall back to inline onclick 
    const clickedBtn = document.querySelector(`.sidebar-item[data-page="${pageName}"]`) || document.querySelector(`.sidebar-item[onclick="showPage('${pageName}')"]`);
    if (clickedBtn) clickedBtn.classList.add('active');

    // Update the URL hash (without adding history entries)
    if (location.hash.substring(1) !== pageName) {
        history.replaceState(null, '', '#' + pageName);
    }

    // Load page-specific data
    switch (pageName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'students':
            loadStudents();
            break;
        case 'teachers':
            loadTeachers();
            break;
        case 'classes':
            loadClasses();
            break;
        case 'timetable':
            loadTimetable();
            break;
        case 'accounts':
            loadAccounts();
            break;
        case 'attendance':
            // ensure class dropdown is up-to-date for attendance
            loadClasses();
            break;
        case 'notices':
            loadNotices();
            break;
        default:
            break;
    }
}

// ダッシュボードデータを読み込む
// Load dashboard data
function loadDashboardData() {
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    
    document.getElementById('totalStudents').textContent = students.length;
    document.getElementById('totalTeachers').textContent = teachers.length;
    document.getElementById('totalClasses').textContent = classes.length;
}

// 学生を読み込む
// Load students
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
            <td>${student.class}</td>
            <td>
                <button class="btn btn-small btn-danger" onclick="deleteStudent(${index})">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 学生を追加
// Add student
function addStudent() {
    const name = document.getElementById('studentName').value;
    const email = document.getElementById('studentEmail').value;
    const classVal = document.getElementById('studentClass').value;
    
    // バリデーション
    // Validation
    if (!name || !email || !classVal) {
        alert('すべてのフィールドを入力してください');
        return;
    }
    
    // 学生をlocalStorageに追加
    // Add student to localStorage
    const students = JSON.parse(localStorage.getItem('students')) || [];
    students.push({ name, email, class: classVal });
    localStorage.setItem('students', JSON.stringify(students));
    
    // UIを更新
    // Update UI
    loadStudents();
    loadDashboardData();
    closeModal('studentModal');
    clearInputs(['studentName', 'studentEmail', 'studentClass']);
    alert('学生が追加されました');
}

// 学生を削除
// Delete student
function deleteStudent(index) {
    if (confirm('この学生を削除してもよろしいですか？')) {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        students.splice(index, 1);
        localStorage.setItem('students', JSON.stringify(students));
        loadStudents();
        loadDashboardData();
        alert('学生が削除されました');
    }
}

// 教師を読み込む
// Load teachers
function loadTeachers() {
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    const tbody = document.getElementById('teachersList');
    tbody.innerHTML = '';
    
    teachers.forEach((teacher, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${teacher.name}</td>
            <td>${teacher.email}</td>
            <td>${teacher.subject}</td>
            <td>
                <button class="btn btn-small btn-danger" onclick="deleteTeacher(${index})">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // 教師選択ドロップダウンを更新
    const selects = document.querySelectorAll('#classTeacher, #timetableTeacher');
    selects.forEach(select => {
        select.innerHTML = '<option value="">選択してください</option>';
        teachers.forEach((teacher, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = teacher.name;
            select.appendChild(option);
        });
    });
}
// Add teacher
function addTeacher() {
    const name = document.getElementById('teacherName').value;
    const email = document.getElementById('teacherEmail').value;
    const subject = document.getElementById('teacherSubject').value;
    
    if (!name || !email || !subject) {
        alert('すべてのフィールドを入力してください');
        return;
    }
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    teachers.push({ name, email, subject });
    localStorage.setItem('teachers', JSON.stringify(teachers));
    
    loadTeachers();
    loadDashboardData();
    closeModal('teacherModal');
    clearInputs(['teacherName', 'teacherEmail', 'teacherSubject']);
    alert('教師が追加されました');
}
// Delete teacher
function deleteTeacher(index) {
    if (confirm('この教師を削除してもよろしいですか？')) {
        const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        teachers.splice(index, 1);
        localStorage.setItem('teachers', JSON.stringify(teachers));
        loadTeachers();
        loadDashboardData();
        alert('教師が削除されました');
    }
}

// クラスを読み込む

function loadClasses() {
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const tbody = document.getElementById('classesList');
    tbody.innerHTML = '';
    
    classes.forEach((cls, index) => {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const studentCount = students.filter(s => s.class === cls.name).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${cls.name}</td>
            <td>${cls.teacher}</td>
            <td>${studentCount}</td>
            <td>
                <button class="btn btn-small btn-danger" onclick="deleteClass(${index})">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
   
    // Update class selection 
    const selects = document.querySelectorAll('#studentClass, #attendanceClassSelect, #timetableClass');
    selects.forEach(select => {
        select.innerHTML = '<option value="">選択してください</option>';
        classes.forEach((cls) => {
            const option = document.createElement('option');
            option.value = cls.name;
            option.textContent = cls.name;
            select.appendChild(option);
        });
    });
}


// Timetable 

function loadTimetable() {
    const timetable = JSON.parse(localStorage.getItem('timetable')) || [];
    const container = document.getElementById('timetableList');
    container.innerHTML = '';

    if (timetable.length === 0) {
        container.innerHTML = '<p>時間割が設定されていません。</p>';
        return;
    }

    // Render table
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
                <th>操作</th>
            </tr>
        </thead>
        <tbody id="timetableBody"></tbody>
    `;

    container.appendChild(table);

    const tbody = document.getElementById('timetableBody');

    timetable.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.day}</td>
            <td>${entry.time}</td>
            <td>${entry.class}</td>
            <td>${entry.subject}</td>
            <td>${entry.teacher}</td>
            <td>
                <button class="btn btn-small" onclick="openTimetableModal(${index})">編集</button>
                <button class="btn btn-small btn-danger" onclick="deleteTimetableEntry(${index})">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Populate class and teacher selects in modal
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];

    const classSelect = document.getElementById('timetableClass');
    const teacherSelect = document.getElementById('timetableTeacher');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">選択してください</option>';
        classes.forEach(cls => {
            const opt = document.createElement('option'); opt.value = cls.name; opt.textContent = cls.name; classSelect.appendChild(opt);
        });
    }
    if (teacherSelect) {
        teacherSelect.innerHTML = '<option value="">選択してください</option>';
        teachers.forEach(t => {
            const opt = document.createElement('option'); opt.value = t.name; opt.textContent = t.name; teacherSelect.appendChild(opt);
        });
    }
}

function openTimetableModal(index = -1) {
    const editIndexEl = document.getElementById('timetableEditIndex');
    editIndexEl.value = index;

    if (index >= 0) {
        const timetable = JSON.parse(localStorage.getItem('timetable')) || [];
        const entry = timetable[index];
        if (entry) {
            document.getElementById('timetableDay').value = entry.day;
            document.getElementById('timetableTime').value = entry.time;
            document.getElementById('timetableClass').value = entry.class;
            document.getElementById('timetableSubject').value = entry.subject;
            document.getElementById('timetableTeacher').value = entry.teacher;
        }
    } else {
        // clear inputs
        clearInputs(['timetableTime', 'timetableSubject']);
        document.getElementById('timetableDay').value = '月';
        document.getElementById('timetableClass').value = '';
        document.getElementById('timetableTeacher').value = '';
    }

    document.getElementById('timetableModal').classList.add('active');
}

function saveTimetableEntry() {
    const day = document.getElementById('timetableDay').value;
    const time = document.getElementById('timetableTime').value;
    const cls = document.getElementById('timetableClass').value;
    const subject = document.getElementById('timetableSubject').value;
    const teacher = document.getElementById('timetableTeacher').value;
    const editIndex = parseInt(document.getElementById('timetableEditIndex').value, 10);

    if (!day || !time || !cls || !subject || !teacher) {
        alert('すべてのフィールドを入力してください');
        return;
    }

    const timetable = JSON.parse(localStorage.getItem('timetable')) || [];

    const newEntry = { day, time, class: cls, subject, teacher };

    if (editIndex >= 0) {
        timetable[editIndex] = newEntry;
        alert('時間割が更新されました');
    } else {
        timetable.push(newEntry);
        alert('時間割が追加されました');
    }

    localStorage.setItem('timetable', JSON.stringify(timetable));
    // notify other parts of the app
    document.dispatchEvent(new CustomEvent('timetableUpdated', { detail: { source: 'admin' } }));
    // close modal and refresh admin 
    closeModal('timetableModal');
    loadTimetable();
}

function deleteTimetableEntry(index) {
    if (!confirm('この時間割を削除してもよろしいですか？')) return;
    const timetable = JSON.parse(localStorage.getItem('timetable')) || [];
    timetable.splice(index, 1);
    localStorage.setItem('timetable', JSON.stringify(timetable));
    // notify other parts of
    document.dispatchEvent(new CustomEvent('timetableUpdated', { detail: { source: 'admin' } }));
    loadTimetable();
}

// Add class
function addClass() {
    const name = document.getElementById('className').value;
    const teacher = document.getElementById('classTeacher').value;
    
    if (!name || !teacher) {
        alert('すべてのフィールドを入力してください');
        return;
    }
    
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
    const teacherName = teachers[teacher]?.name || 'なし';
    
    classes.push({ name, teacher: teacherName });
    localStorage.setItem('classes', JSON.stringify(classes));
    
    loadClasses();
    loadDashboardData();
    closeModal('classModal');
    clearInputs(['className', 'classTeacher']);
    alert('クラスが作成されました');
}

// Delete class
function deleteClass(index) {
    if (confirm('このクラスを削除してもよろしいですか？')) {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        classes.splice(index, 1);
        localStorage.setItem('classes', JSON.stringify(classes));
        loadClasses();
        loadDashboardData();
        alert('クラスが削除されました');
    }
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
    
    // notify other pages and refresh list
    document.dispatchEvent(new CustomEvent('noticesUpdated', { detail: { source: 'admin' } }));
    loadNotices();
    clearInputs(['noticeTitle', 'noticeContent']);
    alert('お知らせが作成されました');
}
// Admin: load notices with delete option
function loadNotices() {
    const notices = JSON.parse(localStorage.getItem('notices')) || [];
    const container = document.getElementById('noticesList');
    if (!container) return;
    container.innerHTML = '';
    
    if (notices.length === 0) {
        container.innerHTML = '<p style="color:#999;">お知らせがありません。</p>';
        return;
    }
    
    notices.forEach((notice, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '10px';
        card.innerHTML = `
            <h3>${notice.title}</h3>
            <p>${notice.content}</p>
            <p style="font-size: 12px; color: #999;">作成日: ${notice.date}</p>
            <div style="text-align: right;">
                <button class="btn btn-small btn-danger" onclick="deleteNotice(${index})">削除</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function deleteNotice(index) {
    if (!confirm('このお知らせを削除してもよろしいですか？')) return;
    const notices = JSON.parse(localStorage.getItem('notices')) || [];
    notices.splice(index, 1);
    localStorage.setItem('notices', JSON.stringify(notices));
    // notify other pages
    document.dispatchEvent(new CustomEvent('noticesUpdated', { detail: { source: 'admin' } }));
    loadNotices();
}

// refresh notices when created elsewhere in the app
document.addEventListener('noticesUpdated', () => { if (document.getElementById('notices')?.classList.contains('active')) loadNotices(); });
window.addEventListener('storage', (e) => { if (e.key === 'notices') loadNotices(); });

// 出席データを読み込む
function loadAttendanceData() {
    const className = document.getElementById('attendanceClassSelect').value;
    if (!className) return;
    
    const students = JSON.parse(localStorage.getItem('students')) || [];
    const classStudents = students.filter(s => s.class === className);
    
    const tbody = document.getElementById('attendanceList');
    tbody.innerHTML = '';

    const records = JSON.parse(localStorage.getItem('attendanceRecords')) || [];
    
    if (classStudents.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align:center; color:#999;">このクラスに学生がいません</td>';
        tbody.appendChild(row);
        return;
    }
    
    classStudents.forEach(student => {
        const present = records.filter(r => r.email === student.email && r.status === '出席').length;
        const absent = records.filter(r => r.email === student.email && r.status === '欠席').length;
        const late = records.filter(r => r.email === student.email && r.status === '遅刻').length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${present}</td>
            <td>${absent}</td>
            <td>${late}</td>
        `;
        tbody.appendChild(row);
    });
}

// refresh attendance list when records change
document.addEventListener('attendanceRecorded', () => { if (document.getElementById('attendance')?.classList.contains('active')) loadAttendanceData(); });
window.addEventListener('storage', (e) => { if (e.key === 'attendanceRecords') loadAttendanceData(); });

// ------------------------------
// Accounts management (Admin-only)
// ------------------------------
function loadAccounts() {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const tbody = document.getElementById('accountsList');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (accounts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align:center; color:#999;">アカウントがありません</td>';
        tbody.appendChild(row);
        return;
    }

    accounts.forEach((acc, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${acc.role}</td>
            <td>${acc.name}</td>
            <td>${acc.email}</td>
            <td>
                <button class="btn btn-small" onclick="openAccountModal(${index})">編集</button>
                <button class="btn btn-small btn-danger" onclick="deleteAccount(${index})">削除</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openAccountModal(index = -1) {
    const editIndexEl = document.getElementById('accountEditIndex');
    editIndexEl.value = index;

    if (index >= 0) {
        const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
        const acc = accounts[index];
        if (acc) {
            document.getElementById('accountRole').value = acc.role;
            document.getElementById('accountName').value = acc.name;
            document.getElementById('accountEmail').value = acc.email;
            document.getElementById('accountPassword').value = '';
        }
    } else {
        document.getElementById('accountRole').value = '';
        document.getElementById('accountName').value = '';
        document.getElementById('accountEmail').value = '';
        document.getElementById('accountPassword').value = '';
    }

    document.getElementById('accountModal').classList.add('active');
}

function saveAccount() {
    // only admin should be able to call this - in practice admin page is admin-only
    const role = document.getElementById('accountRole').value;
    const name = document.getElementById('accountName').value.trim();
    let email = document.getElementById('accountEmail').value.trim();
    const password = document.getElementById('accountPassword').value;
    const editIndex = parseInt(document.getElementById('accountEditIndex').value, 10);

    // normalize email to lowercase for consistent lookup
    if (email) email = email.toLowerCase();

    if (!role || !name || !email) {
        alert('ロール、名前、メールは必須です');
        return;
    }

    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];

    if (editIndex >= 0) {
        const oldRole = accounts[editIndex].role;
        const oldEmail = accounts[editIndex].email.toLowerCase();
        accounts[editIndex] = { role, name, email, password: password || accounts[editIndex].password };

        // if role changed or email changed, adjust students/teachers arrays
        if (oldRole !== role || oldEmail !== email) {
            // remove old record from previous role array
            if (oldRole === 'student') {
                const students = JSON.parse(localStorage.getItem('students')) || [];
                const idx = students.findIndex(s => s.email.toLowerCase() === oldEmail);
                if (idx >= 0) { students.splice(idx, 1); localStorage.setItem('students', JSON.stringify(students)); }
            } else if (oldRole === 'teacher') {
                const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
                const idx = teachers.findIndex(t => t.email.toLowerCase() === oldEmail);
                if (idx >= 0) { teachers.splice(idx, 1); localStorage.setItem('teachers', JSON.stringify(teachers)); }
            }
        }
    } else {
        // new account requires password
        if (!password) {
            alert('新しいアカウント作成時はパスワードが必要です');
            return;
        }
        accounts.push({ role, name, email, password });
    }

    // ensure corresponding student/teacher entry exists for role
    if (role === 'student') {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        if (!students.find(s => s.email === email)) {
            students.push({ name, email, class: '' });
            localStorage.setItem('students', JSON.stringify(students));
        }
    } else if (role === 'teacher') {
        const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        if (!teachers.find(t => t.email === email)) {
            teachers.push({ name, email, subject: '' });
            localStorage.setItem('teachers', JSON.stringify(teachers));
        }
    }

    localStorage.setItem('accounts', JSON.stringify(accounts));
    document.dispatchEvent(new CustomEvent('accountsUpdated', { detail: { source: 'admin' } }));
    closeModal('accountModal');
    loadAccounts();
    alert('アカウントが保存されました');
}

function deleteAccount(index) {
    if (!confirm('このアカウントを削除してもよろしいですか？')) return;
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const acc = accounts[index];
    if (!acc) return;

    const email = acc.email;
    const role = acc.role;

    accounts.splice(index, 1);
    localStorage.setItem('accounts', JSON.stringify(accounts));

    // remove related entry from students/teachers arrays
    if (role === 'student') {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        const idx = students.findIndex(s => s.email === email);
        if (idx >= 0) { students.splice(idx, 1); localStorage.setItem('students', JSON.stringify(students)); }
    } else if (role === 'teacher') {
        const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        const idx = teachers.findIndex(t => t.email === email);
        if (idx >= 0) { teachers.splice(idx, 1); localStorage.setItem('teachers', JSON.stringify(teachers)); }
    }

    document.dispatchEvent(new CustomEvent('accountsUpdated', { detail: { source: 'admin' } }));
    loadAccounts();
    alert('アカウントが削除されました');
}

// モーダルを開く
// Open modal
function openStudentModal() { document.getElementById('studentModal').classList.add('active'); }
function openTeacherModal() { document.getElementById('teacherModal').classList.add('active'); }
function openClassModal() { document.getElementById('classModal').classList.add('active'); }

// モーダルを閉じる
// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// 入力をクリア
// Clear inputs
function clearInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

// キーボードでカードをアクティブ化 (Enter / Space)
// Keyboard activation for clickable cards
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
// Logout
function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    window.location.href = '../index.html';
}
