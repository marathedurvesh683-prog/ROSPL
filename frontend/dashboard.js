const API_URL = 'http://localhost:3000';
let currentUser = null;
let subjects = [];
let students = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('Dashboard loading...');
  
  // Check auth first - if not authenticated, redirect
  checkAuthentication().then(isAuthenticated => {
    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      window.location.href = 'login.html';
      return;
    }
    
    console.log('User is authenticated, loading dashboard');
    setupTabListeners();
    loadUserInfo();
    loadSubjects();
    loadStudents();
  });
});

// ===== AUTHENTICATION =====
async function checkAuthentication() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('Not authenticated (status: ' + response.status + ')');
      return false;
    }

    const data = await response.json();
    console.log('Authenticated as:', data.teacher.name);
    currentUser = data.teacher;
    return true;

  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

async function handleLogout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'GET',
      credentials: 'include'
    });
    window.location.href = 'login.html';
  } catch (error) {
    showSnackbar('Logout failed', 'error');
  }
}

// ===== USER INFO =====
async function loadUserInfo() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch user info');

    const data = await response.json();
    const user = data.teacher;

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;
    if (user.picture) {
      document.getElementById('userPic').src = user.picture;
    }
  } catch (error) {
    console.error('Failed to load user info:', error);
  }
}

// ===== TABS =====
function setupTabListeners() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  document.getElementById(`${tabName}-tab`).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  if (tabName === 'upload') {
    loadUploadStudents();
  }
}

// ===== SUBJECTS =====
async function loadSubjects() {
  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/api/subjects`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch subjects');

    const data = await response.json();
    subjects = data.subjects || [];

    updateSubjectDropdowns();
    displaySubjects();
  } catch (error) {
    console.error('Failed to load subjects:', error);
    showSnackbar('Failed to load subjects', 'error');
  } finally {
    showLoading(false);
  }
}

function updateSubjectDropdowns() {
  const selects = [
    document.getElementById('studentSubject'),
    document.getElementById('uploadSubject')
  ];

  selects.forEach(select => {
    if (!select) return;
    
    const current = select.value;
    select.innerHTML = '<option value="">Select subject</option>';
    
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.subjectName;
      option.textContent = subject.subjectName;
      select.appendChild(option);
    });
    
    select.value = current;
  });
}

function displaySubjects() {
  const container = document.getElementById('subjectsList');
  if (subjects.length === 0) {
    container.innerHTML = '<p class="empty-state">No subjects yet. Add one to get started!</p>';
    return;
  }

  container.innerHTML = subjects.map(subject => `
    <div class="subject-card">
      <div class="subject-name">${subject.subjectName}</div>
      <div class="subject-meta">
        <div class="meta-item">
          <span class="meta-label">Year:</span> ${subject.academicYear || 'N/A'}
        </div>
        <div class="meta-item">
          <span class="meta-label">Sem:</span> ${subject.semester || 'N/A'}
        </div>
      </div>
    </div>
  `).join('');
}

function showAddSubjectForm() {
  document.getElementById('addSubjectForm').classList.remove('hidden');
}

function hideAddSubjectForm() {
  document.getElementById('addSubjectForm').classList.add('hidden');
  document.getElementById('addSubjectForm').reset();
}

async function handleAddSubject(event) {
  event.preventDefault();

  const formData = {
    subjectName: document.getElementById('subjectName').value,
    academicYear: document.getElementById('academicYear').value,
    semester: document.getElementById('semester').value
  };

  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/api/subjects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to add subject');

    showSnackbar('Subject added successfully!', 'success');
    hideAddSubjectForm();
    loadSubjects();
  } catch (error) {
    console.error('Error adding subject:', error);
    showSnackbar('Failed to add subject', 'error');
  } finally {
    showLoading(false);
  }
}

// ===== STUDENTS =====
async function loadStudents() {
  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/api/students`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch students');

    const data = await response.json();
    students = data.students || [];

    displayStudents();
  } catch (error) {
    console.error('Failed to load students:', error);
    showSnackbar('Failed to load students', 'error');
  } finally {
    showLoading(false);
  }
}

function displayStudents() {
  const container = document.getElementById('studentsList');
  if (students.length === 0) {
    container.innerHTML = '<p class="empty-state">No students yet. Add one to get started!</p>';
    return;
  }

  container.innerHTML = students.map(student => `
    <div class="student-card">
      <div class="student-header">
        <div class="student-name">${student.name}</div>
        <div class="status-badge ${student.googleDriveConnected ? 'status-authorized' : 'status-pending'}">
          ${student.googleDriveConnected ? '✓ Authorized' : '⏳ Pending'}
        </div>
      </div>
      <div class="student-email">${student.email}</div>
      <div class="student-subject">${student.subjectName}</div>
      <div class="student-actions">
        ${!student.googleDriveConnected ? `
          <button class="btn-resend" onclick="resendAuthEmail('${student._id}')">Resend Link</button>
        ` : ''}
        <button class="btn-remove" onclick="removeStudent('${student._id}')">Remove</button>
      </div>
    </div>
  `).join('');
}

function showAddStudentForm() {
  document.getElementById('addStudentForm').classList.remove('hidden');
}

function hideAddStudentForm() {
  document.getElementById('addStudentForm').classList.add('hidden');
  document.getElementById('addStudentForm').reset();
}

async function handleAddStudent(event) {
  event.preventDefault();

  const formData = {
    name: document.getElementById('studentName').value,
    email: document.getElementById('studentEmail').value,
    subjectName: document.getElementById('studentSubject').value
  };

  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/api/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Failed to add student');

    showSnackbar('Student added successfully!', 'success');
    hideAddStudentForm();
    loadStudents();
  } catch (error) {
    console.error('Error adding student:', error);
    showSnackbar(error.message || 'Failed to add student', 'error');
  } finally {
    showLoading(false);
  }
}

async function removeStudent(studentId) {
  if (!confirm('Are you sure you want to remove this student?')) return;

  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/api/students/${studentId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to remove student');

    showSnackbar('Student removed successfully!', 'success');
    loadStudents();
  } catch (error) {
    console.error('Error removing student:', error);
    showSnackbar('Failed to remove student', 'error');
  } finally {
    showLoading(false);
  }
}

async function resendAuthEmail(studentId) {
  try {
    showLoading(true);
    const response = await fetch(`${API_URL}/api/students/resend-auth/${studentId}`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Failed to resend email');

    showSnackbar('Authorization link sent!', 'success');
  } catch (error) {
    console.error('Error resending email:', error);
    showSnackbar('Failed to resend email', 'error');
  } finally {
    showLoading(false);
  }
}

// ===== FILE UPLOAD =====
async function loadUploadStudents() {
  try {
    const response = await fetch(`${API_URL}/api/students`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch students');

    const data = await response.json();
    const authorizedStudents = data.students.filter(s => s.googleDriveConnected);

    const checkboxContainer = document.getElementById('studentCheckboxes');
    if (authorizedStudents.length === 0) {
      checkboxContainer.innerHTML = '<p class="empty-state">No authorized students yet</p>';
      return;
    }

    checkboxContainer.innerHTML = authorizedStudents.map(student => `
      <div class="checkbox-item">
        <input type="checkbox" id="student_${student._id}" value="${student._id}">
        <label for="student_${student._id}">${student.name}</label>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load upload students:', error);
  }
}

function updateFileName() {
  const input = document.getElementById('fileInput');
  const label = document.getElementById('fileName');
  label.textContent = input.files[0] ? input.files[0].name : 'Choose a file...';
}

async function handleFileUpload(event) {
  event.preventDefault();

  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) {
    showSnackbar('Please select a file', 'error');
    return;
  }

  const subjectName = document.getElementById('uploadSubject').value;
  const documentType = document.getElementById('documentType').value;
  
  const studentCheckboxes = document.querySelectorAll('#studentCheckboxes input:checked');
  const studentIds = Array.from(studentCheckboxes).map(cb => cb.value);

  if (studentIds.length === 0) {
    showSnackbar('Please select at least one student', 'error');
    return;
  }

  try {
    showLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subjectName', subjectName);
    formData.append('documentType', documentType);
    formData.append('studentIds', JSON.stringify(studentIds));

    const response = await fetch(`${API_URL}/api/upload/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Upload failed');

    displayUploadResults(data);
    document.getElementById('uploadForm').reset();
    document.getElementById('fileName').textContent = 'Choose a file...';
    showSnackbar('Upload completed!', 'success');
  } catch (error) {
    console.error('Upload error:', error);
    showSnackbar(error.message || 'Upload failed', 'error');
  } finally {
    showLoading(false);
  }
}

function displayUploadResults(data) {
  const resultsDiv = document.getElementById('uploadResults');
  resultsDiv.classList.remove('hidden');

  const successResults = data.results.filter(r => r.status === 'success');
  const failedResults = data.results.filter(r => r.status === 'failed');

  let html = `<h3>Upload Results: ${data.successCount}/${data.totalStudents} Success</h3>`;

  successResults.forEach(result => {
    html += `
      <div class="result-item result-success">
        <span class="result-icon">✓</span>
        <span>${result.studentName} - Success</span>
      </div>
    `;
  });

  failedResults.forEach(result => {
    html += `
      <div class="result-item result-failed">
        <span class="result-icon">✗</span>
        <span>${result.studentName} - ${result.error || 'Failed'}</span>
      </div>
    `;
  });

  resultsDiv.innerHTML = html;
}

// ===== UTILITIES =====
function showSnackbar(message, type = 'info') {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = `show ${type}`;
  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

function showLoading(show) {
  const overlay = document.getElementById('loadingOverlay');
  if (show) {
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}
