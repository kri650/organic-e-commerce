// ===================================
// PUREHERBAL - MAIN JAVASCRIPT
// ===================================

// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    initMobileMenu();
    initSmoothScroll();
    initScrollAnimations();
    initFlowerAnimation();
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
                // Start automatic image slideshow
                const featureContainer = entry.target.querySelector('.feature-images-container');
                const featureImage = featureContainer.querySelector('.feature-image-item');
                const images = [
                    'https://images.pexels.com/photos/5308631/pexels-photo-5308631.jpeg',
                    'https://images.pexels.com/photos/5927889/pexels-photo-5927889.jpeg',
                    'https://images.pexels.com/photos/8989973/pexels-photo-8989973.jpeg',
                    'https://images.pexels.com/photos/7010956/pexels-photo-7010956.jpeg',
                    'https://images.pexels.com/photos/7622597/pexels-photo-7622597.jpeg',
                    'https://images.pexels.com/photos/6543634/pexels-photo-6543634.jpeg'
                ];
                let currentIndex = 0;
                
                // Change image every 2 seconds
                setInterval(() => {
                    currentIndex = (currentIndex + 1) % images.length;
                    const img = featureImage.querySelector('img');
                    
                    // Fade out
                    featureImage.style.opacity = '0';
                    
                    // Change image and fade in
                    setTimeout(() => {
                        img.src = images[currentIndex];
                        featureImage.style.opacity = '1';
                    }, 500);
                }, 2000);
                
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
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            name: productName,
            price: price,
            quantity: 1,
            id: Date.now()
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`${productName} added to cart!`);
}

// Update Cart Count
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
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
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = newQuantity;
            localStorage.setItem('cart', JSON.stringify(cart));
            if (typeof renderCart === 'function') {
                renderCart();
            }
        }
    }
}

// Get Cart Total
function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

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
