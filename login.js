(function () {
    function handleSuccess(message) {
        const successBanner = document.getElementById('login-success');
        const errorBanner = document.getElementById('login-error');
        if (errorBanner) {
            errorBanner.style.display = 'none';
            errorBanner.textContent = '';
        }
        if (successBanner) {
            successBanner.textContent = message;
            successBanner.style.display = 'block';
        }
    }

    function handleError(message) {
        const errorBanner = document.getElementById('login-error');
        const successBanner = document.getElementById('login-success');
        if (successBanner) {
            successBanner.style.display = 'none';
            successBanner.textContent = '';
        }
        if (errorBanner) {
            errorBanner.textContent = message;
            errorBanner.style.display = 'block';
        }
    }

    async function checkExistingSession() {
        try {
            const response = await fetch('api/session.php', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                return false;
            }

            const result = await response.json();
            if (result.success) {
                window.location.href = 'index.php';
                return true;
            }
        } catch (error) {
            console.warn('檢查登入狀態時發生錯誤：', error);
        }

        return false;
    }

    function bindPasswordToggle(passwordInput, toggleButton) {
        if (!passwordInput || !toggleButton) {
            return;
        }

        toggleButton.addEventListener('click', () => {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            const icon = toggleButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    async function submitLogin({ account, password, rememberMe }) {
        const response = await fetch('api/login.php', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ account, password, rememberMe }),
        });

        const result = await response.json().catch(() => ({ success: false, message: '無法解析伺服器回應。' }));

        if (!response.ok || !result.success) {
            throw new Error(result.message || '登入失敗，請稍後再試。');
        }

        return result;
    }

    function initFuiParticles() {
        const container = document.getElementById('fui-particles');
        if (!container) return;
        const count = 30;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('span');
            // 約 30% 為灰色粒子
            const isGray = Math.random() < 0.3;
            p.className = 'fui-particle' + (isGray ? ' fui-particle-gray' : '');
            const size = Math.random() > 0.68 ? 3 : 2;
            p.style.cssText = [
                'left:'                + (Math.random() * 100) + 'vw',
                'width:'               + size + 'px',
                'height:'              + size + 'px',
                'animation-duration:'  + (12 + Math.random() * 20) + 's',
                'animation-delay:'     + (Math.random() * 16) + 's',
                'opacity:'             + (0.25 + Math.random() * 0.75),
            ].join(';');
            container.appendChild(p);
        }
    }

    async function loadCompanyBranding() {
        try {
            const [infoRes, logoRes] = await Promise.all([
                fetch('api/companies/public_info.php?id=1'),
                fetch('api/companies/public_logo.php?company_id=1'),
            ]);

            // 公司名稱
            if (infoRes.ok) {
                const info = await infoRes.json();
                if (info.success && info.data && info.data.name) {
                    const nameEl = document.getElementById('company-full-name');
                    if (nameEl) nameEl.textContent = info.data.name;
                }
            }

            // 公司 LOGO
            if (logoRes.ok) {
                const logo = await logoRes.json();
                if (logo.success && logo.data && logo.data.file_path) {
                    const wrap = document.getElementById('company-logo-wrap');
                    const fallback = document.getElementById('company-logo-fallback');
                    if (wrap) {
                        const img = document.createElement('img');
                        img.src = logo.data.file_path;
                        img.alt = '公司 LOGO';
                        img.className = 'company-logo-img';
                        img.onerror = function () {
                            // 圖片載入失敗時保留 fallback icon
                            img.remove();
                            if (fallback) fallback.style.display = '';
                        };
                        if (fallback) fallback.style.display = 'none';
                        wrap.appendChild(img);
                    }
                }
            }
        } catch (_e) {
            // 靜默忽略，保持預設外觀
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        const loginForm = document.getElementById('login-form');
        const togglePassword = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember-me');
        const accountInput = document.getElementById('account');
        const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
        const copyrightYear = document.getElementById('login-year');

        if (copyrightYear) {
            copyrightYear.textContent = new Date().getFullYear().toString();
        }

        // 載入公司名稱與 LOGO（不阻塞登入流程）
        loadCompanyBranding();

        // 初始化 FUI 粒子動畫
        initFuiParticles();

        bindPasswordToggle(passwordInput, togglePassword);

        const alreadyLoggedIn = await checkExistingSession();
        if (alreadyLoggedIn) {
            return;
        }

        if (!loginForm || !accountInput || !passwordInput || !rememberCheckbox) {
            handleError('登入表單載入失敗，請重新整理頁面。');
            return;
        }

        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const account = accountInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberCheckbox.checked;

            if (!account || !password) {
                handleError('請輸入帳號與密碼。');
                return;
            }

            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = '登入中...';
            }

            try {
                const result = await submitLogin({ account, password, rememberMe });

                // 儲存 CSRF Token 供後續 API 請求使用
                if (result.csrf_token) {
                    sessionStorage.setItem('csrf_token', result.csrf_token);
                }

                handleSuccess(result.message || '登入成功，正在為您轉址...');

                setTimeout(() => {
                    window.location.href = 'index.php';
                }, 600);
            } catch (error) {
                handleError(error.message || '登入失敗，請稍後再試。');
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = '登入系統';
                }
            }
        });
    });
})();
