(function () {
    'use strict';

    const FAVORITES_KEY = 'mes_workspace_favorites';
    let sidebar = null;
    let inlineSearchInput = null;
    let favoritesTrigger = null;
    let favoritesFlyout = null;
    let searchTrigger = null;
    let searchFlyout = null;
    let searchFlyoutInput = null;
    let menuFlyout = null;
    let menuFlyoutTrigger = null;

    function readList(key) {
        try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) { return []; }
    }

    function writeList(key, value) {
        localStorage.setItem(key, JSON.stringify(value.slice(0, 8)));
    }

    function links() {
        return Array.from(sidebar?.querySelectorAll('[data-page]') || []);
    }

    function isVisibleLink(link) {
        return Boolean(link)
            && !link.closest('li')?.hidden
            && !link.closest('.menu-item')?.classList.contains('hidden');
    }

    function getLinkTitle(link) {
        return link?.dataset.title || link?.querySelector('.menu-text')?.textContent.trim() || link?.textContent.trim() || '';
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

    function createIcon(className) {
        const icon = document.createElement('i');
        icon.className = className;
        icon.setAttribute('aria-hidden', 'true');
        return icon;
    }

    function createFlyoutHeader(title, iconClass, closeLabel, onClose) {
        const header = document.createElement('header');
        header.className = 'workspace-favorites-flyout-header';

        const heading = document.createElement('div');
        heading.append(createIcon(iconClass));
        const strong = document.createElement('strong');
        strong.textContent = title;
        heading.append(strong);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'workspace-favorites-close';
        closeButton.setAttribute('aria-label', closeLabel);
        closeButton.setAttribute('title', closeLabel);
        closeButton.append(createIcon('fas fa-times'));
        closeButton.addEventListener('click', onClose);

        header.append(heading, closeButton);
        return header;
    }

    function positionFlyout(trigger, flyout) {
        if (!trigger || !flyout || flyout.hidden) return;
        const triggerRect = trigger.getBoundingClientRect();
        const gap = 8;
        const viewportPadding = 12;
        const width = flyout.offsetWidth;
        const height = flyout.offsetHeight;
        const preferredLeft = triggerRect.right + gap;
        const left = Math.max(viewportPadding, Math.min(preferredLeft, window.innerWidth - width - viewportPadding));
        const top = Math.max(viewportPadding, Math.min(triggerRect.top, window.innerHeight - height - viewportPadding));
        flyout.style.left = `${left}px`;
        flyout.style.top = `${top}px`;
    }

    function positionOpenFlyouts() {
        positionFlyout(favoritesTrigger, favoritesFlyout);
        positionFlyout(searchTrigger, searchFlyout);
        positionFlyout(menuFlyoutTrigger, menuFlyout);
    }

    function closeFavoritesMenu({ restoreFocus = false } = {}) {
        if (!favoritesFlyout || favoritesFlyout.hidden) return;
        favoritesFlyout.hidden = true;
        favoritesTrigger?.setAttribute('aria-expanded', 'false');
        if (restoreFocus) favoritesTrigger?.focus();
    }

    function closeSearchMenu({ restoreFocus = false } = {}) {
        if (!searchFlyout || searchFlyout.hidden) return;
        searchFlyout.hidden = true;
        searchTrigger?.setAttribute('aria-expanded', 'false');
        if (restoreFocus) searchTrigger?.focus();
    }

    function closeMenuFlyout({ restoreFocus = false } = {}) {
        if (!menuFlyout || menuFlyout.hidden) return;
        menuFlyout.hidden = true;
        menuFlyoutTrigger?.setAttribute('aria-expanded', 'false');
        if (restoreFocus) menuFlyoutTrigger?.focus();
        menuFlyoutTrigger = null;
    }

    function closeAllFlyouts() {
        closeFavoritesMenu();
        closeSearchMenu();
        closeMenuFlyout();
    }

    function openModule(moduleId) {
        const link = findLink(moduleId);
        if (!isVisibleLink(link)) return;
        link.click();
    }

    function createFavoriteItem(moduleId) {
        const link = findLink(moduleId);
        if (!isVisibleLink(link)) return null;
        const title = getLinkTitle(link);
        const item = document.createElement('div');
        item.className = 'workspace-favorite-item';

        const openButton = document.createElement('button');
        openButton.type = 'button';
        openButton.className = 'workspace-favorite-open';
        openButton.dataset.workspaceOpen = moduleId;
        openButton.append(createIcon('fas fa-star'));
        const label = document.createElement('span');
        label.textContent = title;
        openButton.append(label);

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
            empty.append(createIcon('far fa-star'));
            const title = document.createElement('strong');
            title.textContent = '尚無收藏';
            const hint = document.createElement('span');
            hint.textContent = '點選功能旁的星號即可加入。';
            empty.append(title, hint);
            list.append(empty);
            return;
        }
        list.append(...items);
    }

    function openFavoritesMenu({ focusFirst = false } = {}) {
        if (!favoritesTrigger || !favoritesFlyout) return;
        closeSearchMenu();
        closeMenuFlyout();
        renderFavorites();
        favoritesFlyout.hidden = false;
        favoritesTrigger.setAttribute('aria-expanded', 'true');
        window.requestAnimationFrame(() => {
            positionFlyout(favoritesTrigger, favoritesFlyout);
            if (focusFirst) favoritesFlyout.querySelector('button')?.focus();
        });
    }

    function removeFavorite(moduleId) {
        const next = readList(FAVORITES_KEY).filter(item => item !== moduleId);
        writeList(FAVORITES_KEY, next);
        const star = Array.from(document.querySelectorAll('[data-favorite]'))
            .find(button => button.dataset.favorite === moduleId);
        if (star) setFavoriteButtonState(star, false);
        renderFavorites();
        positionFlyout(favoritesTrigger, favoritesFlyout);
    }

    function getSearchTargets() {
        const directLinks = Array.from(sidebar?.querySelectorAll('.menu-link[data-menu-id]') || [])
            .filter(link => !link.closest('.has-submenu'));
        return [...directLinks, ...links()].filter(isVisibleLink);
    }

    function renderSearchResults(term = '') {
        const list = searchFlyout?.querySelector('[data-workspace-search-results]');
        if (!list) return;
        const normalized = term.trim().toLocaleLowerCase('zh-TW');
        const matches = getSearchTargets().filter(link => {
            const searchable = `${getLinkTitle(link)} ${link.textContent}`.toLocaleLowerCase('zh-TW');
            return !normalized || searchable.includes(normalized);
        });

        list.replaceChildren();
        if (matches.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'workspace-favorites-empty';
            const title = document.createElement('strong');
            title.textContent = '找不到功能';
            empty.append(title);
            list.append(empty);
            return;
        }

        matches.forEach(link => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'workspace-favorite-open workspace-search-result';
            button.setAttribute('title', getLinkTitle(link));
            const sourceIcon = link.querySelector('i');
            button.append(createIcon(sourceIcon?.className || 'fas fa-link'));
            const label = document.createElement('span');
            label.textContent = getLinkTitle(link);
            button.append(label);
            button.addEventListener('click', () => {
                link.click();
                closeSearchMenu();
            });
            list.append(button);
        });
    }

    function openSearchMenu({ focusInput = false } = {}) {
        if (!searchTrigger || !searchFlyout) return;
        closeFavoritesMenu();
        closeMenuFlyout();
        searchFlyout.hidden = false;
        searchTrigger.setAttribute('aria-expanded', 'true');
        renderSearchResults(searchFlyoutInput?.value || '');
        window.requestAnimationFrame(() => {
            positionFlyout(searchTrigger, searchFlyout);
            if (focusInput) searchFlyoutInput?.focus();
        });
    }

    function filterInlineLinks(term = '') {
        const normalized = term.trim().toLocaleLowerCase('zh-TW');
        links().forEach(link => {
            const match = !normalized || `${getLinkTitle(link)} ${link.textContent}`.toLocaleLowerCase('zh-TW').includes(normalized);
            const listItem = link.closest('li');
            if (listItem) listItem.hidden = !match;
        });
    }

    function resetInlineSearch() {
        if (inlineSearchInput) inlineSearchInput.value = '';
        filterInlineLinks();
    }

    function renderMenuFlyout(menuLink) {
        const menuItem = menuLink.closest('.menu-item');
        const submenuLinks = Array.from(menuItem?.querySelectorAll('.submenu a') || []).filter(isVisibleLink);
        const title = getLinkTitle(menuLink);
        menuFlyout.replaceChildren(createFlyoutHeader(title, menuLink.querySelector('i')?.className || 'fas fa-list', '關閉功能選單', () => closeMenuFlyout({ restoreFocus: true })));
        const list = document.createElement('div');
        list.className = 'workspace-favorites-list';

        submenuLinks.forEach(link => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'workspace-favorite-open workspace-menu-item';
            button.setAttribute('title', getLinkTitle(link));
            button.append(createIcon(link.querySelector('i')?.className || 'fas fa-link'));
            const label = document.createElement('span');
            label.textContent = getLinkTitle(link);
            button.append(label);
            button.addEventListener('click', () => {
                link.click();
                closeMenuFlyout();
            });
            list.append(button);
        });

        if (submenuLinks.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'workspace-favorites-empty';
            const message = document.createElement('strong');
            message.textContent = '目前沒有可用功能';
            empty.append(message);
            list.append(empty);
        }
        menuFlyout.append(list);
    }

    function openCollapsedMenu(menuLink) {
        if (!sidebar?.closest('.app-container')?.classList.contains('sidebar-collapsed')) return false;
        if (!menuLink?.closest('.has-submenu') || !menuFlyout) return false;
        closeFavoritesMenu();
        closeSearchMenu();
        closeMenuFlyout();
        menuFlyoutTrigger = menuLink;
        renderMenuFlyout(menuLink);
        menuFlyout.hidden = false;
        menuLink.setAttribute('aria-expanded', 'true');
        window.requestAnimationFrame(() => positionFlyout(menuFlyoutTrigger, menuFlyout));
        return true;
    }

    function initFlyouts() {
        favoritesFlyout = document.createElement('aside');
        favoritesFlyout.id = 'workspace-favorites-flyout';
        favoritesFlyout.className = 'workspace-favorites-flyout';
        favoritesFlyout.hidden = true;
        favoritesFlyout.setAttribute('aria-label', '我的收藏選單');
        favoritesFlyout.append(createFlyoutHeader('我的收藏', 'fas fa-star', '關閉收藏選單', () => closeFavoritesMenu({ restoreFocus: true })));
        const favoritesList = document.createElement('div');
        favoritesList.className = 'workspace-favorites-list';
        favoritesList.dataset.workspaceFavoritesList = '';
        favoritesFlyout.append(favoritesList);

        searchFlyout = document.createElement('aside');
        searchFlyout.id = 'workspace-search-flyout';
        searchFlyout.className = 'workspace-favorites-flyout workspace-search-flyout';
        searchFlyout.hidden = true;
        searchFlyout.setAttribute('aria-label', '搜尋功能');
        searchFlyout.append(createFlyoutHeader('搜尋功能', 'fas fa-search', '關閉搜尋功能', () => closeSearchMenu({ restoreFocus: true })));
        const searchContent = document.createElement('div');
        searchContent.className = 'workspace-search-flyout-content';
        const searchLabel = document.createElement('label');
        searchLabel.className = 'workspace-search';
        searchLabel.append(createIcon('fas fa-search'));
        searchFlyoutInput = document.createElement('input');
        searchFlyoutInput.type = 'search';
        searchFlyoutInput.placeholder = '搜尋功能…';
        searchFlyoutInput.setAttribute('aria-label', '搜尋功能');
        searchLabel.append(searchFlyoutInput);
        const searchResults = document.createElement('div');
        searchResults.className = 'workspace-favorites-list';
        searchResults.dataset.workspaceSearchResults = '';
        searchContent.append(searchLabel, searchResults);
        searchFlyout.append(searchContent);

        menuFlyout = document.createElement('aside');
        menuFlyout.id = 'workspace-menu-flyout';
        menuFlyout.className = 'workspace-favorites-flyout workspace-menu-flyout';
        menuFlyout.hidden = true;
        menuFlyout.setAttribute('aria-label', '功能選單');

        document.body.appendChild(favoritesFlyout);
        document.body.appendChild(searchFlyout);
        document.body.appendChild(menuFlyout);
    }

    function bindFlyoutEvents() {
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
        searchTrigger.addEventListener('click', () => {
            if (searchFlyout.hidden) openSearchMenu({ focusInput: true });
            else closeSearchMenu();
        });
        searchTrigger.addEventListener('keydown', event => {
            if (['ArrowRight', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                openSearchMenu({ focusInput: true });
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
            if (removeButton) removeFavorite(removeButton.dataset.removeFavorite);
        });
        searchFlyoutInput.addEventListener('input', event => {
            renderSearchResults(event.target.value);
            positionFlyout(searchTrigger, searchFlyout);
        });
        [favoritesFlyout, searchFlyout, menuFlyout].forEach(flyout => {
            flyout.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    if (flyout === favoritesFlyout) closeFavoritesMenu({ restoreFocus: true });
                    if (flyout === searchFlyout) closeSearchMenu({ restoreFocus: true });
                    if (flyout === menuFlyout) closeMenuFlyout({ restoreFocus: true });
                }
            });
        });
        sidebar.addEventListener('click', event => {
            const favorite = event.target.closest('[data-favorite]');
            if (!favorite) return;
            event.preventDefault();
            event.stopPropagation();
            const id = favorite.dataset.favorite;
            const current = readList(FAVORITES_KEY);
            const next = current.includes(id) ? current.filter(item => item !== id) : [id, ...current];
            writeList(FAVORITES_KEY, next);
            setFavoriteButtonState(favorite, next.includes(id));
            renderFavorites();
        });
        document.addEventListener('pointerdown', event => {
            const inOpenFlyout = [favoritesFlyout, searchFlyout, menuFlyout].some(flyout => flyout && !flyout.hidden && flyout.contains(event.target));
            const onTrigger = [favoritesTrigger, searchTrigger, menuFlyoutTrigger].some(trigger => trigger?.contains(event.target));
            if (!inOpenFlyout && !onTrigger) closeAllFlyouts();
        });
        window.addEventListener('resize', positionOpenFlyouts);
        sidebar.addEventListener('scroll', closeAllFlyouts);
    }

    document.addEventListener('DOMContentLoaded', () => {
        sidebar = document.querySelector('.sidebar');
        const nav = sidebar?.querySelector('nav');
        if (!nav) return;

        const panel = document.createElement('section');
        panel.className = 'workspace-nav-panel';
        panel.setAttribute('aria-label', '工作區快速導覽');
        panel.innerHTML = `
            <label class="workspace-search"><span class="sr-only">搜尋功能</span><i class="fas fa-search" aria-hidden="true"></i><input type="search" placeholder="搜尋功能…" data-workspace-search></label>
            <button type="button" class="workspace-favorites-trigger workspace-search-trigger" data-workspace-search-trigger aria-expanded="false" aria-controls="workspace-search-flyout" aria-label="搜尋功能" title="搜尋功能"><span class="workspace-favorites-trigger-label"><i class="fas fa-search" aria-hidden="true"></i><span>搜尋功能</span></span></button>
            <button type="button" class="workspace-favorites-trigger" data-workspace-favorites-trigger aria-expanded="false" aria-controls="workspace-favorites-flyout">
                <span class="workspace-favorites-trigger-label"><i class="fas fa-star" aria-hidden="true"></i><span>我的收藏</span></span>
                <span class="workspace-favorites-trigger-meta"><span class="workspace-favorites-count" data-workspace-favorites-count>0</span><i class="fas fa-chevron-right" aria-hidden="true"></i></span>
            </button>`;
        nav.prepend(panel);

        inlineSearchInput = panel.querySelector('[data-workspace-search]');
        searchTrigger = panel.querySelector('[data-workspace-search-trigger]');
        favoritesTrigger = panel.querySelector('[data-workspace-favorites-trigger]');
        initFlyouts();

        links().forEach(link => {
            const moduleId = link.dataset.page;
            const star = document.createElement('button');
            star.type = 'button';
            star.className = 'workspace-favorite-toggle';
            star.dataset.favorite = moduleId;
            star.dataset.favoriteTitle = getLinkTitle(link);
            setFavoriteButtonState(star, readList(FAVORITES_KEY).includes(moduleId));
            link.after(star);
        });

        inlineSearchInput.addEventListener('input', event => filterInlineLinks(event.target.value));
        bindFlyoutEvents();
        renderFavorites();

        window.WorkspaceNavigation = {
            closeAll: () => {
                resetInlineSearch();
                closeAllFlyouts();
            },
            openCollapsedMenu
        };
    });
})();
