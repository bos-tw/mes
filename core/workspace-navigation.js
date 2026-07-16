(function () {
    'use strict';

    const FAVORITES_KEY = 'mes_workspace_favorites';
    let favoritesTrigger = null;
    let favoritesFlyout = null;

    function readList(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; }
    }

    function writeList(key, value) {
        localStorage.setItem(key, JSON.stringify(value.slice(0, 8)));
    }

    function links() {
        return Array.from(document.querySelectorAll('.sidebar [data-page]'));
    }

    function findLink(moduleId) {
        return links().find(link => link.dataset.page === moduleId);
    }

    function setFavoriteButtonState(button, isFavorite) {
        const title = button.dataset.favoriteTitle || '';
        button.textContent = isFavorite ? '★' : '☆';
        button.setAttribute('aria-pressed', String(isFavorite));
        button.setAttribute('aria-label', `${isFavorite ? '取消收藏' : '收藏'}${title}`);
        button.setAttribute('title', isFavorite ? '取消收藏' : '加入收藏');
    }

    function openModule(moduleId) {
        const link = findLink(moduleId);
        if (!link || link.closest('li')?.classList.contains('hidden')) return;
        link.click();
    }

    function createFavoriteItem(moduleId) {
        const link = findLink(moduleId);
        if (!link || link.closest('li')?.classList.contains('hidden')) return null;
        const title = link.dataset.title || link.textContent.trim();
        const item = document.createElement('div');
        item.className = 'workspace-favorite-item';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'workspace-favorite-open';
        openButton.dataset.workspaceOpen = moduleId;
        openButton.innerHTML = '<i class="fas fa-star" aria-hidden="true"></i>';
        const label = document.createElement('span');
        label.textContent = title;
        openButton.appendChild(label);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'workspace-favorite-remove';
        removeButton.dataset.removeFavorite = moduleId;
        removeButton.setAttribute('aria-label', `取消收藏${title}`);
        removeButton.setAttribute('title', '取消收藏');
        removeButton.textContent = '★';

        item.append(openButton, removeButton);
        return item;
    }

    function renderFavorites() {
        if (!favoritesFlyout || !favoritesTrigger) return;
        const list = favoritesFlyout.querySelector('[data-workspace-favorites-list]');
        const ids = readList(FAVORITES_KEY);
        const items = ids.map(createFavoriteItem).filter(Boolean);
        const count = favoritesTrigger.querySelector('[data-workspace-favorites-count]');
        if (count) count.textContent = String(items.length);
        favoritesTrigger.setAttribute('aria-label', `我的收藏，共 ${items.length} 項`);

        if (!list) return;
        list.replaceChildren();
        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'workspace-favorites-empty';
            empty.innerHTML = '<i class="far fa-star" aria-hidden="true"></i><strong>尚無收藏</strong><span>點選功能旁的星號即可加入。</span>';
            list.appendChild(empty);
            return;
        }
        list.append(...items);
    }

    function positionFavoritesFlyout() {
        if (!favoritesTrigger || !favoritesFlyout || favoritesFlyout.hidden) return;
        const triggerRect = favoritesTrigger.getBoundingClientRect();
        const gap = 8;
        const viewportPadding = 12;
        const width = favoritesFlyout.offsetWidth;
        const height = favoritesFlyout.offsetHeight;
        const preferredLeft = triggerRect.right + gap;
        const left = Math.max(viewportPadding, Math.min(preferredLeft, window.innerWidth - width - viewportPadding));
        const top = Math.max(viewportPadding, Math.min(triggerRect.top, window.innerHeight - height - viewportPadding));
        favoritesFlyout.style.left = `${left}px`;
        favoritesFlyout.style.top = `${top}px`;
    }

    function openFavoritesMenu({ focusFirst = false } = {}) {
        if (!favoritesTrigger || !favoritesFlyout) return;
        renderFavorites();
        favoritesFlyout.hidden = false;
        favoritesTrigger.setAttribute('aria-expanded', 'true');
        window.requestAnimationFrame(() => {
            positionFavoritesFlyout();
            if (focusFirst) favoritesFlyout.querySelector('button')?.focus();
        });
    }

    function closeFavoritesMenu({ restoreFocus = false } = {}) {
        if (!favoritesTrigger || !favoritesFlyout || favoritesFlyout.hidden) return;
        favoritesFlyout.hidden = true;
        favoritesTrigger.setAttribute('aria-expanded', 'false');
        if (restoreFocus) favoritesTrigger.focus();
    }

    function removeFavorite(moduleId) {
        const next = readList(FAVORITES_KEY).filter(item => item !== moduleId);
        writeList(FAVORITES_KEY, next);
        const star = Array.from(document.querySelectorAll('[data-favorite]'))
            .find(button => button.dataset.favorite === moduleId);
        if (star) setFavoriteButtonState(star, false);
        renderFavorites();
        positionFavoritesFlyout();
    }

    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.querySelector('.sidebar');
        const nav = sidebar?.querySelector('nav');
        if (!nav) return;
        const panel = document.createElement('section');
        panel.className = 'workspace-nav-panel';
        panel.setAttribute('aria-label', '工作區快速導覽');
        panel.innerHTML = `
            <label class="workspace-search"><span class="sr-only">搜尋功能</span><i class="fas fa-search" aria-hidden="true"></i><input type="search" placeholder="搜尋功能…" data-workspace-search></label>
            <button type="button" class="workspace-favorites-trigger" data-workspace-favorites-trigger aria-expanded="false" aria-controls="workspace-favorites-flyout">
                <span class="workspace-favorites-trigger-label"><i class="fas fa-star" aria-hidden="true"></i><span>我的收藏</span></span>
                <span class="workspace-favorites-trigger-meta"><span class="workspace-favorites-count" data-workspace-favorites-count>0</span><i class="fas fa-chevron-right" aria-hidden="true"></i></span>
            </button>`;
        nav.prepend(panel);

        favoritesTrigger = panel.querySelector('[data-workspace-favorites-trigger]');
        favoritesFlyout = document.createElement('aside');
        favoritesFlyout.id = 'workspace-favorites-flyout';
        favoritesFlyout.className = 'workspace-favorites-flyout';
        favoritesFlyout.hidden = true;
        favoritesFlyout.setAttribute('aria-label', '我的收藏選單');
        favoritesFlyout.innerHTML = `
            <header class="workspace-favorites-flyout-header">
                <div><i class="fas fa-star" aria-hidden="true"></i><strong>我的收藏</strong></div>
                <button type="button" class="workspace-favorites-close" data-close-workspace-favorites aria-label="關閉收藏選單" title="關閉"><i class="fas fa-times" aria-hidden="true"></i></button>
            </header>
            <div class="workspace-favorites-list" data-workspace-favorites-list></div>`;
        document.body.appendChild(favoritesFlyout);

        links().forEach(link => {
            const moduleId = link.dataset.page;
            const star = document.createElement('button');
            star.type = 'button';
            star.className = 'workspace-favorite-toggle';
            star.dataset.favorite = moduleId;
            star.dataset.favoriteTitle = link.dataset.title || link.textContent.trim();
            setFavoriteButtonState(star, readList(FAVORITES_KEY).includes(moduleId));
            link.after(star);
        });

        favoritesTrigger.addEventListener('click', () => {
            if (favoritesFlyout.hidden) openFavoritesMenu();
            else closeFavoritesMenu();
        });
        favoritesTrigger.addEventListener('keydown', event => {
            if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                openFavoritesMenu({ focusFirst: true });
            }
        });
        favoritesFlyout.addEventListener('click', event => {
            const openButton = event.target.closest('[data-workspace-open]');
            if (openButton) {
                openModule(openButton.dataset.workspaceOpen);
                closeFavoritesMenu();
                return;
            }
            const removeButton = event.target.closest('[data-remove-favorite]');
            if (removeButton) {
                removeFavorite(removeButton.dataset.removeFavorite);
                return;
            }
            if (event.target.closest('[data-close-workspace-favorites]')) {
                closeFavoritesMenu({ restoreFocus: true });
            }
        });
        favoritesFlyout.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeFavoritesMenu({ restoreFocus: true });
                return;
            }
            if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
            const controls = Array.from(favoritesFlyout.querySelectorAll('button:not([disabled])'));
            if (controls.length === 0) return;
            event.preventDefault();
            const currentIndex = controls.indexOf(document.activeElement);
            let nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1 : currentIndex;
            if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + controls.length) % controls.length;
            if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + controls.length) % controls.length;
            controls[nextIndex].focus();
        });
        sidebar.addEventListener('click', event => {
            const favorite = event.target.closest('[data-favorite]');
            if (favorite) {
                event.preventDefault();
                event.stopPropagation();
                const id = favorite.dataset.favorite;
                const current = readList(FAVORITES_KEY);
                const next = current.includes(id) ? current.filter(item => item !== id) : [id, ...current];
                writeList(FAVORITES_KEY, next);
                setFavoriteButtonState(favorite, next.includes(id));
                renderFavorites();
                return;
            }
        });
        panel.querySelector('[data-workspace-search]').addEventListener('input', event => {
            const term = event.target.value.trim().toLocaleLowerCase('zh-TW');
            links().forEach(link => {
                const match = !term || `${link.dataset.title || ''} ${link.textContent}`.toLocaleLowerCase('zh-TW').includes(term);
                link.closest('li').hidden = !match;
            });
        });
        document.addEventListener('pointerdown', event => {
            if (favoritesFlyout.hidden || favoritesFlyout.contains(event.target) || favoritesTrigger.contains(event.target)) return;
            closeFavoritesMenu();
        });
        window.addEventListener('resize', positionFavoritesFlyout);
        sidebar.addEventListener('scroll', () => closeFavoritesMenu());
        renderFavorites();
    });
})();
