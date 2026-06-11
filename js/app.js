document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG === 'undefined') {
        console.error('Config not loaded');
        return;
    }

    initMobileMenu();
    initScrollEffects();
    initSmoothScroll();
    initBackToTop();

    if (document.getElementById('propertiesGrid')) {
        loadFeaturedProperties();
    }

    const inquiryForm = document.getElementById('inquiryForm');
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', handleInquirySubmit);
    }

    animateOnScroll();
});

function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    if (!menuBtn || !navLinks) return;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'mobile-menu-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.setAttribute('aria-label', 'إغلاق القائمة');
    navLinks.prepend(closeBtn);

    function toggleMenu() {
        navLinks.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }

    menuBtn.addEventListener('click', toggleMenu);
    closeBtn.addEventListener('click', toggleMenu);

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
}

function initScrollEffects() {
    const header = document.getElementById('header');
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                header.classList.toggle('scrolled', window.scrollY > 50);
                ticking = false;
            });
            ticking = true;
        }
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', e => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function showToast(message, type = 'info') {
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
    const container = document.getElementById('toastContainer');

    if (!container) {
        const div = document.createElement('div');
        div.id = 'toastContainer';
        div.className = 'toast-container';
        document.body.prepend(div);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${message}`;
    document.getElementById('toastContainer').appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function createSkeletonGrid(count = 3) {
    return Array.from({ length: count }, () => `
        <div class="skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
            </div>
        </div>
    `).join('');
}

function createEmptyState() {
    return `
        <div class="empty-state">
            <i class="fa-solid fa-building-circle-exclamation"></i>
            <h3>لا توجد عقارات متاحة حالياً</h3>
            <p>سيتم إضافة عقارات جديدة قريباً. تابعونا!</p>
        </div>
    `;
}

function formatPrice(price) {
    if (!price && price !== 0) return '';
    return Number(price).toLocaleString(CONFIG.locale || 'ar-YE') + ' ريال';
}

function createPropertyCard(property) {
    const images = Array.isArray(property.images) ? property.images : [property.images].filter(Boolean);
    const imageUrl = images[0] || `https://picsum.photos/seed/property${property.id}/600/400`;

    return `
        <a href="property-details.html?id=${property.id}" class="property-card">
            <div class="property-image">
                <span class="property-badge ${property.status === 'rent' ? 'rent' : 'sale'}">
                    ${property.status === 'rent' ? 'للإيجار' : 'للبيع'}
                </span>
                <img src="${imageUrl}" alt="${property.title}" loading="lazy">
            </div>
            <div class="property-body">
                <span class="property-price">
                    ${formatPrice(property.price)}
                    ${property.status === 'rent' ? '<span class="price-period">/ سنوياً</span>' : ''}
                </span>
                <h3 class="property-title">${property.title}</h3>
                <div class="property-location">
                    <i class="fa-solid fa-location-dot"></i> ${property.location || 'مأرب'}
                </div>
                ${property.area ? `
                <div class="property-meta">
                    <span><i class="fa-solid fa-ruler-combined"></i> ${property.area} م²</span>
                </div>` : ''}
            </div>
        </a>
    `;
}

async function loadFeaturedProperties() {
    const grid = document.getElementById('propertiesGrid');
    if (!grid) return;

    grid.innerHTML = createSkeletonGrid(3);

    const { data, error } = await fetchProperties({ featured: true, limit: 6 });

    if (error || !data || data.length === 0) {
        const { data: allData } = await fetchProperties({ limit: 6 });
        if (allData && allData.length > 0) {
            grid.innerHTML = allData.map(createPropertyCard).join('');
        } else {
            grid.innerHTML = createEmptyState();
            showFallbackProperties(grid);
        }
        return;
    }

    grid.innerHTML = data.map(createPropertyCard).join('');
}

function showFallbackProperties(grid) {
    const target = grid || document.getElementById('propertiesGrid');
    if (!target) return;

    const fallbacks = [
        { id: 1, title: 'فيلا مودرن فاخرة - حي المطار', price: 80000000, status: 'sale', location: 'مأرب، حي المطار', area: 450, images: ['https://picsum.photos/seed/villa1/600/400'] },
        { id: 2, title: 'شقة مميزة بإطلالة - وسط المدينة', price: 1200000, status: 'rent', location: 'مأرب، وسط المدينة', area: 180, images: ['https://picsum.photos/seed/apartment1/600/400'] },
        { id: 3, title: 'أرض سكنية واسعة - حي السفير', price: 15000000, status: 'sale', location: 'مأرب، حي السفير', area: 800, images: ['https://picsum.photos/seed/land1/600/400'] }
    ];

    target.innerHTML = fallbacks.map(createPropertyCard).join('');
}

async function handleInquirySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const successDiv = document.getElementById('formSuccess');

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> جاري الإرسال...';

    const formData = {
        name: form.name.value.trim(),
        phone: form.phone.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
    };

    let valid = true;
    form.querySelectorAll('.form-control').forEach(el => {
        el.classList.remove('error');
    });
    form.querySelectorAll('.form-error').forEach(el => {
        el.classList.remove('show');
    });

    if (!formData.name) {
        showError(form.name, 'الرجاء إدخال الاسم');
        valid = false;
    }
    if (!formData.phone) {
        showError(form.phone, 'الرجاء إدخال رقم الهاتف');
        valid = false;
    }
    if (!formData.email) {
        showError(form.email, 'الرجاء إدخال البريد الإلكتروني');
        valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        showError(form.email, 'البريد الإلكتروني غير صالح');
        valid = false;
    }
    if (!formData.message) {
        showError(form.message, 'الرجاء إدخال الرسالة');
        valid = false;
    }

    if (!valid) {
        btn.disabled = false;
        btn.innerHTML = 'إرسال الرسالة';
        return;
    }

    if (isSupabaseConfigured()) {
        const { error } = await submitInquiry(formData);
        if (error) {
            btn.disabled = false;
            btn.innerHTML = 'إرسال الرسالة';
            showToast('حدث خطأ أثناء الإرسال. حاول مرة أخرى.', 'error');
            return;
        }
    }

    form.style.display = 'none';
    successDiv.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = 'إرسال الرسالة';
}

function showError(input, message) {
    input.classList.add('error');
    const errorEl = input.parentElement.querySelector('.form-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll(
        '.service-card, .why-us-card, .property-card, .stat-item, .about-grid > *'
    ).forEach(el => observer.observe(el));
}
