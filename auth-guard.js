// Client-side Authentication Guard
import { 
  getCurrentUserRole, 
  getCachedUserRole,
  clearCachedUser,
  verifyAdminAccess,
  verifyStudentAccess
} from './utils/auth-helper.js';

// Guard configuration
const GUARD_CONFIG = {
  adminPages: [
    'admin-dashboard.html',
    'admin-exam-manager.html',
    'admin-questions-manager.html'
  ],
  studentPages: [
    'student-dashboard.html',
    'student-exams.html',
    'exam-viewer.html'
  ],
  publicPages: [
    'index.html',
    'admin-login.html',
    'student-login.html',
    'register.html',
    'login.html'
  ]
};

// Main guard function - call this on page load
export async function checkAuthGuard() {
  const currentPage = getCurrentPageName();
  
  // If page doesn't require authentication, allow access
  if (GUARD_CONFIG.publicPages.includes(currentPage)) {
    return true;
  }

  // Wait for Firebase to restore the session before deciding.
  const userRole = await getCurrentUserRole();
  if (!userRole) {
    clearCachedUser();
    redirectToLogin();
    return false;
  }

  // Check role-based access
  if (GUARD_CONFIG.adminPages.includes(currentPage)) {
    if (userRole !== 'admin') {
      redirectToUnauthorized();
      return false;
    }
  } else if (GUARD_CONFIG.studentPages.includes(currentPage)) {
    if (userRole !== 'student') {
      redirectToUnauthorized();
      return false;
    }
  }

  return true;
}

// Get current page name from URL
function getCurrentPageName() {
  const pathname = window.location.pathname;
  return pathname.split('/').pop() || 'index.html';
}

// Redirect to appropriate login page
function redirectToLogin() {
  const currentPage = getCurrentPageName();
  
  if (GUARD_CONFIG.adminPages.includes(currentPage)) {
    window.location.href = '/admin-login.html';
  } else if (GUARD_CONFIG.studentPages.includes(currentPage)) {
    window.location.href = '/student-login.html';
  } else {
    window.location.href = '/login.html';
  }
}

// Redirect to unauthorized page
function redirectToUnauthorized() {
  const cachedRole = getCachedUserRole();
  
  if (cachedRole === 'admin') {
    window.location.href = '/admin-dashboard.html';
  } else if (cachedRole === 'student') {
    window.location.href = '/student-dashboard.html';
  } else {
    window.location.href = '/login.html';
  }
}

// Guard page with specific role requirement
export async function requireRole(role) {
  const userRole = getCachedUserRole() || await getCurrentUserRole();
  
  if (userRole !== role) {
    redirectToUnauthorized();
    return false;
  }
  return true;
}

export { verifyAdminAccess, verifyStudentAccess };

// Show loading state while checking auth
export function showAuthGuardLoading() {
  const loader = document.createElement('div');
  loader.id = 'auth-guard-loader';
  loader.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    ">
      <div style="
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;
  document.body.appendChild(loader);
}

// Hide loading state
export function hideAuthGuardLoading() {
  const loader = document.getElementById('auth-guard-loader');
  if (loader) {
    loader.remove();
  }
}

// Initialize auth guard (call on page load)
export async function initAuthGuard() {
  showAuthGuardLoading();
  
  try {
    const hasAccess = await checkAuthGuard();
    hideAuthGuardLoading();
    return hasAccess;
  } catch (error) {
    console.error('Auth guard error:', error);
    hideAuthGuardLoading();
    redirectToLogin();
    return false;
  }
}

export default {
  checkAuthGuard,
  requireRole,
  verifyAdminAccess,
  verifyStudentAccess,
  showAuthGuardLoading,
  hideAuthGuardLoading,
  initAuthGuard
};
