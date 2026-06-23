document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Add simple entrance animations
    const productCards = document.querySelectorAll('.product-card');
    
    // Intersection Observer for fade-up on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add a small delay based on index to create a staggered effect
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Initial state for animation
    productCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });

    // Initialize Gallery Swiper
    const swiperEl = document.querySelector('.gallerySwiper');
    if (swiperEl && typeof Swiper !== 'undefined') {
        new Swiper('.gallerySwiper', {
            slidesPerView: 1.2,
            spaceBetween: 16,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            navigation: {
                nextEl: '.gallery-section .swiper-button-next',
                prevEl: '.gallery-section .swiper-button-prev',
            },
            pagination: {
                el: '.gallery-section .swiper-pagination',
                clickable: true,
            },
            breakpoints: {
                640: { slidesPerView: 2.2, spaceBetween: 20 },
                1024: { slidesPerView: 3.5, spaceBetween: 24 }
            }
        });
    }
});
