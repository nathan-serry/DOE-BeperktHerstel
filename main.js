window.addEventListener('DOMContentLoaded', function(e){

    const storyPoints = Array.from(document.querySelectorAll(".story-point"));
    const revealItems = Array.from(document.querySelectorAll(".reveal"));
    const topOffset = () => {
        const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 82;
        return navHeight + 24;
    };

    let pendingTargetId = null;
    let pendingTargetY = null;

    function setActiveTarget(id) {
        storyPoints.forEach((point) => {
            point.classList.toggle("is-active", point.dataset.target === id);
        });
    }

    function scrollToTarget(id) {
        const target = document.getElementById(id);
        if (!target) return;

        pendingTargetId = id;
        pendingTargetY = Math.max(target.getBoundingClientRect().top + window.scrollY - topOffset(), 0);
        setActiveTarget(id);

        window.scrollTo({
            top: pendingTargetY,
            behavior: "smooth"
        });
    }

    function updateActiveFromScroll() {
        if (pendingTargetId) return;

        const focusY = topOffset() + 24;
        let closestPoint = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        storyPoints.forEach((point) => {
            const rect = point.getBoundingClientRect();
            const distance = Math.abs(rect.top - focusY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestPoint = point;
            }
        });

        if (closestPoint) {
            setActiveTarget(closestPoint.id);
        }
    }

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.14
        }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
    window.addEventListener("scroll", () => {
        if (pendingTargetId && pendingTargetY !== null && Math.abs(window.scrollY - pendingTargetY) < 8) {
            setActiveTarget(pendingTargetId);
            pendingTargetId = null;
            pendingTargetY = null;
            return;
        }

        const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 8;
        if (atBottom && !pendingTargetId) {
            setActiveTarget("timeline-impact");
            return;
        }

        updateActiveFromScroll();
    }, { passive: true });

    setActiveTarget("timeline-probleem");
    updateActiveFromScroll();

    const FIRST            = 500;
    const LAST             = 539;
    const TOTAL            = LAST - FIRST + 1;   // 40
    const PIXELS_PER_FRAME = 20;

// ── Sentinel height ──────────────────────────────────

    const sentinel = document.getElementById('scroll-sentinel');
    sentinel.style.height = (window.innerHeight + (TOTAL - 1) * PIXELS_PER_FRAME) + 'px';

// ── Preload ──────────────────────────────────────────
    const frames       = new Array(TOTAL);
    let   loadedCount  = 0;
    const progressFill = document.getElementById('progress-bar-fill');
    const frameImg     = document.getElementById('frame-img');
    const scrollHint   = document.getElementById('scroll-hint');

    for (let i = 0; i < TOTAL; i++) {
        const img = new Image();
        img.src   = `./imgs/${String(FIRST + i).padStart(4, '0')}.png`;
        frames[i] = img;
        img.onload = img.onerror = () => {
            loadedCount++;
            progressFill.style.width = (loadedCount / TOTAL * 100) + '%';
        };
    }

// ── Scroll → frame ───────────────────────────────────
    let rafPending = false;
    let currentIdx = -1;

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
            const into     = window.scrollY - sentinel.offsetTop;
            const max      = (TOTAL - 1) * PIXELS_PER_FRAME;
            const progress = Math.min(Math.max(into / max, 0), 1);
            updateFrame(Math.min(Math.floor(progress * TOTAL), TOTAL - 1));
            scrollHint.classList.toggle('hidden', into > 20);
        });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        sentinel.style.height = (window.innerHeight + (TOTAL - 1) * PIXELS_PER_FRAME) + 'px';
        onScroll();
    });

// ── Module entrance animations ────────────────────────
    const cardList = Array.from(document.querySelectorAll('.module-card'));
    const cardIndexMap = new Map(cardList.map((c, i) => [c, i]));
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setTimeout(() => entry.target.classList.add('visible'), cardIndexMap.get(entry.target) * 55);
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });
    cardList.forEach(c => io.observe(c));

});


