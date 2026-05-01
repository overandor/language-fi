document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                navLinks.classList.remove('active');
            }
        });
    });

    // Add scroll effect to navigation
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('nav');
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(5, 5, 10, 0.98)';
        } else {
            nav.style.background = 'rgba(5, 5, 10, 0.85)';
        }
    });

    // Animate floating letters on scroll
    const floatingLetters = document.querySelectorAll('.floating-letter');
    window.addEventListener('scroll', function() {
        const scrollY = window.scrollY;
        floatingLetters.forEach((letter, index) => {
            const speed = 0.5 + (index * 0.1);
            letter.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
        });
    });

    // Add mouse tracking for primitive cards
    const primitiveCards = document.querySelectorAll('.primitive-card, .core-card');
    primitiveCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    });

    // Add intersection observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe sections for animation
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    // Add hover effect to table rows
    const tableRows = document.querySelectorAll('.registry-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(4px)';
        });
        row.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });

    // Add click handlers for registry filters
    const filterButtons = document.querySelectorAll('.registry-filters button, .letter-explorer-filters button');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons in the same container
            const container = this.parentElement;
            container.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
        });
    });

    // Letter page specific interactivity
    const protocolCards = document.querySelectorAll('.protocol-card');
    protocolCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const barFill = this.querySelector('.protocol-bar-fill');
            if (barFill) {
                barFill.style.background = 'linear-gradient(90deg, var(--neon-green), var(--electric-blue))';
            }
        });
        card.addEventListener('mouseleave', function() {
            const barFill = this.querySelector('.protocol-bar-fill');
            if (barFill) {
                barFill.style.background = 'linear-gradient(90deg, var(--electric-blue), var(--neon-green))';
            }
        });
    });

    // Market form interactivity
    const marketForm = document.querySelector('.market-form');
    if (marketForm) {
        const openPositionBtn = marketForm.querySelector('.btn-primary');
        if (openPositionBtn) {
            openPositionBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Simulate opening position
                this.textContent = 'Position Opening...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.textContent = 'Position Opened ✓';
                    this.style.background = 'var(--neon-green)';
                    this.style.color = 'var(--bg)';
                    
                    setTimeout(() => {
                        this.textContent = 'Open Position';
                        this.disabled = false;
                        this.style.background = '';
                        this.style.color = '';
                    }, 2000);
                }, 1500);
            });
        }
    }

    // Animate protocol bars on scroll
    const protocolBars = document.querySelectorAll('.protocol-bar-fill');
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const width = entry.target.style.width;
                entry.target.style.width = '0%';
                setTimeout(() => {
                    entry.target.style.width = width;
                }, 100);
            }
        });
    }, { threshold: 0.5 });

    protocolBars.forEach(bar => barObserver.observe(bar));

    // Add URL parameter handling for letter page
    const urlParams = new URLSearchParams(window.location.search);
    const letterParam = urlParams.get('l');
    if (letterParam && document.querySelector('.giant-letter')) {
        document.querySelector('.giant-letter').textContent = letterParam.toUpperCase();
        document.title = `Letter ${letterParam.toUpperCase()} — Language.fi`;
    }

    // Add click effect to buttons
    const buttons = document.querySelectorAll('button, .btn-primary, .btn-secondary');
    buttons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add CSS for ripple animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});
