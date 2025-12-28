
// Role selection button event listeners
document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        // すべてのボタンからselectedクラスを削除
      
        this.parentElement.querySelectorAll('.role-btn').forEach(b => {
            b.classList.remove('selected');
        });
        // クリックされたボタンにselectedクラスを追加
        this.classList.add('selected');
        
        // 選択されたロールを隠し入力に保存
        const hiddenInput = this.parentElement.nextElementSibling;
        if (hiddenInput && hiddenInput.type === 'hidden') {
            hiddenInput.value = this.dataset.role;
        }
    });
});

// Toggle between login and signup forms function
function isAdminLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true' && localStorage.getItem('userRole') === 'admin';
}

function toggleSignup(e) {
    e.preventDefault();
    // Only allow admin to open signup form
    if (!isAdminLoggedIn()) {
        showAlert('新規登録は管理者のみが行えます。管理者としてログインしてください。', 'danger');
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
}

// アラートメッセージを表示する関数
// Display alert message function
function showAlert(message, type) {
    const alert = document.getElementById('alertBox');
    alert.className = 'alert alert-' + type;
    alert.textContent = message;
    alert.style.display = 'block';
    
    // 3秒後に自動的にアラートを非表示
    // Auto hide alert after 3 seconds
    setTimeout(() => alert.style.display = 'none', 3000);
}

// ログイン機能
// Login function (validate against accounts)
function login() {
    const role = document.getElementById('selectedRole').value;
    const email = (document.getElementById('email').value || '').trim().toLowerCase();
    const password = document.getElementById('password').value || '';

    // バリデーション: すべてのフィールドが入力されているかチェック
    // Validation: Check if all fields are filled
    if (!role || !email || !password) {
        showAlert('ロールを選択してメールアドレスとパスワードを入力してください', 'danger');
        return;
    }

    // 認証: accountsにあるユーザーと照合
    // Authenticate against accounts (case-insensitive email)
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const account = accounts.find(a => a.email && a.email.toLowerCase() === email && a.role === role);

    if (!account) {
        // check for role mismatch (same email exists with different role)
        const sameEmail = accounts.find(a => a.email && a.email.toLowerCase() === email);
        if (sameEmail) {
            showAlert(`このメールは別のロール（${sameEmail.role}）で登録されています。正しいロールを選択してください。`, 'danger');
        } else {
            showAlert('アカウントが見つかりません。メールとロールを確認してください。', 'danger');
        }
        return;
    }

    if (account.password !== password) {
        showAlert('パスワードが正しくありません', 'danger');
        return;
    }

    // 認証成功: セッション情報を保存
    // Authentication successful: set session
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userName', account.name || email.split('@')[0]);
    localStorage.setItem('isLoggedIn', 'true');

    // ユーザーロールに基づいてリダイレクト
    const redirectPath = {
        'admin': 'pages/admin.html',
        'teacher': 'pages/teacher.html',
        'student': 'pages/student.html'
    };

    showAlert('ログインに成功しました！', 'success');
    setTimeout(() => {
        window.location.href = redirectPath[role];
    }, 500);
}

// サインアップ機能
// Signup function (Admin-only)
function signup() {
    // Only an admin user (already logged in) can create accounts
    if (!isAdminLoggedIn()) {
        showAlert('新規登録は管理者のみが行えます。管理者としてログインしてください。', 'danger');
        return;
    }

    const role = document.getElementById('signupRole').value;
    const name = document.getElementById('fullName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    // バリデーション: すべてのフィールドが入力されているかチェック
    // Validation: Check if all fields are filled
    if (!role || !name || !email || !password) {
        showAlert('すべてのフィールドを入力してください', 'danger');
        return;
    }

    // パスワードの最小文字数をチェック
    if (password.length < 6) {
        showAlert('パスワードは最低6文字である必要があります', 'danger');
        return;
    }

    // Save: add user to accounts array (simple user registry)
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    accounts.push({ role, name, email, password });
    localStorage.setItem('accounts', JSON.stringify(accounts));

    // 役割に応じて students / teachers 配列にも追加しておく
    if (role === 'student') {
        const students = JSON.parse(localStorage.getItem('students')) || [];
        students.push({ name, email, class: '' });
        localStorage.setItem('students', JSON.stringify(students));
    } else if (role === 'teacher') {
        const teachers = JSON.parse(localStorage.getItem('teachers')) || [];
        teachers.push({ name, email, subject: '' });
        localStorage.setItem('teachers', JSON.stringify(teachers));
    }

    // サインアップ後は管理者のまま（ログインを切り替えない）
    showAlert('新しいアカウントが作成されました（管理者として保持しています）', 'success');

    // フォームをクリアしてサインアップフォームを閉じる
    document.getElementById('signupRole').value = '';
    document.getElementById('fullName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.querySelectorAll('#signupForm .role-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';

    // optionally, let other tabs know accounts changed
    document.dispatchEvent(new CustomEvent('accountsUpdated'));
}