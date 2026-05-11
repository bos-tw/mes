/**
 * 精密光學篩選管理系統 - 使用指南腳本
 */

(function() {
    'use strict';

    // 狀態
    let currentArticleId = null;

    // DOM 元素 - 延遲取得
    let sidebar, sidebarNav, mainContent, contentArea, tocSidebar, tocList;
    let searchInput, searchModal, searchModalInput, searchResults;
    let sidebarToggle, backToTop;

    /**
     * 初始化 DOM 元素
     */
    function initDOMElements() {
        sidebar = document.getElementById('sidebar');
        sidebarNav = document.getElementById('sidebar-nav');
        mainContent = document.getElementById('main-content');
        contentArea = document.getElementById('content-area');
        tocSidebar = document.getElementById('toc-sidebar');
        tocList = document.getElementById('toc-list');
        searchInput = document.getElementById('search-input');
        searchModal = document.getElementById('search-modal');
        searchModalInput = document.getElementById('search-modal-input');
        searchResults = document.getElementById('search-results');
        sidebarToggle = document.getElementById('sidebar-toggle');
        backToTop = document.getElementById('back-to-top');
    }

    /**
     * 初始化
     */
    function init() {
        console.log('Help system initializing...');
        initDOMElements();
        console.log('DOM Elements:', { sidebarNav, contentArea, mainContent });
        console.log('HELP_CONTENT:', typeof HELP_CONTENT !== 'undefined' ? 'loaded' : 'NOT FOUND');

        // 合併補充流程內容（workflow-content.js 的較詳細版本覆蓋 content.js 的簡短版本）
        if (typeof WORKFLOW_ARTICLES !== 'undefined' && typeof HELP_CONTENT !== 'undefined') {
            Object.assign(HELP_CONTENT.articles, WORKFLOW_ARTICLES);
            console.log('WORKFLOW_ARTICLES merged:', Object.keys(WORKFLOW_ARTICLES).length, '篇');
        }

        renderNavigation();
        setupEventListeners();
        loadInitialContent();
        setupScrollListeners();
        console.log('Help system initialized.');
    }

    /**
     * 渲染側邊導航
     */
    function renderNavigation() {
        if (!sidebarNav) {
            console.error('sidebarNav 未找到');
            return;
        }
        if (typeof HELP_CONTENT === 'undefined') {
            console.error('HELP_CONTENT 未定義');
            return;
        }

        let html = '';
        
        HELP_CONTENT.navigation.forEach((group, groupIndex) => {
            const isExpanded = groupIndex < 3; // 預設展開前三組
            html += `
                <div class="nav-group ${isExpanded ? 'expanded' : ''}">
                    <div class="nav-group-title">
                        <i class="fas fa-chevron-right"></i>
                        <span>${group.group}</span>
                    </div>
                    <ul class="nav-group-items">
            `;
            
            group.items.forEach(item => {
                html += `
                    <li>
                        <a href="#${item.id}" class="nav-item" data-article-id="${item.id}">
                            <i class="fas ${item.icon}"></i>
                            <span>${item.title}</span>
                        </a>
                    </li>
                `;
            });
            
            html += `
                    </ul>
                </div>
            `;
        });

        sidebarNav.innerHTML = html;
    }

    /**
     * 設定事件監聽器
     */
    function setupEventListeners() {
        // 導航群組展開/收合
        document.addEventListener('click', e => {
            const groupTitle = e.target.closest('.nav-group-title');
            if (groupTitle) {
                const group = groupTitle.closest('.nav-group');
                group.classList.toggle('expanded');
            }
        });

        // 導航項目點擊
        document.addEventListener('click', e => {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                const articleId = navItem.dataset.articleId;
                loadArticle(articleId);
                
                // 手機版關閉選單
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // 搜尋框
        if (searchInput) {
            searchInput.addEventListener('focus', () => {
                openSearchModal();
            });
        }

        // 搜尋 Modal
        if (searchModal) {
            // 關閉按鈕（#close-search-modal 有 class="modal-close"）
            searchModal.querySelector('#close-search-modal')?.addEventListener('click', closeSearchModal);
            
            // 點擊背景關閉
            searchModal.addEventListener('click', e => {
                if (e.target === searchModal) {
                    closeSearchModal();
                }
            });

            // ESC 關閉
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && searchModal.classList.contains('open')) {
                    closeSearchModal();
                }
            });
        }

        // 搜尋輸入
        if (searchModalInput) {
            searchModalInput.addEventListener('input', debounce(handleSearch, 300));
        }

        // 側邊欄切換按鈕
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
            });
        }

        // 回到頂部按鈕
        if (backToTop) {
            backToTop.addEventListener('click', () => {
                if (mainContent) {
                    mainContent.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }

        // 鍵盤快捷鍵
        document.addEventListener('keydown', e => {
            // Ctrl+K 或 / 開啟搜尋
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !isInputFocused())) {
                e.preventDefault();
                openSearchModal();
            }
        });

        // TOC 項目點擊
        document.addEventListener('click', e => {
            const tocLink = e.target.closest('.toc-list a');
            if (tocLink) {
                e.preventDefault();
                const targetId = tocLink.getAttribute('href').slice(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    /**
     * 載入初始內容
     */
    function loadInitialContent() {
        // 從 URL hash 或預設載入第一篇
        const hash = window.location.hash.slice(1);
        const articleId = hash && HELP_CONTENT.articles[hash] ? hash : 'introduction';
        loadArticle(articleId);

        // 監聽 hash 變化
        window.addEventListener('hashchange', () => {
            const newHash = window.location.hash.slice(1);
            if (newHash && HELP_CONTENT.articles[newHash] && newHash !== currentArticleId) {
                loadArticle(newHash);
            }
        });
    }

    /**
     * 載入文章
     */
    function loadArticle(articleId) {
        const article = HELP_CONTENT.articles[articleId];
        if (!article) {
            console.error('找不到文章:', articleId);
            return;
        }

        currentArticleId = articleId;
        
        // 更新 URL
        history.pushState(null, '', `#${articleId}`);

        // 渲染內容
        if (contentArea) {
            contentArea.innerHTML = article.content;
        } else {
            console.error('contentArea 未找到');
        }

        // 更新活動導航項目
        updateActiveNavItem(articleId);

        // 產生 TOC
        generateTOC();

        // 滾動到頂部
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 高亮程式碼（如果有）
        highlightCode();
    }

    /**
     * 更新活動導航項目
     */
    function updateActiveNavItem(articleId) {
        // 移除所有 active
        document.querySelectorAll('.nav-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // 設定新的 active
        const activeItem = document.querySelector(`.nav-item[data-article-id="${articleId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            
            // 確保所屬群組展開
            const group = activeItem.closest('.nav-group');
            if (group && !group.classList.contains('expanded')) {
                group.classList.add('expanded');
            }
        }
    }

    /**
     * 產生目錄 (Table of Contents)
     */
    function generateTOC() {
        if (!tocList || !contentArea) return;

        const headings = contentArea.querySelectorAll('h2, h3');
        
        if (headings.length === 0) {
            if (tocSidebar) tocSidebar.style.display = 'none';
            return;
        }

        if (tocSidebar) tocSidebar.style.display = 'block';
        
        let html = '';
        let h2Index = 0;

        headings.forEach((heading, index) => {
            // 為標題添加 ID
            const id = `heading-${index}`;
            heading.id = id;

            const isH2 = heading.tagName === 'H2';
            if (isH2) h2Index++;

            html += `
                <li class="${isH2 ? '' : 'toc-h3'}">
                    <a href="#${id}">${heading.textContent}</a>
                </li>
            `;
        });

        tocList.innerHTML = html;
    }

    /**
     * 設定滾動監聽
     */
    function setupScrollListeners() {
        if (!mainContent) return;

        mainContent.addEventListener('scroll', () => {
            const scrollTop = mainContent.scrollTop;
            
            // 回到頂部按鈕顯示/隱藏
            if (backToTop) {
                if (scrollTop > 300) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            }

            // 更新 TOC 高亮
            updateTOCHighlight();
        });
    }

    /**
     * 更新 TOC 高亮
     */
    function updateTOCHighlight() {
        if (!contentArea) return;
        
        const headings = contentArea.querySelectorAll('h2, h3');
        const tocLinks = tocList?.querySelectorAll('a');
        
        if (!headings.length || !tocLinks?.length) return;

        let activeIndex = 0;
        const scrollTop = mainContent ? mainContent.scrollTop : window.scrollY;

        headings.forEach((heading, index) => {
            if (heading.offsetTop - 100 <= scrollTop) {
                activeIndex = index;
            }
        });

        tocLinks.forEach((link, index) => {
            if (index === activeIndex) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * 開啟搜尋 Modal
     */
    function openSearchModal() {
        if (!searchModal) return;
        
        searchModal.classList.add('open');
        searchModalInput?.focus();
    }

    /**
     * 關閉搜尋 Modal
     */
    function closeSearchModal() {
        if (!searchModal) return;
        
        searchModal.classList.remove('open');
        if (searchModalInput) {
            searchModalInput.value = '';
        }
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    /**
     * 處理搜尋
     */
    function handleSearch() {
        const query = searchModalInput?.value.trim().toLowerCase();
        if (!query || query.length < 2) {
            searchResults.innerHTML = '<div class="no-results">請輸入至少 2 個字元</div>';
            return;
        }

        const results = [];
        
        // 搜尋文章
        for (const [id, article] of Object.entries(HELP_CONTENT.articles)) {
            const title = article.title.toLowerCase();
            const content = stripHtml(article.content).toLowerCase();
            
            if (title.includes(query) || content.includes(query)) {
                // 擷取相關片段
                let excerpt = '';
                const contentIndex = content.indexOf(query);
                if (contentIndex !== -1) {
                    const start = Math.max(0, contentIndex - 50);
                    const end = Math.min(content.length, contentIndex + 100);
                    excerpt = '...' + content.slice(start, end) + '...';
                    excerpt = excerpt.replace(new RegExp(query, 'gi'), '<mark>$&</mark>');
                }
                
                results.push({
                    id,
                    title: article.title,
                    titleMatch: title.includes(query),
                    excerpt
                });
            }
        }

        // 排序：標題匹配優先
        results.sort((a, b) => b.titleMatch - a.titleMatch);

        // 渲染結果
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">找不到符合的結果</div>';
        } else {
            let html = '';
            results.forEach(result => {
                const highlightedTitle = result.title.replace(new RegExp(query, 'gi'), '<mark>$&</mark>');
                html += `
                    <div class="search-result-item" data-article-id="${result.id}">
                        <div class="result-title">${highlightedTitle}</div>
                        ${result.excerpt ? `<div class="result-excerpt">${result.excerpt}</div>` : ''}
                    </div>
                `;
            });
            searchResults.innerHTML = html;

            // 搜尋結果點擊
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const articleId = item.dataset.articleId;
                    loadArticle(articleId);
                    closeSearchModal();
                });
            });
        }
    }

    /**
     * 高亮程式碼
     */
    function highlightCode() {
        // 如果有引入 Prism.js 或其他語法高亮庫
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }
    }

    /**
     * 工具函數：防抖
     */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * 工具函數：移除 HTML 標籤
     */
    function stripHtml(html) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        return temp.textContent || temp.innerText || '';
    }

    /**
     * 工具函數：檢查是否在輸入框中
     */
    function isInputFocused() {
        const active = document.activeElement;
        return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
    }

    // 當 DOM 載入完成後初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
