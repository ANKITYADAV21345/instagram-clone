// DEPLOY STEP: Replace YOUR_RENDER_URL with your actual Render backend URL
// Example: https://instagram-clone-api.onrender.com
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? '' 
    : 'https://YOUR_RENDER_URL.onrender.com';

let posts = [];
let likedPostIds = new Set(JSON.parse(localStorage.getItem('likedPosts') || '[]'));
let currentUser = null;

// =================== AUTH CHECK ===================
async function checkAuthAndLoadUser() {
    // First try localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateUserUI();
    }

    // Verify with server via cookie
    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            updateUserUI();
        } else {
            // Not authenticated, redirect to auth page
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            window.location.href = '/auth.html';
        }
    } catch (error) {
        // If server is down but we have saved user, stay on page
        if (!savedUser) {
            window.location.href = '/auth.html';
        }
    }
}

// Update all UI elements with logged-in user data
function updateUserUI() {
    if (!currentUser) return;

    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${currentUser.username}`;

    // Sidebar profile pic
    const sidebarPic = document.getElementById('sidebar-profile-pic');
    if (sidebarPic) sidebarPic.src = avatarUrl;

    // Right sidebar profile card
    const profileAvatar = document.getElementById('profile-card-avatar');
    const profileUsername = document.getElementById('profile-card-username');
    const profileEmail = document.getElementById('profile-card-email');
    if (profileAvatar) profileAvatar.src = avatarUrl;
    if (profileUsername) profileUsername.textContent = currentUser.username;
    if (profileEmail) profileEmail.textContent = currentUser.email;

    // Create post modal user info
    const modalAvatar = document.getElementById('modal-user-avatar');
    const modalName = document.getElementById('modal-user-name');
    if (modalAvatar) modalAvatar.src = avatarUrl;
    if (modalName) modalName.textContent = currentUser.username;
}

// =================== LOGOUT ===================
async function handleLogout(e) {
    if (e) e.preventDefault();
    try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        // Even if server is down, clear local data
    }
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/auth.html';
}

// Theme Selection Setup
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('theme') || 'dark';

if (savedTheme === 'light') {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
} else {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
}

// Initializing Lucide icons
lucide.createIcons();

// --- THEME SWITCHER LOGIC ---
themeToggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (document.body.classList.contains('dark-theme')) {
        document.body.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.body.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('theme', 'dark');
    }
});

// --- NAVIGATION & VIEWS ---
const navCreate = document.getElementById('nav-create');
const btnEmptyCreate = document.getElementById('btn-empty-create');
const modalOverlay = document.getElementById('create-post-modal');
const modalContent = modalOverlay.querySelector('.modal-content');
const modalClose = document.getElementById('modal-close');

// Open Upload Modal
function openCreateModal() {
    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // prevent feed scrolling
}

// Close Upload Modal
function closeCreateModal() {
    modalOverlay.classList.add('hidden');
    modalContent.classList.remove('expanded');
    document.body.style.overflow = '';
    resetUploadForm();
}

navCreate.addEventListener('click', (e) => {
    e.preventDefault();
    openCreateModal();
});

btnEmptyCreate.addEventListener('click', openCreateModal);
modalClose.addEventListener('click', closeCreateModal);

// Logout handlers
const navLogout = document.getElementById('nav-logout');
const btnLogoutSidebar = document.getElementById('btn-logout-sidebar');
if (navLogout) navLogout.addEventListener('click', handleLogout);
if (btnLogoutSidebar) btnLogoutSidebar.addEventListener('click', handleLogout);

// Close on clicking overlay background
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeCreateModal();
    }
});

// --- FILE UPLOAD & PREVIEW LOGIC ---
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const btnSelectFile = document.getElementById('btn-select-file');
const postDetails = document.getElementById('post-details');
const imagePreview = document.getElementById('image-preview');
const btnChangeImage = document.getElementById('btn-change-image');
const captionInput = document.getElementById('caption-input');
const createPostForm = document.getElementById('create-post-form');
const btnSubmitPost = document.getElementById('btn-submit-post');
const submitSpinner = document.getElementById('submit-spinner');

// Handle click trigger for select
btnSelectFile.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('click', (e) => {
    if (e.target !== btnSelectFile) {
        fileInput.click();
    }
});

// Drag & Drop event handlers
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

// File input change handler
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        handleFileSelect(fileInput.files[0]);
    }
});

btnChangeImage.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

// Handle loaded file to preview state
function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file', 'error');
        return;
    }
    
    // Set file input files (for drag and drop compatibility)
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        uploadZone.classList.add('hidden');
        postDetails.classList.remove('hidden');
        modalContent.classList.add('expanded');
    };
    reader.readAsDataURL(file);
}

// Reset form elements to upload state
function resetUploadForm() {
    createPostForm.reset();
    uploadZone.classList.remove('hidden');
    postDetails.classList.add('hidden');
    imagePreview.src = '';
    submitSpinner.classList.add('hidden');
    btnSubmitPost.disabled = false;
}

// --- API WORK: FETCH & POST ---

// Fetch Feed Posts
async function fetchPosts() {
    const loadingEl = document.getElementById('feed-loading');
    const emptyEl = document.getElementById('feed-empty');
    const postsContainer = document.getElementById('posts-container');
    
    loadingEl.classList.remove('hidden');
    emptyEl.classList.add('hidden');
    postsContainer.innerHTML = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        
        const data = await response.json();
        posts = data.posts || [];
        
        loadingEl.classList.add('hidden');
        
        if (posts.length === 0) {
            emptyEl.classList.remove('hidden');
        } else {
            // Sort posts by database insertion ID order (latest first if standard Mongo IDs)
            // Since MongoDB ObjectIDs contain timestamp, we can reverse the list to show new first
            posts.reverse().forEach(post => {
                const postElement = renderPostCard(post);
                postsContainer.appendChild(postElement);
            });
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error:', error);
        loadingEl.classList.add('hidden');
        showToast('Unable to connect to the backend. Is server running?', 'error');
    }
}

// Submit Create Post Form
createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (fileInput.files.length === 0) {
        showToast('Please select an image', 'error');
        return;
    }
    
    const formData = new FormData(createPostForm);
    
    btnSubmitPost.disabled = true;
    submitSpinner.classList.remove('hidden');
    
    try {
        const response = await fetch(`${API_BASE_URL}/create-post`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showToast('Post shared successfully!', 'success');
            closeCreateModal();
            fetchPosts(); // Refresh feed
        } else {
            throw new Error(data.error || 'Failed to upload post');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showToast(error.message || 'Error uploading post', 'error');
        btnSubmitPost.disabled = false;
        submitSpinner.classList.add('hidden');
    }
});

// --- RENDER POST HELPER ---
// Helper to generate consistent pseudo-random data based on post ID
function getDeterministicProfile(postId) {
    const names = ['creative_pixel', 'stellar_coder', 'zen_developer', 'design_flow', 'code_hacks', 'alpha_build', 'byte_core', 'stack_magic', 'node_master'];
    const hashes = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Grace', 'Ivy', 'Leo', 'Mia'];
    
    // Quick simple hash function
    let hashVal = 0;
    for (let i = 0; i < postId.length; i++) {
        hashVal = (hashVal << 5) - hashVal + postId.charCodeAt(i);
        hashVal |= 0; 
    }
    
    const index = Math.abs(hashVal) % names.length;
    const hoursAgo = (Math.abs(hashVal) % 20) + 1;
    const likesCount = Math.abs(hashVal * 7) % 500 + 42;
    
    return {
        username: names[index],
        avatarSeed: hashes[index],
        timeAgo: hoursAgo > 12 ? '1 day ago' : `${hoursAgo}h ago`,
        likes: likesCount
    };
}

// Build standard Post Card DOM Element
function renderPostCard(post) {
    const profile = getDeterministicProfile(post._id || Math.random().toString());
    const isLiked = likedPostIds.has(post._id);
    
    const card = document.createElement('article');
    card.className = 'post-card';
    
    // Parse caption for hashtags
    const formattedCaption = parseCaption(post.caption || '');
    
    card.innerHTML = `
        <div class="post-header">
            <div class="post-user-info">
                <img class="post-avatar" src="https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.avatarSeed}" alt="User Avatar">
                <div>
                    <span class="post-username">${profile.username}</span>
                </div>
            </div>
            <button class="btn-more-options">
                <i data-lucide="more-horizontal"></i>
            </button>
        </div>
        
        <div class="post-image-container">
            <img src="${post.image}" alt="Post Image" loading="lazy">
            <div class="double-click-heart">
                <i data-lucide="heart"></i>
            </div>
        </div>
        
        <div class="post-actions">
            <div class="post-actions-left">
                <button class="action-btn heart-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
                    <i data-lucide="heart"></i>
                </button>
                <button class="action-btn">
                    <i data-lucide="message-circle"></i>
                </button>
                <button class="action-btn">
                    <i data-lucide="send"></i>
                </button>
            </div>
            <button class="action-btn">
                <i data-lucide="bookmark"></i>
            </button>
        </div>
        
        <div class="post-details-area">
            <span class="likes-count"><span class="count">${profile.likes + (isLiked ? 1 : 0)}</span> likes</span>
            <div class="post-caption">
                <span class="caption-username">${profile.username}</span>
                <span class="caption-text">${formattedCaption}</span>
            </div>
            <span class="post-time">${profile.timeAgo}</span>
        </div>
    `;
    
    // Add double-click functionality to post image
    const imgContainer = card.querySelector('.post-image-container');
    const heartPop = card.querySelector('.double-click-heart');
    const heartBtn = card.querySelector('.heart-btn');
    
    let lastTap = 0;
    imgContainer.addEventListener('click', (e) => {
        const now = Date.now();
        if (now - lastTap < 300) { // Double tap detect
            // Trigger animation
            heartPop.classList.remove('animate-heart-pop');
            void heartPop.offsetWidth; // Trigger reflow to restart animation
            heartPop.classList.add('animate-heart-pop');
            
            // Like post
            if (!likedPostIds.has(post._id)) {
                toggleLike(post._id, heartBtn, card.querySelector('.count'));
            }
        }
        lastTap = now;
    });
    
    // Like button click handler
    heartBtn.addEventListener('click', () => {
        toggleLike(post._id, heartBtn, card.querySelector('.count'));
    });
    
    return card;
}

// Parse caption formatting (highlight hashtags)
function parseCaption(text) {
    return text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

// Like/Unlike Toggle action
function toggleLike(postId, button, countSpan) {
    const isLiked = likedPostIds.has(postId);
    const count = parseInt(countSpan.textContent);
    
    if (isLiked) {
        likedPostIds.delete(postId);
        button.classList.remove('liked');
        countSpan.textContent = count - 1;
        
        // Recreate normal heart outline icon
        button.innerHTML = '<i data-lucide="heart"></i>';
    } else {
        likedPostIds.add(postId);
        button.classList.add('liked');
        countSpan.textContent = count + 1;
        
        // Recreate filled heart icon
        button.innerHTML = '<i data-lucide="heart" fill="var(--like-active)"></i>';
    }
    
    // Refresh lucide icons for changed heart
    lucide.createIcons();
    
    // Save to local storage
    localStorage.setItem('likedPosts', JSON.stringify(Array.from(likedPostIds)));
}

// --- TOAST ALERTS HELPER ---
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconName = 'info';
    if (type === 'success') iconName = 'check-circle';
    if (type === 'error') iconName = 'alert-triangle';
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i data-lucide="${iconName}"></i>
        </div>
        <div class="toast-msg">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    lucide.createIcons();
    
    // Slide out after 3.5s
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

// Run on Load - Check auth then fetch posts
window.addEventListener('DOMContentLoaded', () => {
    checkAuthAndLoadUser();
    fetchPosts();
});
