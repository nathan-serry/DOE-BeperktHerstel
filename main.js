window.addEventListener('DOMContentLoaded', () => {
    // ── Constants ────────────────────────────────────────────────
    const FIRST = 500;
    const LAST = 539;
    const TOTAL = LAST - FIRST + 1;
    const PIXELS_PER_FRAME = 20;
    const REVEAL_THRESHOLD = 0.14;
    const CARD_THRESHOLD = 0.08;
    const CARD_DELAY = 55;
    const ANIMATION_START_OFFSET = 350;

    // ── DOM Elements ───────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    const storyPoints = $$('.story-point');
    const revealItems = $$('.reveal');
    const cardList = $$('.module-card');
    const sentinel = $('#scroll-sentinel');
    const progressFill = $('#progress-bar-fill');
    const frameImg = $('#frame-img');
    const scrollHint = $('#scroll-hint');

    // ── Navigation ────────────────────────────────────────────────
    let navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 82;
    let topOffset = navHeight + 24;

    function setActiveTarget(id) {
        storyPoints.forEach(point => {
            point.classList.toggle('is-active', point.dataset.target === id);
        });
    }

    function updateActiveFromScroll() {
        const focusY = topOffset + 24;
        let closestPoint = null;
        let closestDistance = Infinity;

        for (const point of storyPoints) {
            const distance = Math.abs(point.getBoundingClientRect().top - focusY);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        }

        if (closestPoint) setActiveTarget(closestPoint.id);
    }

    // ── Reveal Observer ───────────────────────────────────────────
    const revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver.unobserve(entry.target);
            }
        }
    }, { threshold: REVEAL_THRESHOLD });

    revealItems.forEach(item => revealObserver.observe(item));

    // ── Scroll Handler ──────────────────────────────────────────────
    window.addEventListener('scroll', () => {
        const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 8;
        if (atBottom) {
            setActiveTarget('timeline-impact');
            return;
        }

        updateActiveFromScroll();
    }, { passive: true });

    setActiveTarget('timeline-probleem');
    updateActiveFromScroll();

    // ── Frame Animation ─────────────────────────────────────────────
    sentinel.style.height = `${window.innerHeight + (TOTAL - 1) * PIXELS_PER_FRAME - 1.4*ANIMATION_START_OFFSET}px`;

    const frames = new Array(TOTAL);
    let loadedCount = 0;
    let currentIdx = -1;
    let rafPending = false;

    for (let i = 0; i < TOTAL; i++) {
        const img = new Image();
        img.src = `./imgs/${String(FIRST + i).padStart(4, '0')}.png`;
        frames[i] = img;
        img.onload = img.onerror = () => {
            loadedCount++;
            progressFill.style.width = `${(loadedCount / TOTAL) * 100}%`;
        };
    }

    function updateFrame(index) {
        if (index === currentIdx) return;
        currentIdx = index;
        frameImg.src = frames[index].src;
    }

    function onScroll() {
        if (rafPending) return;
        rafPending = true;
        requestAnimationFrame(() => {
            rafPending = false;
            const into = window.scrollY - sentinel.offsetTop + ANIMATION_START_OFFSET;
            const max = (TOTAL - 1) * PIXELS_PER_FRAME;
            const progress = Math.min(Math.max(into / max, 0), 1);
            updateFrame(Math.min(Math.floor(progress * TOTAL), TOTAL - 1));
            scrollHint.classList.toggle('hidden', into > 20);
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        sentinel.style.height = `${window.innerHeight + (TOTAL - 1) * PIXELS_PER_FRAME + ANIMATION_START_OFFSET}px`;
        onScroll();
    });

    // ── Card Animations ────────────────────────────────────────────
    const cardIndexMap = new Map(cardList.map((c, i) => [c, i]));
    const cardObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), cardIndexMap.get(entry.target) * CARD_DELAY);
                cardObserver.unobserve(entry.target);
            }
        }
    }, { threshold: CARD_THRESHOLD });

    cardList.forEach(card => cardObserver.observe(card));
});
