// ==================== PAGE ROUTING ====================
let teacherToken = localStorage.getItem('teacherToken') || null;
let teacherUsername = localStorage.getItem('teacherUsername') || null;


function getAuthHeaders() {
  if (!teacherToken) {
    return {};
  }

  return {
    'X-Teacher-Token': teacherToken
  };
}


function showMessage(element, text, type) {
  element.textContent = text;
  element.className = `message ${type}`;
  element.classList.remove('hidden');
}


function updateAuthUI() {
  const authStatus = document.getElementById('auth-status');
  const openLoginBtn = document.getElementById('open-login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const gateMessage = document.getElementById('teacher-gate-message');
  const signupButton = document.querySelector('#signup-form button[type="submit"]');

  if (teacherToken && teacherUsername) {
    authStatus.textContent = `Teacher: ${teacherUsername}`;
    openLoginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    gateMessage.classList.add('hidden');
    signupButton.disabled = false;
  } else {
    authStatus.textContent = 'Student view';
    openLoginBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    gateMessage.classList.remove('hidden');
    signupButton.disabled = true;
  }
}


class AppRouter {
  constructor() {
    this.currentPage = 'home';
    this.init();
  }

  init() {
    // Handle navigation link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigateTo(page);
      });
    });

    // Handle browser back/forward
    window.addEventListener('hashchange', () => {
      this.handleHashChange();
    });

    // Initial page load
    this.handleHashChange();
  }

  handleHashChange() {
    const hash = window.location.hash.slice(1) || 'home';
    this.navigateTo(hash);
  }

  navigateTo(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Update navigation active state
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-page') === page) {
        link.classList.add('active');
      }
    });

    // Show selected page
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      window.location.hash = page;
      this.currentPage = page;

      // Initialize page-specific content
      this.initPageContent(page);
    }
  }

  initPageContent(page) {
    switch (page) {
      case 'clubs':
        loadActivities();
        break;
      case 'events':
        loadEvents();
        break;
      case 'gallery':
        loadGallery();
        break;
      case 'contact':
        loadContactInfo();
        break;
    }
  }
}

// ==================== ACTIVITIES MANAGEMENT ====================
async function loadActivities() {
  const activitiesList = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');

  try {
    const response = await fetch('/activities');
    const activities = await response.json();

    // Clear the list
    activitiesList.innerHTML = '';

    // Populate activities
    Object.entries(activities).forEach(([name, details]) => {
      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants (${details.participants.length}/${details.max_participants}):</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li>
                        <span class="participant-email">${email}</span>
                        <button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>
                      </li>`
                  )
                  .join('')}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      const activityCard = document.createElement('div');
      activityCard.className = 'activity-card';
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>📅 Schedule:</strong> ${details.schedule}</p>
        <p><strong>👥 Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add delete button listeners
      activityCard.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleUnregister);
      });
    });

    // Update select dropdown
    activitySelect.innerHTML = '<option value="">-- Select a club --</option>';
    Object.keys(activities).forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  } catch (error) {
    activitiesList.innerHTML = '<p>Failed to load activities. Please try again later.</p>';
    console.error('Error fetching activities:', error);
  }
}

async function handleUnregister(event) {
  event.preventDefault();
  const btn = event.target;
  const activity = btn.getAttribute('data-activity');
  const email = btn.getAttribute('data-email');
  const messageDiv = document.getElementById('signup-message');

  try {
    if (!teacherToken) {
      showMessage(messageDiv, 'Only logged-in teachers can unregister students.', 'error');
      return;
    }

    const response = await fetch(
      `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      }
    );

    const result = await response.json();

    if (response.ok) {
      showMessage(messageDiv, result.message, 'success');
      loadActivities();
    } else {
      if (response.status === 403) {
        clearTeacherSession();
      }
      showMessage(messageDiv, result.detail || 'An error occurred', 'error');
    }

    setTimeout(() => messageDiv.classList.add('hidden'), 5000);
  } catch (error) {
    console.error('Error unregistering:', error);
    showMessage(messageDiv, 'Failed to unregister. Please try again.', 'error');
  }
}

// ==================== EVENTS MANAGEMENT ====================
async function loadEvents() {
  const eventsList = document.getElementById('events-list');

  try {
    const response = await fetch('/events');
    const events = await response.json();

    eventsList.innerHTML = '';

    Object.entries(events).forEach(([name, details]) => {
      const categoryEmoji = {
        Festival: '🎉',
        Academic: '📚',
        Sports: '🏆',
        Entertainment: '🎬',
        Arts: '🎨'
      };

      const emoji = categoryEmoji[details.category] || '📌';

      const eventCard = document.createElement('div');
      eventCard.className = 'event-card';
      eventCard.innerHTML = `
        <div class="event-image">${emoji}</div>
        <div class="event-body">
          <div class="event-date">${details.date}</div>
          <h3>${name}</h3>
          <p>${details.description}</p>
          <div class="event-meta">
            <span>🕐 ${details.time}</span>
            <span>📍 ${details.location}</span>
          </div>
          <button class="event-card-btn" data-event="${name}">View Details</button>
        </div>
      `;

      eventCard.querySelector('.event-card-btn').addEventListener('click', () => {
        showEventModal(name, details);
      });

      eventsList.appendChild(eventCard);
    });
  } catch (error) {
    eventsList.innerHTML = '<p>Failed to load events. Please try again later.</p>';
    console.error('Error fetching events:', error);
  }
}

function showEventModal(eventName, details) {
  const modal = document.getElementById('event-modal');
  const modalBody = document.getElementById('modal-body');

  const categoryEmoji = {
    Festival: '🎉',
    Academic: '📚',
    Sports: '🏆',
    Entertainment: '🎬',
    Arts: '🎨'
  };

  const emoji = categoryEmoji[details.category] || '📌';

  modalBody.innerHTML = `
    <div style="text-align: center; font-size: 3em; margin-bottom: 15px;">${emoji}</div>
    <h2>${eventName}</h2>
    <p><strong>📅 Date:</strong> ${details.date}</p>
    <p><strong>🕐 Time:</strong> ${details.time}</p>
    <p><strong>📍 Location:</strong> ${details.location}</p>
    <p><strong>📂 Category:</strong> ${details.category}</p>
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
    <h3 style="margin-top: 20px;">About This Event</h3>
    <p>${details.details}</p>
  `;

  modal.classList.add('active');
}

// ==================== GALLERY MANAGEMENT ====================
async function loadGallery() {
  const galleryContainer = document.getElementById('gallery-container');

  try {
    const response = await fetch('/gallery');
    const gallery = await response.json();

    galleryContainer.innerHTML = '';

    gallery.items.forEach(item => {
      const categoryEmoji = {
        Clubs: '👥',
        Sports: '⚽',
        Arts: '🎨',
        Academic: '📚',
        Events: '🎉'
      };

      const emoji = categoryEmoji[item.category] || '📷';

      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      galleryItem.innerHTML = `
        <div class="gallery-image">${emoji}</div>
        <div class="gallery-info">
          <h4>${item.title}</h4>
          <p class="category">${item.category}</p>
          <p>${item.description}</p>
        </div>
      `;

      galleryContainer.appendChild(galleryItem);
    });
  } catch (error) {
    galleryContainer.innerHTML = '<p>Failed to load gallery. Please try again later.</p>';
    console.error('Error fetching gallery:', error);
  }
}

// ==================== CONTACT MANAGEMENT ====================
async function loadContactInfo() {
  try {
    const response = await fetch('/contact');
    const contact = await response.json();

    // Fill in contact information
    document.getElementById('contact-school-name').textContent = contact.school_name;
    document.getElementById('contact-address').textContent = contact.address;
    document.getElementById('contact-phone').innerHTML =
      `<a href="tel:${contact.phone}" style="color: var(--accent-color); text-decoration: none;">${contact.phone}</a>`;
    document.getElementById('contact-email').innerHTML =
      `<a href="mailto:${contact.email}" style="color: var(--accent-color); text-decoration: none;">${contact.email}</a>`;
    document.getElementById('contact-hours').textContent = contact.hours;
    document.getElementById('contact-principal-name').textContent = contact.principal;
    document.getElementById('contact-vp-name').textContent = contact.vice_principal;

    // Add social media links
    const socialLinks = document.getElementById('social-links');
    socialLinks.innerHTML = '';

    const platforms = {
      facebook: '👍',
      twitter: '🐦',
      instagram: '📸'
    };

    Object.entries(contact.social_media).forEach(([platform, url]) => {
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.className = 'social-link';
      link.title = platform.charAt(0).toUpperCase() + platform.slice(1);
      link.textContent = platforms[platform] || '🔗';
      socialLinks.appendChild(link);
    });
  } catch (error) {
    console.error('Error fetching contact info:', error);
  }
}


function clearTeacherSession() {
  teacherToken = null;
  teacherUsername = null;
  localStorage.removeItem('teacherToken');
  localStorage.removeItem('teacherUsername');
  updateAuthUI();
  loadActivities();
}


async function handleTeacherLogin(event) {
  event.preventDefault();
  const username = document.getElementById('teacher-username').value.trim();
  const password = document.getElementById('teacher-password').value;
  const authMessage = document.getElementById('auth-message');

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok) {
      showMessage(authMessage, result.detail || 'Login failed', 'error');
      return;
    }

    teacherToken = result.token;
    teacherUsername = result.username;
    localStorage.setItem('teacherToken', teacherToken);
    localStorage.setItem('teacherUsername', teacherUsername);
    updateAuthUI();
    loadActivities();

    showMessage(authMessage, result.message, 'success');
    setTimeout(() => {
      document.getElementById('auth-modal').classList.remove('active');
      authMessage.classList.add('hidden');
      document.getElementById('auth-form').reset();
    }, 800);
  } catch (error) {
    console.error('Error logging in:', error);
    showMessage(authMessage, 'Login failed. Please try again.', 'error');
  }
}


async function handleTeacherLogout() {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: getAuthHeaders()
    });
  } catch (error) {
    console.error('Error during logout:', error);
  } finally {
    clearTeacherSession();
  }
}

// ==================== FORM SUBMISSION ====================
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const messageDiv = document.getElementById('signup-message');
  const modal = document.getElementById('event-modal');
  const modalClose = document.querySelector('.modal-close');
  const userMenu = document.getElementById('user-menu');
  const userMenuToggle = document.getElementById('user-menu-toggle');
  const userDropdown = document.getElementById('user-dropdown');
  const openLoginBtn = document.getElementById('open-login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const authModal = document.getElementById('auth-modal');
  const authModalClose = document.querySelector('.auth-modal-close');
  const authForm = document.getElementById('auth-form');

  // Form submission
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const activity = document.getElementById('activity').value;

    if (!activity) {
      showMessage(messageDiv, 'Please select a club', 'error');
      return;
    }

    if (!teacherToken) {
      showMessage(messageDiv, 'Only logged-in teachers can register students.', 'error');
      return;
    }

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: 'POST',
          headers: getAuthHeaders()
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(messageDiv, result.message, 'success');
        signupForm.reset();
        loadActivities();
      } else {
        if (response.status === 403) {
          clearTeacherSession();
        }
        showMessage(messageDiv, result.detail || 'An error occurred', 'error');
      }

      setTimeout(() => messageDiv.classList.add('hidden'), 5000);
    } catch (error) {
      console.error('Error signing up:', error);
      showMessage(messageDiv, 'Failed to sign up. Please try again.', 'error');
    }
  });

  // User menu controls
  userMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      userDropdown.classList.add('hidden');
    }
  });

  openLoginBtn.addEventListener('click', () => {
    authModal.classList.add('active');
    userDropdown.classList.add('hidden');
  });

  logoutBtn.addEventListener('click', () => {
    userDropdown.classList.add('hidden');
    handleTeacherLogout();
  });

  authForm.addEventListener('submit', handleTeacherLogin);

  authModalClose.addEventListener('click', () => {
    authModal.classList.remove('active');
  });

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.remove('active');
    }
  });

  // Modal controls
  modalClose.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      modal.classList.remove('active');
    }

    if (e.key === 'Escape' && authModal.classList.contains('active')) {
      authModal.classList.remove('active');
    }
  });

  updateAuthUI();

  // Initialize router
  new AppRouter();
});
