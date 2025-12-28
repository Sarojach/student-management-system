// Role check:  only users with the correct role can access role-specific pages
(function () {
    
    const pageRoleMap = {
        'admin.html': 'admin',
        'teacher.html': 'teacher',
        'student.html': 'student'
    };

    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const requiredRole = pageRoleMap[filename];

  
    if (!requiredRole) return;

    // helper functions from helper.js
    function safeIsAuth() {
        try { return typeof isUserAuthenticated === 'function' ? isUserAuthenticated() : false; } catch (e) { return false; }
    }
    function safeGetRole() {
        try { return typeof getUserRole === 'function' ? getUserRole() : localStorage.getItem('userRole'); } catch (e) { return localStorage.getItem('userRole'); }
    }
    function safeGetEmail() {
        try { return typeof getUserEmail === 'function' ? getUserEmail() : localStorage.getItem('userEmail'); } catch (e) { return localStorage.getItem('userEmail'); }
    }

    // redirect to login if not authenticated
    if (!safeIsAuth()) {
        window.location.href = '../index.html';
        return;
    }

    const role = safeGetRole();

    // if role doesn't match required role, redirect to user's correct dashboard
    if (role !== requiredRole) {
        const redirectMap = {
            'admin': 'admin.html',
            'teacher': 'teacher.html',
            'student': 'student.html'
        };
        const dest = redirectMap[role] ? ('../pages/' + redirectMap[role]) : '../index.html';
        window.location.href = dest;
        return;
    }

    const name = localStorage.getItem('userName') || safeGetEmail() || '';
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = name;
})();
