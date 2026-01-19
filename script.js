// ===================================
// PUREHERBAL - MAIN JAVASCRIPT
// ===================================

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];
// Slideshow interval handle for feature images
let featureSlideshowInterval = null;

// Update cart count on page load
document.addEventListener('DOMContentLoaded', function() {
	updateCartCount();
	initMobileMenu();
	initSmoothScroll();
	initScrollAnimations();
	initFlowerAnimation();
	initFeatureSlideshow(); // restore automatic feature-image slideshow (2s default)
	initQuickView(); // initialize quick view modal wiring
});

// Debug helper: log when account page scripts run
document.addEventListener('DOMContentLoaded', function() {
	if (document.querySelector('.account-section')) {
		console.info('Account page: styles and scripts loaded. Current user:', getCurrentUser());
	}
});

// Automatic slideshow for the large feature image area
function initFeatureSlideshow(intervalSeconds = 2) {
	const container = document.querySelector('.feature-images-container');
	if (!container) return;
	const items = Array.from(container.querySelectorAll('.feature-image-item'));

	if (items.length >= 2) {
		let current = items.findIndex(it => it.classList.contains('active'));
		if (current === -1) current = 0;
		items.forEach((it, i) => it.classList.toggle('active', i === current));

		if (featureSlideshowInterval) clearInterval(featureSlideshowInterval);
		featureSlideshowInterval = setInterval(() => {
			items[current].classList.remove('active');
			current = (current + 1) % items.length;
			items[current].classList.add('active');
		}, intervalSeconds * 1000);
		return;
	}

	// If only a single .feature-image-item exists, swap its inner <img> src using a URL list
	const single = container.querySelector('.feature-image-item');
	const imgEl = single ? single.querySelector('img') : null;
	if (!imgEl) return;

	// default image list (previously used)
	const images = [
		'https://images.pexels.com/photos/5308631/pexels-photo-5308631.jpeg',
		'https://images.pexels.com/photos/5927889/pexels-photo-5927889.jpeg',
		'https://images.pexels.com/photos/8989973/pexels-photo-8989973.jpeg',
		'https://images.pexels.com/photos/7010956/pexels-photo-7010956.jpeg',
		'https://images.pexels.com/photos/7622597/pexels-photo-7622597.jpeg',
		'https://images.pexels.com/photos/6543634/pexels-photo-6543634.jpeg'
	];

	let currentIndex = images.indexOf(imgEl.src);
	if (currentIndex === -1) currentIndex = 0;

	if (featureSlideshowInterval) clearInterval(featureSlideshowInterval);
	featureSlideshowInterval = setInterval(() => {
		currentIndex = (currentIndex + 1) % images.length;
		// simple fade swap if styles allow
		imgEl.style.transition = 'opacity 0.5s ease';
		imgEl.style.opacity = '0';
		setTimeout(() => {
			imgEl.src = images[currentIndex];
			imgEl.style.opacity = '1';
		}, 500);
	}, intervalSeconds * 1000);
}

// ==========================
// CLIENT-SIDE AUTH (backend)
// - Uses backend API for authentication
// - Stores JWT token in localStorage
// - Exposes: registerUser, loginUser, logoutUser, getCurrentUser
// ==========================

const API_BASE = 'https://prakriti-care.onrender.com/api';
const AUTH_TOKEN_KEY = 'ph_token';
const AUTH_USER_KEY = 'ph_user';

async function hashPassword(password) {
	const enc = new TextEncoder();
	const data = enc.encode(password);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSavedUsers() {
	return JSON.parse(localStorage.getItem(AUTH_USERS_KEY) || '{}');
}

function saveUsers(users) {
	localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
}

function setCurrentUser(email) {
	if (email) localStorage.setItem(AUTH_CURRENT_KEY, email);
	else localStorage.removeItem(AUTH_CURRENT_KEY);
}

function getCurrentUser() {
	const user = localStorage.getItem(AUTH_USER_KEY);
	return user ? JSON.parse(user) : null;
}

async function registerUser({ name, email, password }) {
	const response = await fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, email, password })
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.message);
	localStorage.setItem(AUTH_TOKEN_KEY, data.token);
	localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
	return data.user;
}

async function loginUser({ email, password }) {
	const response = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	const data = await response.json();
	if (!response.ok) throw new Error(data.message);
	localStorage.setItem(AUTH_TOKEN_KEY, data.token);
	localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
	return data.user;
}

function logoutUser() {
	localStorage.removeItem(AUTH_TOKEN_KEY);
	localStorage.removeItem(AUTH_USER_KEY);
}

async function fetchProfile() {
	const token = localStorage.getItem(AUTH_TOKEN_KEY);
	if (!token) return null;
	const response = await fetch(`${API_BASE}/profile/profile`, {
		headers: { 'Authorization': `Bearer ${token}` }
	});
	if (!response.ok) return null;
	const data = await response.json();
	localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data));
	return data;
}

// Wire up account page forms and dashboard toggling
document.addEventListener('DOMContentLoaded', function() {
	try {
		const loginForm = document.querySelector('#login form');
		const registerForm = document.querySelector('#register form');
		const accountDashboard = document.getElementById('accountDashboard');
		const authForms = document.getElementById('authForms');
		const userNameDisplay = document.getElementById('userNameDisplay');
		const userEmailDisplay = document.getElementById('userEmailDisplay');
		const logoutLink = document.getElementById('logoutLink');

		// Auth tabs wiring (login / register)
		try {
			const authTabs = document.querySelectorAll('.auth-tab');
			authTabs.forEach(tab => {
				if (tab._authWired) return;
				tab._authWired = true;
				tab.addEventListener('click', function() {
					const tabName = this.dataset.tab;
					// toggle active class on tabs
					authTabs.forEach(t => t.classList.remove('active'));
					this.classList.add('active');
					// toggle content panels
					document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
					const panel = document.getElementById(tabName);
					if (panel) panel.classList.add('active');
				});
			});
		} catch (e) {
			// ignore if tabs not present
		}

		async function showDashboardFor(user) {
			if (!user) return;
			try {
				// Fetch full profile data
				const profile = await fetchProfile() || user;
				if (authForms) {
					authForms.style.display = 'none';
					authForms.setAttribute('aria-hidden', 'true');
				}
				// mark page as logged-in; CSS will reveal the dashboard when this class exists
				try { document.body.classList.add('logged-in'); } catch (e) {}
				if (accountDashboard) {
					accountDashboard.style.display = '';
					accountDashboard.setAttribute('aria-hidden', 'false');
				}
				if (userNameDisplay) userNameDisplay.textContent = `Welcome, ${profile.name || 'User'}!`;
				if (userEmailDisplay) userEmailDisplay.textContent = profile.email || '';
				// Update sidebar user name
				const sidebarUserName = document.getElementById('sidebarUserName');
				if (sidebarUserName) sidebarUserName.textContent = profile.name || 'User';
				// smooth scroll the dashboard into view for a clear transition
				setTimeout(() => {
					try {
						if (accountDashboard && accountDashboard.scrollIntoView) {
							accountDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
						}
					} catch (e) { /* ignore */ }
				}, 80);
			} catch (e) {
				console.error('Error showing dashboard', e);
			}
		}

		function showAuthForms() {
			if (authForms) {
				authForms.style.display = '';
				authForms.removeAttribute('aria-hidden');
			}
			// remove logged-in marker to hide dashboard via CSS
			try { document.body.classList.remove('logged-in'); } catch (e) {}
			if (accountDashboard) {
				accountDashboard.style.display = 'none';
				accountDashboard.setAttribute('aria-hidden', 'true');
			}
			// focus first input in the auth form to help accessibility
			setTimeout(() => {
				const firstInput = document.querySelector('#login input, #register input');
				if (firstInput) firstInput.focus();
				try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
			}, 40);
		}

		// If already logged in, show dashboard
		const current = getCurrentUser();
		if (current) showDashboardFor(current);

		if (loginForm) {
			loginForm.addEventListener('submit', async function(e) {
				e.preventDefault();
				const email = document.getElementById('loginEmail').value.trim();
				const password = document.getElementById('loginPassword').value;
				try {
					const user = await loginUser({ email, password });
					showNotification('Logged in successfully');
					showDashboardFor(user);
				} catch (err) {
					showNotification(err.message || 'Login failed', 'error');
				}
			});
		}

		if (registerForm) {
			registerForm.addEventListener('submit', async function(e) {
				e.preventDefault();
				const name = document.getElementById('registerName').value.trim();
				const email = document.getElementById('registerEmail').value.trim();
				const password = document.getElementById('registerPassword').value;
				const confirm = document.getElementById('registerConfirm').value;
				if (password !== confirm) {
					showNotification('Passwords do not match', 'error');
					return;
				}
				try {
					const user = await registerUser({ name, email, password });
					showNotification('Account created and logged in');
					showDashboardFor(user);
				} catch (err) {
					showNotification(err.message || 'Registration failed', 'error');
				}
			});
		}

		if (logoutLink) {
			logoutLink.addEventListener('click', function(e) {
				e.preventDefault();
				logoutUser();
				showNotification('Logged out');
				showAuthForms();
			});
		}

		// Rewards section toggle
		const rewardsToggle = document.querySelector('.rewards-toggle');
		if (rewardsToggle) {
			rewardsToggle.addEventListener('click', function() {
				const wellnessRewards = document.querySelector('.wellness-rewards');
				wellnessRewards.classList.toggle('expanded');
			});
		}
		// Accordion toggle functionality
		function toggleAccordion(target) {
			const items = document.querySelectorAll('.accordion-item');
			items.forEach(item => {
				if (item.dataset.target === target) {
					item.classList.toggle('active');
					const content = item.querySelector('.accordion-content');
					const toggle = item.querySelector('.accordion-toggle');
					if (item.classList.contains('active')) {
						content.style.display = 'block';
						toggle.textContent = '-';
					} else {
						content.style.display = 'none';
						toggle.textContent = '+';
					}
				} else {
					item.classList.remove('active');
					const content = item.querySelector('.accordion-content');
					const toggle = item.querySelector('.accordion-toggle');
					content.style.display = 'none';
					toggle.textContent = '+';
				}
			});
		}

		// Tab switching functionality
		function switchToTab(tabId) {
			const tabButtons = document.querySelectorAll('.tab-btn');
			const tabContents = document.querySelectorAll('.tab-content');
			tabButtons.forEach(btn => {
				btn.classList.remove('active');
				if (btn.getAttribute('data-tab') === tabId) {
					btn.classList.add('active');
				}
			});
			tabContents.forEach(content => {
				content.classList.remove('active');
				if (content.id === tabId) {
					content.classList.add('active');
				}
			});
		}

		// Dashboard panel switching via sidebar links
		const sidebarLinks = document.querySelectorAll('.dashboard-nav .dashboard-link[data-tab]');
		sidebarLinks.forEach(link => {
			link.addEventListener('click', function(e) {
				e.preventDefault();
				const tabId = this.dataset.tab;
				if (tabId) {
					switchToTab(tabId);
					sidebarLinks.forEach(l => l.classList.remove('active'));
					this.classList.add('active');
				}
			});
		});

		// Tab button clicks
		document.querySelectorAll('.tab-btn').forEach(button => {
			button.addEventListener('click', function() {
				const tabId = this.getAttribute('data-tab');
				switchToTab(tabId);
				// Update sidebar active
				sidebarLinks.forEach(l => l.classList.remove('active'));
				const correspondingLink = document.querySelector(`.dashboard-link[data-tab="${tabId}"]`);
				if (correspondingLink) correspondingLink.classList.add('active');
			});
		});

		// Accordion header click
		document.querySelectorAll('.accordion-header').forEach(header => {
			header.addEventListener('click', function() {
				const item = this.parentElement;
				const target = item.dataset.target;
				// Update sidebar active link
				sidebarLinks.forEach(l => l.classList.remove('active'));
				const correspondingLink = document.querySelector(`.dashboard-link[data-target="${target}"]`);
				if (correspondingLink) correspondingLink.classList.add('active');
				// toggle
				toggleAccordion(target);
			});
		});

		// Dashboard data rendering helpers
		function renderOrdersFor(user) {
			const ordersList = document.querySelector('.orders-list');
			if (!ordersList) return;
			if (!ordersList) return;
			ordersList.innerHTML = '';
			const orders = user.orders && user.orders.length ? user.orders : [];
			if (!orders.length) {
				ordersList.innerHTML = '<p>You have no orders yet. Your orders will appear here once you place them.</p>';
				return;
			}

			// Build an orders table
			const table = document.createElement('table');
			table.className = 'orders-table';
			table.innerHTML = `
				<thead>
					<tr>
						<th>Order</th>
						<th>Date</th>
						<th>Status</th>
						<th>Total</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody></tbody>
			`;
			const tbody = table.querySelector('tbody');

			orders.forEach(o => {
				const tr = document.createElement('tr');
				const total = (parseFloat(o.total) || 0).toFixed(2);
				tr.innerHTML = `
					<td><a href="#" class="order-id-link">#${o.id}</a></td>
					<td>${o.date || ''}</td>
					<td><span class="status-badge ${String(o.status || '').toLowerCase()}">${o.status || 'Pending'}</span></td>
					<td>$${total} for ${o.items || 1} item(s)</td>
					<td><button class="order-view-btn order-view-btn-js" data-order-id="${o.id}">View</button></td>
				`;
				tbody.appendChild(tr);
			});

			ordersList.appendChild(table);

			// Wire view buttons
			ordersList.querySelectorAll('.order-view-btn-js').forEach(btn => {
				btn.addEventListener('click', function() {
					const id = this.dataset.orderId;
					const order = orders.find(x => String(x.id) === String(id));
					openOrderModal(id, order || null);
				});
			});

			// attach view details handlers
			ordersList.querySelectorAll('.view-order').forEach(btn => {
				btn.addEventListener('click', function() {
					const id = this.dataset.orderId;
					openOrderModal(id, orders.find(x => x.id === id) || null);
				});
			});
		}

		function renderAddressesFor(user) {
			const list = document.querySelector('.addresses-list');
			if (!list) return;
			list.innerHTML = '';
			const addresses = user.addresses || [];
			if (!addresses.length) {
				list.innerHTML = '<p>No saved addresses yet.</p>';
				return;
			}
			addresses.forEach((a, idx) => {
				const card = document.createElement('div');
				card.className = 'address-card';
				card.innerHTML = `
					<p><strong>${a.label || 'Address ' + (idx+1)}</strong></p>
					<p>${a.line1}</p>
					<p>${a.city}, ${a.postcode}</p>
					<p>Phone: ${a.phone || ''}</p>
					<div class="address-actions">
						<button class="btn-secondary edit-address" data-index="${idx}">Edit</button>
						<button class="btn-secondary remove-address" data-index="${idx}">Remove</button>
					</div>
				`;
				list.appendChild(card);
			});

			list.querySelectorAll('.remove-address').forEach(btn => {
				btn.addEventListener('click', function() {
					const i = parseInt(this.dataset.index, 10);
					const users = getSavedUsers();
					const cur = getCurrentUser();
					if (!cur) return;
					const u = users[cur.email] || cur;
					u.addresses = (u.addresses || []).filter((_, idx) => idx !== i);
					users[cur.email] = u;
					saveUsers(users);
					showNotification('Address removed');
					renderAddressesFor(u);
				});
			});
		}

		function openOrderModal(id, order) {
			// create or update modal element
			let modal = document.getElementById('orderModal');
			if (!modal) {
				modal = document.createElement('div');
				modal.id = 'orderModal';
				modal.className = 'order-modal';
				modal.innerHTML = `
					<div class="order-modal-content">
						<button class="order-modal-close">×</button>
						<div class="order-modal-body"></div>
					</div>
				`;
				document.body.appendChild(modal);
				modal.querySelector('.order-modal-close').addEventListener('click', () => modal.remove());
			}
			const body = modal.querySelector('.order-modal-body');
			if (!order) body.innerHTML = `<p>Order ${id} details not found.</p>`;
			else body.innerHTML = `
				<h3>Order #${order.id}</h3>
				<p>Date: ${order.date}</p>
				<p>Items: ${order.items}</p>
				<p>Total: $${order.total.toFixed(2)}</p>
				<p>Status: ${order.status}</p>
			`;
			// show modal
			modal.style.display = 'flex';
		}

		// Address addition is handled via modal/delegated handlers (ensureAddressModal + delegated clicks)

		// Account details save handled later (single, consolidated handler below)

		// Render initial panels for current user
		const curUser = getCurrentUser();
		if (curUser) {
			renderOrdersFor(curUser);
			renderAddressesFor(curUser);
			// prefill account details
			const users = getSavedUsers();
			const u = users[curUser.email] || curUser;
			if (document.getElementById('accountName')) document.getElementById('accountName').value = u.name || '';
			if (document.getElementById('accountEmail')) document.getElementById('accountEmail').value = u.email || '';
			if (document.getElementById('sidebarUserName')) document.getElementById('sidebarUserName').textContent = u.name || '';
		}

		// Fill sidebar user name and payment placeholders
		const sidebarUserName = document.getElementById('sidebarUserName');
		const paymentWallet = document.getElementById('paymentWallet');
		const paymentGifts = document.getElementById('paymentGifts');
		const paymentPayLater = document.getElementById('paymentPayLater');
		if (current && sidebarUserName) sidebarUserName.textContent = current.name || current.email;
		// demo placeholders
		if (paymentWallet) paymentWallet.textContent = '₹304';
		if (paymentGifts) paymentGifts.textContent = '₹2000';
		if (paymentPayLater) paymentPayLater.textContent = '₹2000 / ₹5000';

		// Use modal-based address flows and render saved addresses (per-user)
		try {
			renderAddressesPanel();
		} catch (e) {
			// ignore if panel not present
		}

		// Account details save
		const accountDetailsForm = document.getElementById('accountDetailsForm');
		if (accountDetailsForm) {
			const accountName = document.getElementById('accountName');
			const accountEmail = document.getElementById('accountEmail');
			if (current) {
				if (accountName) accountName.value = current.name || '';
				if (accountEmail) accountEmail.value = current.email || '';
			}
			accountDetailsForm.addEventListener('submit', async function(ev) {
				ev.preventDefault();
				const cur = getCurrentUser();
				if (!cur) { showNotification('Not signed in', 'error'); return; }
				const newName = accountName.value.trim();
				const newPassword = document.getElementById('accountPassword').value;
				const token = localStorage.getItem(AUTH_TOKEN_KEY);
				try {
					// Update profile
					const updateData = { name: newName };
					if (newPassword) {
						await fetch(`${API_BASE}/profile/password`, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json',
								'Authorization': `Bearer ${token}`
							},
							body: JSON.stringify({ currentPassword: '', newPassword }) // Assuming no current password check for simplicity
						});
					}
					const response = await fetch(`${API_BASE}/profile/profile`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify(updateData)
					});
					if (!response.ok) throw new Error('Update failed');
					const updatedUser = await response.json();
					localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
					// Update UI
					if (userNameDisplay) userNameDisplay.textContent = `Welcome, ${updatedUser.name}!`;
					if (userEmailDisplay) userEmailDisplay.textContent = updatedUser.email;
					if (sidebarUserName) sidebarUserName.textContent = updatedUser.name;
					// give immediate feedback on the Save button
					const saveBtn = accountDetailsForm.querySelector('.btn-primary');
					if (saveBtn) {
						const origText = saveBtn.textContent;
						saveBtn.textContent = 'Saved';
						saveBtn.disabled = true;
						setTimeout(() => { saveBtn.textContent = origText; saveBtn.disabled = false; }, 1400);
					}
					showNotification('Account details updated');
				} catch (error) {
					showNotification('Error updating account', 'error');
				}
			});
		}
	} catch (err) {
		console.error('Auth wiring error', err);
	}
});

// Mobile Menu Toggle
function initMobileMenu() {
	const mobileMenuBtn = document.getElementById('mobileMenuBtn');
	const navMenu = document.getElementById('navMenu');
    
	if (mobileMenuBtn && navMenu) {
		mobileMenuBtn.addEventListener('click', function() {
			navMenu.classList.toggle('active');
			this.classList.toggle('active');
		});
        
		// Close menu when clicking on a link
		const navLinks = navMenu.querySelectorAll('.nav-link');
		navLinks.forEach(link => {
			link.addEventListener('click', function() {
				navMenu.classList.remove('active');
				mobileMenuBtn.classList.remove('active');
			});
		});
	}
    
	// Dropdown toggle for mobile
	const dropdowns = document.querySelectorAll('.dropdown');
	dropdowns.forEach(dropdown => {
		const link = dropdown.querySelector('.nav-link');
		if (link && window.innerWidth <= 768) {
			link.addEventListener('click', function(e) {
				e.preventDefault();
				dropdown.classList.toggle('active');
			});
		}
	});
}

// Smooth Scroll
function initSmoothScroll() {
	document.querySelectorAll('a[href^="#"]').forEach(anchor => {
		anchor.addEventListener('click', function(e) {
			const href = this.getAttribute('href');
			if (href !== '#' && document.querySelector(href)) {
				e.preventDefault();
				document.querySelector(href).scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}
		});
	});
}

// Scroll Animations
function initScrollAnimations() {
	const observerOptions = {
		threshold: 0.1,
		rootMargin: '0px 0px -100px 0px'
	};
    
	const observer = new IntersectionObserver(function(entries) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add('fade-in');
				observer.unobserve(entry.target);
			}
		});
	}, observerOptions);
    
	document.querySelectorAll('.product-card, .feature-card, .testimonial-card').forEach(el => {
		observer.observe(el);
	});
    
	// Bottle and Leaf Animation on Scroll
	const showcaseObserver = new IntersectionObserver(function(entries) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const bottle = entry.target.querySelector('.showcase-bottle');
				const leaf = entry.target.querySelector('.showcase-leaf');
				if (bottle) bottle.classList.add('animate');
				if (leaf) leaf.classList.add('animate');
				showcaseObserver.unobserve(entry.target);
			}
		});
	}, { threshold: 0.3 });
    
	const showcaseSection = document.querySelector('.product-showcase');
	if (showcaseSection) {
		showcaseObserver.observe(showcaseSection);
	}
    
	// Products Grid Animation - Appear one by one
	const productsObserver = new IntersectionObserver(function(entries) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				// (Slideshow removed) keep product card reveal below
                
				// Animate product cards
				const products = entry.target.querySelectorAll('.product-card-small');
				products.forEach((product, index) => {
					setTimeout(() => {
						product.classList.add('show');
					}, index * 200);
				});
				productsObserver.unobserve(entry.target);
			}
		});
	}, { threshold: 0.2 });
    
	const productsSection = document.querySelector('.products-section');
	if (productsSection) {
		productsObserver.observe(productsSection);
	}
    
	// Side Images Animation - Appear one by one
	const sideImagesObserver = new IntersectionObserver(function(entries) {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				const images = entry.target.querySelectorAll('.side-image-card');
				images.forEach((image, index) => {
					setTimeout(() => {
						image.classList.add('show');
					}, index * 300); // 300ms delay between each image
				});
				sideImagesObserver.unobserve(entry.target);
			}
		});
	}, { threshold: 0.2 });
    
	const sideImagesSection = document.querySelector('.side-images-section');
	if (sideImagesSection) {
		sideImagesObserver.observe(sideImagesSection);
	}
}

// Animated Flower on Scroll - Natural Flowing Pattern
function initFlowerAnimation() {
	const flower = document.querySelector('.floating-lavender');
	if (!flower) return;
    
	const sections = document.querySelectorAll('section');
    
	// Natural flow pattern: left → right → left (no stopping in center)
	const positions = [
		{ horizontal: 'left', value: '2%', rotate: -6 },          // Left side
		{ horizontal: 'right', value: '2%', rotate: 6 },          // Right side
		{ horizontal: 'left', value: '2%', rotate: -6 },          // Left side
		{ horizontal: 'right', value: '2%', rotate: 6 }           // Right side (cycle)
	];
    
	let ticking = false;
    
	function moveFlowerToSection() {
		const scrollPosition = window.scrollY + (window.innerHeight / 2);
        
		sections.forEach((section, index) => {
			const sectionTop = section.offsetTop;
			const sectionBottom = sectionTop + section.offsetHeight;
            
			if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
				// Get flow position for this section
				const positionIndex = index % positions.length;
				const position = positions[positionIndex];
                
				// Calculate smooth vertical position based on scroll progress
				const sectionProgress = (scrollPosition - sectionTop) / section.offsetHeight;
				const verticalOffset = sectionTop + (sectionProgress * section.offsetHeight * 0.4);
                
				// Apply vertical position
				flower.style.top = `${verticalOffset + 100}px`;
                
				// Reset horizontal positions
				flower.style.left = 'auto';
				flower.style.right = 'auto';
                
				// Apply horizontal position based on natural flow pattern
				if (position.horizontal === 'left') {
					flower.style.left = position.value;
					flower.style.right = 'auto';
					flower.style.transform = `rotate(${position.rotate}deg)`;
				} else if (position.horizontal === 'right') {
					flower.style.right = position.value;
					flower.style.left = 'auto';
					flower.style.transform = `rotate(${position.rotate}deg)`;
				}
			}
		});
        
		ticking = false;
	}
    
	// Smooth scroll tracking
	window.addEventListener('scroll', function() {
		if (!ticking) {
			window.requestAnimationFrame(moveFlowerToSection);
			ticking = true;
		}
	});
    
	// Initial position
	setTimeout(moveFlowerToSection, 100);
}

// Add to Cart
function addToCart(productName, price) {
	const numericPrice = parseFloat(price) || 0;
	const existingItem = cart.find(item => item.name === productName);

	if (existingItem) {
		// support both qty and quantity for compatibility
		if (typeof existingItem.quantity === 'number') existingItem.quantity += 1;
		else existingItem.quantity = (existingItem.quantity || existingItem.qty || 0) + 1;

		if (typeof existingItem.qty === 'number') existingItem.qty = existingItem.quantity;
		else existingItem.qty = existingItem.quantity;
	} else {
		const newItem = {
			name: productName,
			price: numericPrice,
			quantity: 1,
			qty: 1,
			id: Date.now()
		};
		cart.push(newItem);
	}

	localStorage.setItem('cart', JSON.stringify(cart));
	updateCartCount();
	showNotification(`${productName} added to cart!`);
}

// Update Cart Count
function updateCartCount() {
	const cartCount = document.querySelector('.cart-count');
	if (cartCount) {
		const totalItems = cart.reduce((sum, item) => {
			const qty = typeof item.quantity === 'number' ? item.quantity : (item.qty || 0);
			return sum + qty;
		}, 0);
		cartCount.textContent = totalItems;
	}
}

// Remove from Cart
function removeFromCart(itemId) {
	cart = cart.filter(item => item.id !== itemId);
	localStorage.setItem('cart', JSON.stringify(cart));
	updateCartCount();
	if (typeof renderCart === 'function') {
		renderCart();
	}
}

// Update Quantity
function updateQuantity(itemId, newQuantity) {
	const item = cart.find(item => item.id === itemId);
	if (item) {
		const qty = parseInt(newQuantity, 10) || 0;
		if (qty <= 0) {
			removeFromCart(itemId);
		} else {
			item.quantity = qty;
			item.qty = qty;
			localStorage.setItem('cart', JSON.stringify(cart));
			if (typeof renderCart === 'function') {
				renderCart();
			}
		}
	}
}

// Get Cart Total
function getCartTotal() {
	return cart.reduce((total, item) => {
		const price = parseFloat(item.price) || 0;
		const qty = typeof item.quantity === 'number' ? item.quantity : (item.qty || 0);
		return total + (price * qty);
	}, 0);
}

// Quick View modal wiring
function initQuickView() {
	let modal = document.getElementById('quickViewModal');
	// If the modal doesn't exist on the current page (e.g., products.html), create it dynamically
	if (!modal) {
		const template = `
		<div id="quickViewModal" class="quickview-modal" aria-hidden="true">
			<div class="quickview-backdrop" id="quickviewBackdrop"></div>
			<div class="quickview-panel" role="dialog" aria-modal="true" aria-labelledby="quickviewTitle">
				<button class="quickview-close" id="quickviewClose" aria-label="Close Quick view">✕</button>
				<div class="quickview-grid">
					<div class="quickview-image">
						<img id="quickviewImg" src="" alt="">
					</div>
					<div class="quickview-info">
						<h3 id="quickviewTitle">Product Title</h3>
						<div class="quickview-rating" id="quickviewRating">★★★★★</div>
						<p class="quickview-price" id="quickviewPrice">$0.00</p>
						<p class="quickview-desc" id="quickviewDesc">Product description...</p>
						<ul class="quickview-pros" id="quickviewPros"></ul>
						<div class="quickview-actions">
							<button class="btn btn-primary" id="quickviewAddToCart">Add to cart</button>
							<button class="btn btn-secondary" id="quickviewWishlist">Add to wishlist</button>
						</div>
						<div class="quickview-meta">
							<div class="quickview-sku">SKU: <span id="quickviewSKU">—</span></div>
							<div class="quickview-stock" id="quickviewStock">In stock</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		`;
		document.body.insertAdjacentHTML('beforeend', template);
		modal = document.getElementById('quickViewModal');
	}
	console.log('initQuickView: starting, modal found=', !!modal);
	const backdrop = document.getElementById('quickviewBackdrop');
	const closeBtn = document.getElementById('quickviewClose');
	const imgEl = document.getElementById('quickviewImg');
	const titleEl = document.getElementById('quickviewTitle');
	const ratingEl = document.getElementById('quickviewRating');
	const priceEl = document.getElementById('quickviewPrice');
	const descEl = document.getElementById('quickviewDesc');
	const prosEl = document.getElementById('quickviewPros');
	const skuEl = document.getElementById('quickviewSKU');
	const stockEl = document.getElementById('quickviewStock');
	const addToCartBtn = document.getElementById('quickviewAddToCart');
	const wishlistBtn = document.getElementById('quickviewWishlist');

	function openModalForProduct(data) {
		// populate fields safely
		if (imgEl) imgEl.src = data.img || data.image || '';
		if (imgEl) imgEl.alt = data.name || 'Product image';
		if (titleEl) titleEl.textContent = data.name || '';
		if (ratingEl) {
			const r = parseInt(data.rating, 10) || 0;
			ratingEl.textContent = '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
		}
		if (priceEl) priceEl.textContent = (typeof data.price !== 'undefined') ? ('$' + parseFloat(data.price).toFixed(2)) : '';
		if (descEl) descEl.textContent = data.desc || data.description || '';
		if (prosEl) {
			prosEl.innerHTML = '';
			const pros = (data.pros || data.features || '').toString().split(',').map(s => s.trim()).filter(Boolean);
			pros.forEach(p => {
				const li = document.createElement('li');
				li.textContent = p;
				prosEl.appendChild(li);
			});
		}
		if (skuEl) skuEl.textContent = data.sku || data.SKU || '—';
		if (stockEl) stockEl.textContent = data.stock || 'In stock';

		// attach add to cart action for this product
		if (addToCartBtn) {
			addToCartBtn.onclick = function() {
				addToCart(data.name || 'Product', data.price || 0);
				closeModal();
			};
		}
		if (wishlistBtn) {
			wishlistBtn.onclick = function() {
				showNotification((data.name || 'Product') + ' added to wishlist');
			};
		}

		modal.classList.add('open');
		modal.setAttribute('aria-hidden', 'false');
	}

	function closeModal() {
		modal.classList.remove('open');
		modal.setAttribute('aria-hidden', 'true');
	}

	// Close handlers
	if (backdrop) backdrop.addEventListener('click', closeModal);
	if (closeBtn) closeBtn.addEventListener('click', closeModal);
	document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });

	// Wire quick view buttons (direct) and a delegated fallback in case buttons are added later
	const wireButton = (btn) => {
		if (!btn) return;
		btn.addEventListener('click', function(e) {
			e.preventDefault();
			console.log('quick-view clicked', this);
			// find closest product card and read data- attributes and image
			const card = this.closest('.product-card-small');
			const cardAlt = this.closest('.product-card') || card;
			console.log('quick-view cardAlt=', cardAlt);
			if (!cardAlt) return;
			const data = {};
			// copy dataset
			const ds = cardAlt.dataset || {};
			Object.keys(ds).forEach(k => { data[k] = ds[k]; });
			// fallback: try to read visible img inside
			const img = cardAlt.querySelector('img');
			if (img) data.img = img.src;
			// ensure numeric price
			if (data.price) data.price = parseFloat(data.price);
			openModalForProduct(data);
		});
	};

	document.querySelectorAll('.quick-view-btn').forEach(wireButton);

	// Delegated listener as a robust fallback
	document.addEventListener('click', function evtHandler(e) {
		const btn = e.target.closest && e.target.closest('.quick-view-btn');
		if (btn) {
			// If not already wired, handle here
			if (!btn._quickViewWired) {
				btn._quickViewWired = true;
				wireButton(btn);
			}
		}
	});
}

// --- Account: Address modal + rendering (improve from prompt-based flows) ---
// Renders the addresses panel using the logged-in user's stored addresses
function renderAddressesPanel() {
	const panel = document.getElementById('addresses');
	if (!panel) return;
	const list = panel.querySelector('.addresses-list');
	if (!list) return;
	list.innerHTML = '';

	const cur = getCurrentUser();
	if (!cur) { list.innerHTML = '<p>Please login to manage addresses.</p>'; return; }
	const users = getSavedUsers();
	const user = users[cur.email] || cur;
	const addresses = user.addresses || [];
	if (!addresses.length) {
		list.innerHTML = '<p>No saved addresses yet.</p>';
		return;
	}

	addresses.forEach((a, idx) => {
		const card = document.createElement('div');
		card.className = 'address-card';
		card.innerHTML = `
			<p><strong>${a.label || 'Address ' + (idx+1)}</strong></p>
			<p>${a.line1 || a.line || ''}</p>
			<p>${a.city || ''} ${a.postcode || ''}</p>
			<p>Phone: ${a.phone || ''}</p>
			<div class="address-actions">
				<button class="btn-secondary edit-address" data-index="${idx}">Edit</button>
				<button class="btn-secondary remove-address" data-index="${idx}">Remove</button>
			</div>
		`;
		list.appendChild(card);
	});
}

function ensureAddressModal() {
	let modal = document.getElementById('addressModal');
	if (modal) return modal;
	modal = document.createElement('div');
	modal.id = 'addressModal';
	modal.className = 'address-modal';
	modal.innerHTML = `
		<div class="address-modal-backdrop"></div>
		<div class="address-modal-panel">
			<button class="address-modal-close">×</button>
			<h3 id="addressModalTitle">Add Address</h3>
			<form id="addressModalForm">
				<div class="form-group">
					<label>Label</label>
					<input name="label" id="addr_label" type="text" placeholder="Home / Office" required />
				</div>
				<div class="form-group">
					<label>Address line 1</label>
					<input name="line1" id="addr_line1" type="text" required />
				</div>
				<div class="form-row">
					<div class="form-group"><label>City</label><input name="city" id="addr_city" type="text" required /></div>
					<div class="form-group"><label>Postcode</label><input name="postcode" id="addr_postcode" type="text" required /></div>
				</div>
				<div class="form-group">
					<label>Phone</label>
					<input name="phone" id="addr_phone" type="tel" />
				</div>
				<input type="hidden" id="addr_index" value="-1" />
				<div class="form-actions">
					<button type="submit" class="btn-primary">Save Address</button>
					<button type="button" class="btn-secondary address-modal-cancel">Cancel</button>
				</div>
			</form>
		</div>
	`;
	document.body.appendChild(modal);

	// Close handlers
	modal.querySelector('.address-modal-close').addEventListener('click', () => modal.remove());
	modal.querySelector('.address-modal-cancel').addEventListener('click', () => modal.remove());
	modal.querySelector('.address-modal-backdrop').addEventListener('click', () => modal.remove());

	// Form submit
	modal.querySelector('#addressModalForm').addEventListener('submit', function(e) {
		e.preventDefault();
		const idx = parseInt(document.getElementById('addr_index').value, 10);
		const label = document.getElementById('addr_label').value.trim();
		const line1 = document.getElementById('addr_line1').value.trim();
		const city = document.getElementById('addr_city').value.trim();
		const postcode = document.getElementById('addr_postcode').value.trim();
		const phone = document.getElementById('addr_phone').value.trim();

		const cur = getCurrentUser();
		if (!cur) { showNotification('Please sign in to save addresses', 'error'); return; }
		const users = getSavedUsers();
		const user = users[cur.email] || cur;
		user.addresses = user.addresses || [];
		const addrObj = { label, line1, city, postcode, phone };
		if (isFinite(idx) && idx >= 0 && idx < user.addresses.length) {
			user.addresses[idx] = addrObj;
			showNotification('Address updated');
		} else {
			user.addresses.push(addrObj);
			showNotification('Address added');
		}
		users[cur.email] = user;
		saveUsers(users);
		renderAddressesPanel();
		modal.remove();
	});

	return modal;
}

// Delegated handlers for address actions and add button
document.addEventListener('click', function(e) {
	const addBtn = e.target.closest && e.target.closest('#addAddressBtn');
	if (addBtn) {
		e.preventDefault();
		const modal = ensureAddressModal();
		document.getElementById('addressModalTitle').textContent = 'Add New Address';
		document.getElementById('addr_index').value = -1;
		document.getElementById('addr_label').value = '';
		document.getElementById('addr_line1').value = '';
		document.getElementById('addr_city').value = '';
		document.getElementById('addr_postcode').value = '';
		document.getElementById('addr_phone').value = '';
			modal.style.display = 'flex';
		return;
	}

	const editBtn = e.target.closest && e.target.closest('.edit-address');
	if (editBtn) {
		e.preventDefault();
		const idx = parseInt(editBtn.dataset.index, 10);
		const cur = getCurrentUser();
		if (!cur) return showNotification('Not signed in', 'error');
		const users = getSavedUsers();
		const user = users[cur.email] || cur;
		const addr = (user.addresses || [])[idx] || {};
		const modal = ensureAddressModal();
		document.getElementById('addressModalTitle').textContent = 'Edit Address';
		document.getElementById('addr_index').value = idx;
		document.getElementById('addr_label').value = addr.label || '';
		document.getElementById('addr_line1').value = addr.line1 || addr.line || '';
		document.getElementById('addr_city').value = addr.city || '';
		document.getElementById('addr_postcode').value = addr.postcode || '';
		document.getElementById('addr_phone').value = addr.phone || '';
			modal.style.display = 'flex';
		return;
	}

	const remBtn = e.target.closest && e.target.closest('.remove-address');
	if (remBtn) {
		e.preventDefault();
		const idx = parseInt(remBtn.dataset.index, 10);
		const cur = getCurrentUser();
		if (!cur) return showNotification('Not signed in', 'error');
		const users = getSavedUsers();
		const user = users[cur.email] || cur;
		user.addresses = (user.addresses || []).filter((_, i) => i !== idx);
		users[cur.email] = user;
		saveUsers(users);
		renderAddressesPanel();
		showNotification('Address removed');
		return;
	}
});

// Ensure we render addresses on load if user is signed in
document.addEventListener('DOMContentLoaded', function() {
	const cur = getCurrentUser();
	if (cur) renderAddressesPanel();
});



// Show Notification
function showNotification(message, type = 'success') {
	// Remove existing notification if any
	const existingNotification = document.querySelector('.notification');
	if (existingNotification) {
		existingNotification.remove();
	}
    
	const notification = document.createElement('div');
	notification.className = `notification notification-${type}`;
	notification.innerHTML = `
		<div class="notification-content">
			<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
				<circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2"/>
				<path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<span>${message}</span>
		</div>
	`;
    
	// Add styles if not already present
	if (!document.querySelector('#notification-styles')) {
		const style = document.createElement('style');
		style.id = 'notification-styles';
		style.textContent = `
			.notification {
				position: fixed;
				top: 100px;
				right: 20px;
				background: white;
				padding: 16px 24px;
				border-radius: 12px;
				box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
				z-index: 10000;
				animation: slideIn 0.3s ease-out;
			}
            
			.notification-content {
				display: flex;
				align-items: center;
				gap: 12px;
				color: #6B9F3E;
				font-weight: 500;
			}
            
			.notification-success {
				border-left: 4px solid #6B9F3E;
			}
            
			.notification-error {
				border-left: 4px solid #f44336;
			}
            
			.notification-error .notification-content {
				color: #f44336;
			}
            
			@keyframes slideIn {
				from {
					transform: translateX(400px);
					opacity: 0;
				}
				to {
					transform: translateX(0);
					opacity: 1;
				}
			}
            
			@keyframes slideOut {
				from {
					transform: translateX(0);
					opacity: 1;
				}
				to {
					transform: translateX(400px);
					opacity: 0;
				}
			}
		`;
		document.head.appendChild(style);
	}
    
	document.body.appendChild(notification);
    
	setTimeout(() => {
		notification.style.animation = 'slideOut 0.3s ease-out';
		setTimeout(() => notification.remove(), 300);
	}, 3000);
}

// Newsletter Form Handler
function handleNewsletter(event) {
	event.preventDefault();
	const email = event.target.querySelector('input[type="email"]').value;
    
	// Simulate API call
	setTimeout(() => {
		showNotification('Thank you for subscribing!');
		event.target.reset();
	}, 500);
}

// Header scroll effect
window.addEventListener('scroll', function() {
	const header = document.querySelector('.header');
	if (window.scrollY > 50) {
		header.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
	} else {
		header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
	}
});

// Search functionality (placeholder)
const searchBtn = document.querySelector('.search-btn');
if (searchBtn) {
	searchBtn.addEventListener('click', function() {
		showNotification('Search feature coming soon!', 'info');
	});
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
	window.cart = cart;
	window.addToCart = addToCart;
	window.removeFromCart = removeFromCart;
	window.updateQuantity = updateQuantity;
	window.getCartTotal = getCartTotal;
	window.showNotification = showNotification;
	window.handleNewsletter = handleNewsletter;
}

// ===================================
// TESTIMONIAL SLIDER
// ===================================

let currentTestimonialSlide = 0;

function moveTestimonialSlide(direction) {
	const slides = document.querySelectorAll('.testimonial-slide');
	if (!slides.length) return;
    
	slides[currentTestimonialSlide].classList.remove('active');
    
	currentTestimonialSlide += direction;
    
	if (currentTestimonialSlide >= slides.length) {
		currentTestimonialSlide = 0;
	} else if (currentTestimonialSlide < 0) {
		currentTestimonialSlide = slides.length - 1;
	}
    
	slides[currentTestimonialSlide].classList.add('active');
}

// Auto-play testimonials
if (document.querySelector('.testimonials-slider')) {
	setInterval(function() {
		moveTestimonialSlide(1);
	}, 5000); // Change slide every 5 seconds
}

// Export testimonial function
if (typeof window !== 'undefined') {
	window.moveTestimonialSlide = moveTestimonialSlide;
}
