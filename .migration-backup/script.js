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

    // Fetch live letter data from API
    async function fetchLetterData() {
        try {
            const response = await fetch('/api/letters');
            const data = await response.json();
            renderLetterTable(data);
        } catch (error) {
            console.error('Error fetching letter data:', error);
            // Fallback to mock data if API fails
            renderLetterTable(getMockLetterData());
        }
    }

    function renderLetterTable(letters) {
        const tbody = document.getElementById('letters-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = letters.map(letter => {
            const changeClass = letter.change_24h >= 0 ? 'change-positive' : 'change-negative';
            const trendClass = letter.change_24h >= 0 ? 'trend-up' : 'trend-down';
            const changeSign = letter.change_24h >= 0 ? '+' : '';
            
            return `
                <tr>
                    <td class="letter-cell">${letter.letter}</td>
                    <td class="price-cell">${letter.price}</td>
                    <td class="${changeClass}">${changeSign}${letter.change_24h}%</td>
                    <td>${letter.weekly_usage}</td>
                    <td>${letter.rank}</td>
                    <td>${letter.long_pct}</td>
                    <td>${letter.short_pct}</td>
                    <td>${letter.top_protocol}</td>
                    <td class="${trendClass}">${letter.trend}</td>
                    <td><a href="letter.html?l=${letter.letter}" class="btn-link">View</a></td>
                </tr>
            `;
        }).join('');
    }

    function getMockLetterData() {
        // Fallback mock data if API is not available
        return [
            {letter: 'E', price: 0.142, change_24h: 4.8, weekly_usage: '2.84M', rank: '#2', long_pct: '61%', short_pct: '39%', top_protocol: 'Solana', trend: '↑'},
            {letter: 'T', price: 0.185, change_24h: 6.2, weekly_usage: '3.21M', rank: '#1', long_pct: '58%', short_pct: '42%', top_protocol: 'Ethereum', trend: '↑'},
            {letter: 'A', price: 0.142, change_24h: 4.8, weekly_usage: '2.84M', rank: '#2', long_pct: '61%', short_pct: '39%', top_protocol: 'Solana', trend: '↑'},
            {letter: 'O', price: 0.085, change_24h: 1.8, weekly_usage: '1.12M', rank: '#9', long_pct: '52%', short_pct: '48%', top_protocol: 'Solana', trend: '↑'},
            {letter: 'N', price: 0.072, change_24h: 3.4, weekly_usage: '1.45M', rank: '#6', long_pct: '55%', short_pct: '45%', top_protocol: 'Base', trend: '↑'},
            {letter: 'I', price: 0.095, change_24h: -0.9, weekly_usage: '1.08M', rank: '#10', long_pct: '47%', short_pct: '53%', top_protocol: 'Solana', trend: '↓'},
            {letter: 'R', price: 0.068, change_24h: 2.1, weekly_usage: '1.28M', rank: '#8', long_pct: '51%', short_pct: '49%', top_protocol: 'Ethereum', trend: '↑'},
            {letter: 'S', price: 0.105, change_24h: 5.6, weekly_usage: '1.52M', rank: '#5', long_pct: '63%', short_pct: '37%', top_protocol: 'Solana', trend: '↑'}
        ];
    }

    // Fetch letter data on load
    fetchLetterData();
    
    // Fetch registry data on load
    fetchRegistryData();
    
    // Refresh data every 30 seconds
    setInterval(fetchLetterData, 30000);
    setInterval(fetchRegistryData, 30000);

    // Fetch registry data from API
    async function fetchRegistryData() {
        try {
            const response = await fetch('/api/letters');
            const data = await response.json();
            renderRegistryTable(data);
            updateRegistryStats(data);
        } catch (error) {
            console.error('Error fetching registry data:', error);
            // Fallback to mock data if API fails
            renderRegistryTable(getMockLetterData());
        }
    }

    function renderRegistryTable(letters) {
        const tbody = document.getElementById('registry-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = letters.map(letter => {
            const changeClass = letter.change_24h >= 0 ? 'change-positive' : 'change-negative';
            const trendClass = letter.change_24h >= 0 ? 'trend-up' : 'trend-down';
            const changeSign = letter.change_24h >= 0 ? '+' : '';
            const weeklyUsageNum = parseFloat(letter.weekly_usage.replace('M', '').replace('K', ''));
            const totalVolume = (weeklyUsageNum * letter.price * 7).toFixed(2);
            const marketCap = (weeklyUsageNum * letter.price * 52).toFixed(2);
            
            return `
                <tr>
                    <td class="letter-cell">${letter.letter}</td>
                    <td class="price-cell">${letter.price}</td>
                    <td class="${changeClass}">${changeSign}${letter.change_24h}%</td>
                    <td>${letter.weekly_usage}</td>
                    <td>$${totalVolume}</td>
                    <td>$${marketCap}</td>
                    <td>${letter.rank}</td>
                    <td>${letter.long_pct}</td>
                    <td>${letter.short_pct}</td>
                    <td>${letter.top_protocol}</td>
                    <td class="${trendClass}">${letter.trend}</td>
                </tr>
            `;
        }).join('');
    }

    function updateRegistryStats(letters) {
        const totalMarketCap = letters.reduce((sum, letter) => {
            const weeklyUsageNum = parseFloat(letter.weekly_usage.replace('M', '').replace('K', ''));
            return sum + (weeklyUsageNum * letter.price * 52);
        }, 0);
        
        const dailyVolume = letters.reduce((sum, letter) => {
            const weeklyUsageNum = parseFloat(letter.weekly_usage.replace('M', '').replace('K', ''));
            return sum + (weeklyUsageNum * letter.price);
        }, 0);
        
        const weeklyUsage = letters.reduce((sum, letter) => {
            const weeklyUsageNum = parseFloat(letter.weekly_usage.replace('M', '').replace('K', ''));
            return sum + weeklyUsageNum;
        }, 0);
        
        const activePositions = letters.reduce((sum, letter) => {
            const longPct = parseInt(letter.long_pct);
            return sum + Math.floor(longPct * 10);
        }, 0);
        
        document.getElementById('total-market-cap').textContent = `$${(totalMarketCap).toFixed(1)}M`;
        document.getElementById('daily-volume').textContent = `$${(dailyVolume).toFixed(0)}K`;
        document.getElementById('weekly-usage').textContent = `${(weeklyUsage).toFixed(1)}M`;
        document.getElementById('active-positions').textContent = activePositions.toLocaleString();
    }

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
