document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    const navLinksUl = document.getElementById('nav-links');
    const langSwitcherMenu = document.getElementById('lang-switcher-menu');
    let currentLang = 'ja'; // Default language

    const i18n = {
        ja: {
            title: 'xReality・知的解析研究室',
            footer: '&copy; 2025 xReality・知的解析研究室',
            langName: '日本語',
            recentNews: '最新ニュース',
            showMore: 'もっと表示する'
        },
        en: {
            title: 'xReality & Intellectual Analysis Laboratory',
            footer: '&copy; 2025 xReality & Intellectual Analysis Laboratory',
            langName: 'English',
            recentNews: 'Recent News',
            showMore: 'Show More'
        }
    };

    const routes = {
        '/': 'home.md',
        '/research': 'research.md',
        '/member': 'members.csv',
        '/publications': 'publications.json',
        '/news': 'news.json', // Special route for news list
        '/courses': 'courses.md'
    };

    const loadAndRenderNavigation = async (lang) => {
        try {
            const response = await fetch(`locales/${lang}/navigation.md`);
            if (!response.ok) throw new Error('Navigation file not found');
            const md = await response.text();
            const html = marked.parse(md, { gfm: true });
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            navLinksUl.innerHTML = ''; // Clear previous links
            tempDiv.querySelectorAll('a').forEach(a => {
                const li = document.createElement('li');
                li.className = 'nav-item';
                
                const originalPath = a.getAttribute('href');
                const finalPath = (originalPath === '/') ? `/${lang}` : `/${lang}${originalPath}`;
                
                a.className = 'nav-link';
                a.href = `#${finalPath}`;
                
                li.appendChild(a);
                navLinksUl.appendChild(li);
            });
        } catch (error) {
            console.error('Could not load navigation:', error);
            navLinksUl.innerHTML = '<li class="nav-item"><span class="nav-link text-danger">Failed to load navigation</span></li>';
        }
    };

    const updateUI = () => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18n[currentLang][key]) {
                el.innerHTML = i18n[currentLang][key];
            }
        });
        // Update language switcher button text
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) {
            langSwitcher.innerHTML = `<i class="fas fa-globe"></i> ${i18n[currentLang].langName || 'Language'}`;
        }
        updateLangSwitcher();
        loadAndRenderNavigation(currentLang);
    };

    const renderPublicationsList = (publications) => {
        let html = '<div class="row">';
        publications.forEach(item => {
            const cardInnerHtml = `
                <div class="card publication-card">
                    <div class="card-body">
                        <h5 class="card-title publication-title">${item.title}</h5>
                        <p class="card-text publication-authors">${item.authors}</p>
                        <p class="card-text publication-journal"><em>${item.journal}, ${item.year}</em></p>
                    </div>
                    <div class="card-footer d-flex justify-content-end">` +
                (item.links.pdf ? `<a href="${item.links.pdf}" class="btn btn-pdf btn-sm me-2" target="_blank" rel="noopener noreferrer"><i class="fas fa-file-pdf me-1"></i>PDF</a>` : '') +
                (item.links.web ? `<a href="${item.links.web}" class="btn btn-web btn-sm me-2" target="_blank" rel="noopener noreferrer"><i class="fas fa-external-link-alt me-1"></i>Web</a>` : '') +
                (item.links.doi ? `<a href="https://doi.org/${item.links.doi}" class="btn btn-doi btn-sm" target="_blank" rel="noopener noreferrer"><i class="fas fa-link me-1"></i>DOI</a>` : '') +
                '</div></div>';

            html += '<div class="col-md-12 mb-4">';
            if (item.links.web) {
                html += `<a href="${item.links.web}" target="_blank" rel="noopener noreferrer" class="text-decoration-none publication-link">${cardInnerHtml}</a>`;
            } else {
                html += cardInnerHtml;
            }
            html += '</div>';
        });
        html += '</div>';
        return html;
    };

    const renderNewsList = (newsItems) => {
        let html = '<div class="row">';
        newsItems.forEach(item => {
            const link = item.url 
                ? item.url
                : `#/${currentLang}/news/${item.file.replace('.md','')}`;
            const target = item.url ? 'target="_blank" rel="noopener noreferrer"' : '';
            const thumbnail = item.thumbnail ? item.thumbnail : '../images/logo.png';

            html += `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <a href="${link}" ${target} class="text-decoration-none text-dark">
                            <div class="bg-image hover-overlay">
                                <img src="${thumbnail}" class="card-img-top" alt="${item.title}"/>
                                <div class="mask" style="background-color: rgba(251, 251, 251, 0.15);"></div>
                            </div>
                            <div class="card-body">
                                <h5 class="card-title">${item.title}</h5>
                                <p class="card-text"><small class="text-muted">${item.date}</small></p>
                            </div>
                        </a>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        return html;
    };

    const loadContent = async (lang, path) => {
        const pathParts = path.split('/').filter(p => p);
        const baseRoute = `/${pathParts[0] || ''}`;
        const articleId = pathParts[1];

        try {
            // Handle individual member or news articles
            if ((baseRoute === '/news' || baseRoute === '/member') && articleId) {
                const folder = baseRoute === '/news' ? 'news' : 'members';
                const response = await fetch(`locales/${lang}/${folder}/${articleId}.md`);
                if (!response.ok) throw new Error(`File not found: ${articleId}.md in ${folder}`);
                const md = await response.text();
                content.innerHTML = marked.parse(md);
                return;
            }

            const page = routes[baseRoute] || 'home.md';
            const src = `locales/${lang}/${page}`;
            const response = await fetch(src);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${src}`);
            const data = await response.text();

            let mainContentHtml = '';

            // Handle news list page
            if (page === 'news.json') {
                const newsItems = JSON.parse(data).sort((a, b) => new Date(b.date) - new Date(a.date));
                mainContentHtml = renderNewsList(newsItems);
            }
            // Handle publications page
            else if (page === 'publications.json') {
                const publications = JSON.parse(data).sort((a, b) => b.year - a.year);
                mainContentHtml = renderPublicationsList(publications);
            }
            // Handle Markdown pages
            else if (src.endsWith('.md')) {
                const renderer = new marked.Renderer();
                renderer.table = (header, body) => `<div class="table-responsive"><table class="table table-striped"><thead>${header}</thead><tbody>${body}</tbody></table></div>`;
                mainContentHtml = marked.parse(data, { renderer });
                // Process internal links in Markdown to use hash-based routing
                mainContentHtml = mainContentHtml.replace(/href="\/([^"]+)"/g, (match, path) => {
                    // Skip external links (http, mailto, etc.)
                    if (path.startsWith('http') || path.startsWith('mailto:') || path.startsWith('#')) {
                        return match;
                    }
                    return `href="#/${currentLang}/${path}"`;
                });
            }
            // Handle CSV pages (members)
            else if (src.endsWith('.csv')) {
                const rows = data.trim().split('\n');
                const headers = rows[0].split(',');
                const nameIndex = headers.indexOf('Name') > -1 ? headers.indexOf('Name') : headers.indexOf('氏名');
                const posIndex = headers.indexOf('Position') > -1 ? headers.indexOf('Position') : headers.indexOf('役職');
                const themeIndex = headers.indexOf('Research Theme') > -1 ? headers.indexOf('Research Theme') : headers.indexOf('研究テーマ');
                const imageIndex = headers.indexOf('Image') > -1 ? headers.indexOf('Image') : headers.indexOf('画像');
                const linkIndex = headers.indexOf('Link') > -1 ? headers.indexOf('Link') : headers.indexOf('リンク');

                const graduatedYearIndex = headers.indexOf('Graduated Year') > -1 ? headers.indexOf('Graduated Year') : headers.indexOf('卒業年');

                let cardsHtml = '<div class="row">';
                const graduatesByYear = {};
                let hasGraduates = false;

                for (let i = 1; i < rows.length; i++) {
                    const cells = rows[i].split(',');
                    const graduatedYear = graduatedYearIndex > -1 ? cells[graduatedYearIndex] : '';

                    const imageUrl = cells[imageIndex] || '../images/logo.png';
                    const linkValue = cells[linkIndex];

                    const cardInnerHtml = `
                        <div class="card text-center h-100">
                            <div class="card-body">
                                <img src="${imageUrl}" class="rounded-circle mb-3 member-img" alt="${cells[nameIndex]}">
                                <h5 class="card-title">${cells[nameIndex]}</h5>
                                <h6 class="card-subtitle mb-2 text-muted">${cells[posIndex]}</h6>
                                <p class="card-text">${cells[themeIndex]}</p>
                            </div>
                        </div>
                    `;

                    let cardHtml = '<div class="col-md-4 col-lg-3 mb-4">';
                    if (linkValue) {
                        if (linkValue.startsWith('http')) {
                            cardHtml += `<a href="${linkValue}" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-dark">${cardInnerHtml}</a>`;
                        } else {
                            cardHtml += `<a href="#/${currentLang}/member/${linkValue}" class="text-decoration-none text-dark">${cardInnerHtml}</a>`;
                        }
                    } else {
                        cardHtml += cardInnerHtml;
                    }
                    cardHtml += '</div>';

                    if (graduatedYear && graduatedYear.trim() !== '') {
                        const yearKey = graduatedYear.trim();
                        if (!graduatesByYear[yearKey]) {
                            graduatesByYear[yearKey] = [];
                        }
                        graduatesByYear[yearKey].push(cardHtml);
                        hasGraduates = true;
                    } else {
                        cardsHtml += cardHtml;
                    }
                }
                cardsHtml += '</div>';

                // Build graduates section grouped by year (desc)
                let graduatesHtml = '';
                if (hasGraduates) {
                    const sectionTitle = currentLang === 'ja' ? '卒業' : 'Graduates';
                    graduatesHtml += `<h2 class="mt-5 mb-3">${sectionTitle}</h2>`;
                    const years = Object.keys(graduatesByYear)
                        .filter(y => y)
                        .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
                    years.forEach(year => {
                        graduatesHtml += `<h3 class="mt-4 mb-2">${year}</h3>`;
                        graduatesHtml += '<div class="row">';
                        graduatesByYear[year].forEach(card => {
                            graduatesHtml += card;
                        });
                        graduatesHtml += '</div>';
                    });
                }

                mainContentHtml = cardsHtml + graduatesHtml;
            }

            content.innerHTML = mainContentHtml;

            // If it's the home page, load and append latest news
            if (baseRoute === '/') {
                const newsResponse = await fetch(`locales/${lang}/news.json`);
                const allNews = JSON.parse(await newsResponse.text());
                const latestNews = allNews.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
                
                let newsHtml = `<hr class="my-4"><h2 class="mt-5 mb-3">${i18n[lang].recentNews}</h2>`;
                newsHtml += renderNewsList(latestNews);
                newsHtml += `
                    <div class="text-end mt-3">
                        <a href="#/${currentLang}/news" class="btn btn-outline-light">${i18n[currentLang].showMore}</a>
                    </div>
                `;
                content.innerHTML += newsHtml;
            }

            // Process any remaining internal links in content to use hash-based routing
            // (This handles links that might have been added dynamically, like news items)
            setTimeout(() => {
                content.querySelectorAll('a').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('#')) {
                        link.href = `#/${currentLang}${href}`;
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            window.location.hash = `/${currentLang}${href}`;
                        });
                    }
                });
            }, 0);

        } catch (error) {
            console.error('Error loading content:', error);
            const errorMessage = error.message && error.message.includes('not found') 
                ? `Content not found: ${error.message}` 
                : 'Content could not be loaded.';
            content.innerHTML = `<div class="alert alert-danger">${errorMessage}</div>`;
        }
    };

    const handleLocation = () => {
        const hash = window.location.hash.slice(1) || '/';
        const parts = hash.split('/').filter(p => p);
        let lang = parts[0];
        let pagePath;

        if (i18n[lang]) {
            currentLang = lang;
            pagePath = '/' + (parts.slice(1).join('/') || '');
        } else {
            lang = currentLang;
            pagePath = hash;
            const newHash = `/${lang}${hash === '/' ? '' : hash}`.replace('//', '/');
            window.location.hash = newHash;
            return;
        }

        updateUI();
        loadContent(currentLang, pagePath);
    };

    const updateLangSwitcher = () => {
        langSwitcherMenu.innerHTML = '';
        for (const langCode in i18n) {
            if (i18n[langCode].langName) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = `dropdown-item ${langCode === currentLang ? 'active' : ''}`;
                a.href = '#';
                a.textContent = i18n[langCode].langName;
                a.setAttribute('data-lang', langCode);
                li.appendChild(a);
                langSwitcherMenu.appendChild(li);
            }
        }
        
        // Re-initialize Bootstrap/MDB dropdown if available
        const langSwitcher = document.getElementById('lang-switcher');
        if (langSwitcher) {
            // Try MDB Dropdown first
            if (window.mdb && window.mdb.Dropdown) {
                const existingDropdown = window.mdb.Dropdown.getInstance(langSwitcher);
                if (existingDropdown) {
                    existingDropdown.dispose();
                }
                new window.mdb.Dropdown(langSwitcher);
            }
            // Fallback to Bootstrap Dropdown
            else if (window.bootstrap && window.bootstrap.Dropdown) {
                const existingDropdown = window.bootstrap.Dropdown.getInstance(langSwitcher);
                if (existingDropdown) {
                    existingDropdown.dispose();
                }
                new window.bootstrap.Dropdown(langSwitcher);
            }
        }
    };

    navLinksUl.addEventListener('click', (e) => {
        const navbarCollapse = document.getElementById('navbarNav');
        if (navbarCollapse.classList.contains('show')) {
            const navbarToggler = document.querySelector('.navbar-toggler');
            navbarToggler.click();
        }
    });

    // Use event delegation for language switcher menu (handles dynamically added items)
    langSwitcherMenu.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = e.target.closest('[data-lang]');
        if (target) {
            const lang = target.getAttribute('data-lang');
            if (lang && lang !== currentLang) {
                const currentHash = window.location.hash.slice(1);
                const newHash = currentHash.replace(`/${currentLang}`, `/${lang}`);
                window.location.hash = newHash;
            }
            
            // Close dropdown menu after selection
            const langSwitcher = document.getElementById('lang-switcher');
            if (langSwitcher) {
                // Try MDB Dropdown first
                if (window.mdb && window.mdb.Dropdown) {
                    const dropdown = window.mdb.Dropdown.getInstance(langSwitcher);
                    if (dropdown) {
                        dropdown.hide();
                    }
                }
                // Fallback to Bootstrap Dropdown
                else if (window.bootstrap && window.bootstrap.Dropdown) {
                    const dropdown = window.bootstrap.Dropdown.getInstance(langSwitcher);
                    if (dropdown) {
                        dropdown.hide();
                    }
                }
                // Fallback: manually remove show class
                else {
                    langSwitcherMenu.classList.remove('show');
                    langSwitcher.setAttribute('aria-expanded', 'false');
                }
            }
        }
    });

    // Initialize navbar collapse for mobile
    const initializeNavbarCollapse = () => {
        const navbarToggler = document.querySelector('.navbar-toggler');
        const navbarCollapse = document.getElementById('navbarNav');
        
        if (navbarToggler && navbarCollapse) {
            // Add manual click handler to ensure it works
            navbarToggler.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Toggle the show class
                navbarCollapse.classList.toggle('show');
                
                // Update aria-expanded
                const isExpanded = navbarCollapse.classList.contains('show');
                navbarToggler.setAttribute('aria-expanded', isExpanded.toString());
                
                // Try to use MDB/Bootstrap Collapse if available
                if (window.mdb && window.mdb.Collapse) {
                    const collapseInstance = window.mdb.Collapse.getInstance(navbarCollapse);
                    if (collapseInstance) {
                        if (isExpanded) {
                            collapseInstance.show();
                        } else {
                            collapseInstance.hide();
                        }
                    }
                } else if (window.bootstrap && window.bootstrap.Collapse) {
                    const collapseInstance = window.bootstrap.Collapse.getInstance(navbarCollapse);
                    if (collapseInstance) {
                        if (isExpanded) {
                            collapseInstance.show();
                        } else {
                            collapseInstance.hide();
                        }
                    }
                }
            });
            
            // Also initialize MDB/Bootstrap Collapse if available
            setTimeout(() => {
                if (window.mdb && window.mdb.Collapse) {
                    const existingCollapse = window.mdb.Collapse.getInstance(navbarCollapse);
                    if (!existingCollapse) {
                        new window.mdb.Collapse(navbarCollapse, {
                            toggle: false
                        });
                    }
                } else if (window.bootstrap && window.bootstrap.Collapse) {
                    const existingCollapse = window.bootstrap.Collapse.getInstance(navbarCollapse);
                    if (!existingCollapse) {
                        new window.bootstrap.Collapse(navbarCollapse, {
                            toggle: false
                        });
                    }
                }
            }, 100);
        }
    };

    window.addEventListener('hashchange', handleLocation);

    // Initialize language switcher on page load
    updateLangSwitcher();
    
    // Initialize navbar collapse
    initializeNavbarCollapse();

    // Initial load
    handleLocation();
});
