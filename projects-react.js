(() => {
    const rootElement = document.getElementById('projects-react-root');
    if (!rootElement || !window.React || !window.ReactDOM || typeof i18n === 'undefined') {
        console.error('Projects section could not start: React or the translation system is unavailable.');
        return;
    }

    const { createElement: h, useState } = React;
    const projects = [
        {
            id: 'project-1',
            featured: true,
            titleKey: 'projects.project1Title',
            labelKey: 'projects.project1Label',
            descriptionKey: 'projects.project1Description',
            image: 'assets/images/Banner Porfolio.png',
            imageAlt: 'Banner Porfolio',
            liveUrl: '#',
            sourceUrl: '#',
            techKeys: [
                'projects.project1Tech1',
                'projects.project1Tech2',
                'projects.project1Tech3',
                'projects.project1Tech4'
            ]
        },
        {
            id: 'demo-1',
            featured: true,
            year: 2026,
            title: { es: 'Panel de analítica', en: 'Analytics dashboard', ca: 'Panell d’analítica' },
            category: { es: 'Aplicación web', en: 'Web app', ca: 'Aplicació web' },
            description: {
                es: 'Concepto de panel para consultar métricas, actividad reciente y tendencias desde una vista adaptable.',
                en: 'A dashboard concept for exploring metrics, recent activity, and trends in a responsive view.',
                ca: 'Concepte de panell per consultar mètriques, activitat recent i tendències en una vista adaptable.'
            },
            image: 'assets/images/Commits.png',
            imageAlt: 'Temporary demo preview',
            tech: ['React', 'TypeScript', 'Chart.js']
        },
        {
            id: 'demo-2',
            featured: false,
            year: 2025,
            title: { es: 'Tienda sostenible', en: 'Sustainable shop', ca: 'Botiga sostenible' },
            category: { es: 'E-commerce', en: 'E-commerce', ca: 'Comerç electrònic' },
            description: {
                es: 'Propuesta de tienda online con catálogo, fichas de producto y una experiencia de compra simplificada.',
                en: 'An online shop concept with a catalog, product pages, and a streamlined shopping experience.',
                ca: 'Proposta de botiga en línia amb catàleg, fitxes de producte i una experiència de compra simplificada.'
            },
            image: 'assets/images/PrimerosPasos1.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Next.js', 'Stripe', 'Sanity']
        },
        {
            id: 'demo-3',
            featured: false,
            year: 2024,
            title: { es: 'Agenda de eventos', en: 'Event planner', ca: 'Agenda d’esdeveniments' },
            category: { es: 'Productividad', en: 'Productivity', ca: 'Productivitat' },
            description: {
                es: 'Organizador visual para crear eventos, revisar fechas y mantener una agenda semanal clara.',
                en: 'A visual planner for creating events, checking dates, and keeping a clear weekly schedule.',
                ca: 'Organitzador visual per crear esdeveniments, consultar dates i mantenir una agenda setmanal clara.'
            },
            image: 'assets/images/PrimerosPasos2.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Vue', 'CSS Grid', 'LocalStorage']
        },
        {
            id: 'demo-4',
            featured: true,
            year: 2023,
            title: { es: 'Experimento generativo', en: 'Generative art experiment', ca: 'Experiment d’art generatiu' },
            category: { es: 'Experimento visual', en: 'Visual experiment', ca: 'Experiment visual' },
            description: {
                es: 'Estudio interactivo de formas y color que genera composiciones diferentes en cada visita.',
                en: 'An interactive study of shapes and color that creates a different composition on each visit.',
                ca: 'Estudi interactiu de formes i color que genera composicions diferents a cada visita.'
            },
            image: 'assets/images/mesh-320 1-1x.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Canvas API', 'JavaScript', 'WebGL']
        },
        {
            id: 'demo-5',
            featured: false,
            year: 2026,
            title: { es: 'Recetario de temporada', en: 'Seasonal recipe book', ca: 'Receptari de temporada' },
            category: { es: 'Contenido', en: 'Content', ca: 'Contingut' },
            description: {
                es: 'Colección de recetas filtrable por ingredientes y temporada, pensada primero para móvil.',
                en: 'A recipe collection filterable by ingredient and season, designed for mobile first.',
                ca: 'Col·lecció de receptes filtrable per ingredients i temporada, pensada primer per a mòbil.'
            },
            image: 'assets/images/PrimerosPasos3.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Astro', 'Contentful', 'CSS']
        },
        {
            id: 'demo-6',
            featured: false,
            year: 2022,
            title: { es: 'Clima en directo', en: 'Live weather', ca: 'Temps en directe' },
            category: { es: 'Datos', en: 'Data', ca: 'Dades' },
            description: {
                es: 'Interfaz de consulta meteorológica con estados visuales para temperatura, viento y previsión.',
                en: 'A weather interface with visual states for temperature, wind, and forecast.',
                ca: 'Interfície meteorològica amb estats visuals per a temperatura, vent i previsió.'
            },
            image: 'assets/images/mesh-673 2-1x.png',
            imageAlt: 'Temporary demo preview',
            tech: ['JavaScript', 'OpenWeather API', 'CSS']
        },
        {
            id: 'demo-7',
            featured: false,
            year: 2025,
            title: { es: 'Biblioteca de componentes', en: 'Component library', ca: 'Biblioteca de components' },
            category: { es: 'Sistema de diseño', en: 'Design system', ca: 'Sistema de disseny' },
            description: {
                es: 'Pequeño sistema de componentes con variantes reutilizables, estados y ejemplos de uso.',
                en: 'A small component system with reusable variants, states, and usage examples.',
                ca: 'Petit sistema de components amb variants reutilitzables, estats i exemples d’ús.'
            },
            image: 'assets/images/PrimerosPasos4.png',
            imageAlt: 'Temporary demo preview',
            tech: ['React', 'Storybook', 'CSS Modules']
        },
        {
            id: 'demo-8',
            featured: true,
            year: 2024,
            title: { es: 'Portfolio fotográfico', en: 'Photography portfolio', ca: 'Portafolis fotogràfic' },
            category: { es: 'Portfolio', en: 'Portfolio', ca: 'Portafolis' },
            description: {
                es: 'Galería editorial para presentar series de imágenes con navegación ligera y diseño adaptable.',
                en: 'An editorial gallery for presenting photo series with lightweight navigation and responsive design.',
                ca: 'Galeria editorial per presentar sèries d’imatges amb navegació lleugera i disseny adaptable.'
            },
            image: 'assets/images/PrimerosPasos5.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Eleventy', 'JavaScript', 'Netlify']
        },
        {
            id: 'demo-9',
            featured: false,
            year: 2023,
            title: { es: 'Gestor de tareas', en: 'Task manager', ca: 'Gestor de tasques' },
            category: { es: 'Productividad', en: 'Productivity', ca: 'Productivitat' },
            description: {
                es: 'Tablero personal para organizar tareas por estado y guardar el progreso localmente.',
                en: 'A personal board for organizing tasks by status and saving progress locally.',
                ca: 'Tauler personal per organitzar tasques per estat i desar el progrés localment.'
            },
            image: 'assets/images/cambios.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Svelte', 'TypeScript', 'IndexedDB']
        },
        {
            id: 'demo-10',
            featured: false,
            year: 2022,
            title: { es: 'Mapa de lugares', en: 'Places map', ca: 'Mapa de llocs' },
            category: { es: 'Exploración', en: 'Discovery', ca: 'Exploració' },
            description: {
                es: 'Mapa conceptual para guardar lugares favoritos, añadir notas y descubrir sitios cercanos.',
                en: 'A map concept for saving favorite places, adding notes, and discovering nearby spots.',
                ca: 'Concepte de mapa per desar llocs preferits, afegir notes i descobrir indrets propers.'
            },
            image: 'assets/images/mesh-927 1-1x.png',
            imageAlt: 'Temporary demo preview',
            tech: ['Mapbox', 'React', 'Supabase']
        }
    ];

    function getProjectText(project, field, translationKey) {
        if (project[field]) {
            return project[field][i18n.getLanguage()];
        }
        return i18n.get(translationKey);
    }

    function ProjectCard({ project }) {
        return h('article', {
            className: `project-card${project.featured ? ' project-card-featured' : ''}`,
            id: project.id
        },
        h('div', { className: 'project-image-wrapper' },
            h('img', {
                src: project.image,
                alt: project.imageAlt,
                className: 'project-image'
            }),
            h('div', { className: 'project-image-overlay' },
                h('div', { className: 'project-links' },
                    h('a', { href: project.liveUrl, className: 'project-link', 'aria-label': 'View live site' },
                        h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                            h('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
                            h('polyline', { points: '15 3 21 3 21 9' }),
                            h('line', { x1: 10, y1: 14, x2: 21, y2: 3 })
                        )
                    ),
                    h('a', { href: project.sourceUrl, className: 'project-link', 'aria-label': 'View source code' },
                        h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
                            h('path', { d: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' })
                        )
                    )
                )
            )
        ),
        h('div', { className: 'project-info' },
            h('div', { className: 'project-meta' },
                h('span', { className: 'project-label' },
                    getProjectText(project, 'category', project.labelKey)),
                project.year && h('span', { className: 'project-year' }, project.year),
                project.id.startsWith('demo-') && h('span', { className: 'project-demo-badge' },
                    i18n.get('projects.temporaryDemo'))
            ),
            h('h3', { className: 'project-title' }, getProjectText(project, 'title', project.titleKey)),
            h('p', { className: 'project-description' }, getProjectText(project, 'description', project.descriptionKey)),
            h('div', { className: 'project-tech-stack' },
                (project.tech || project.techKeys.map((key) => i18n.get(key))).map((technology) => h('span', {
                    className: 'project-tech',
                    key: technology
                }, technology))
            )
        ));
    }

    function ProjectPagination({ currentPage, pageCount, pageNumbers, changePage, placement, transitionDirection }) {
        const visiblePageNumbers = pageCount > 5
            ? [...new Set([1, currentPage - 1, currentPage, currentPage + 1, pageCount])]
                .filter((page) => page >= 1 && page <= pageCount)
                .sort((a, b) => a - b)
                .reduce((items, page, index, pages) => {
                    if (index > 0 && page - pages[index - 1] > 1) {
                        items.push('ellipsis');
                    }
                    items.push(page);
                    return items;
                }, [])
            : pageNumbers;

        return h('nav', {
            className: `projects-pagination projects-pagination-${placement}`,
            'data-transition-direction': transitionDirection > 0 ? 'forward' : 'backward',
            'aria-label': i18n.get('projects.paginationLabel')
        },
        h('button', {
            className: 'projects-page-button projects-page-arrow',
            type: 'button',
            'aria-label': i18n.get('projects.previousPage'),
            disabled: currentPage === 1,
            onClick: () => changePage(Math.max(1, currentPage - 1))
        }, '‹'),
        visiblePageNumbers.map((page, index) => page === 'ellipsis'
            ? h('span', {
                className: 'projects-page-ellipsis',
                key: `ellipsis-${index}`,
                'aria-hidden': 'true'
            }, '…')
            : h('button', {
                className: `projects-page-button${page === currentPage ? ' is-active' : ''}`,
                type: 'button',
                key: page,
                'aria-label': `${i18n.get('projects.page')} ${page}`,
                'aria-current': page === currentPage ? 'page' : undefined,
                onClick: () => changePage(page)
            }, page)),
        h('button', {
            className: 'projects-page-button projects-page-arrow',
            type: 'button',
            'aria-label': i18n.get('projects.nextPage'),
            disabled: currentPage === pageCount,
            onClick: () => changePage(Math.min(pageCount, currentPage + 1))
        }, '›'));
    }

    function ProjectsApp() {
        const [sortOrder, setSortOrder] = useState('featured');
        const [currentPage, setCurrentPage] = useState(1);
        const [transitionDirection, setTransitionDirection] = useState(1);
        const [isPageTransitioning, setIsPageTransitioning] = useState(false);
        const sortedProjects = projects
            .map((project, index) => ({ project, index }))
            .sort((a, b) => {
                if (sortOrder === 'name-asc') {
                    return getProjectText(a.project, 'title', a.project.titleKey).localeCompare(getProjectText(b.project, 'title', b.project.titleKey), i18n.getLanguage()) || a.index - b.index;
                }
                if (sortOrder === 'name-desc') {
                    return getProjectText(b.project, 'title', b.project.titleKey).localeCompare(getProjectText(a.project, 'title', a.project.titleKey), i18n.getLanguage()) || a.index - b.index;
                }
                if (sortOrder === 'year-newest') {
                    return (b.project.year || 0) - (a.project.year || 0) || a.index - b.index;
                }
                if (sortOrder === 'year-oldest') {
                    return (a.project.year || 0) - (b.project.year || 0) || a.index - b.index;
                }
                return Number(b.project.featured) - Number(a.project.featured) || a.index - b.index;
            })
            .map(({ project }) => project);
        const pageSize = 3;
        const pageCount = Math.ceil(sortedProjects.length / pageSize);
        const pageProjects = sortedProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1);
        const changePage = (nextPage) => {
            if (nextPage === currentPage || isPageTransitioning) {
                return;
            }

            setTransitionDirection(nextPage > currentPage ? 1 : -1);
            setIsPageTransitioning(true);
            window.setTimeout(() => {
                setCurrentPage(nextPage);
                setIsPageTransitioning(false);
            }, 180);
        };

        return h(React.Fragment, null,
            h('div', { className: 'projects-toolbar' },
                h('label', { className: 'projects-sort-label', htmlFor: 'projects-sort' }, i18n.get('projects.sortLabel')),
                h('select', {
                    className: 'projects-sort-select',
                    id: 'projects-sort',
                    value: sortOrder,
                    onChange: (event) => {
                        setSortOrder(event.target.value);
                        setCurrentPage(1);
                    }
                },
                h('option', { value: 'featured' }, i18n.get('projects.sortFeatured')),
                h('option', { value: 'name-asc' }, i18n.get('projects.sortNameAsc')),
                h('option', { value: 'name-desc' }, i18n.get('projects.sortNameDesc')),
                h('option', { value: 'year-newest' }, i18n.get('projects.sortNewest')),
                h('option', { value: 'year-oldest' }, i18n.get('projects.sortOldest')))
            ),
            pageCount > 1 && h(ProjectPagination, {
                currentPage,
                pageCount,
                pageNumbers,
                changePage,
                transitionDirection,
                placement: 'top'
            }),
            h('div', {
                className: `projects-grid${isPageTransitioning ? ' is-transitioning' : ''}`,
                'data-transition-direction': transitionDirection > 0 ? 'forward' : 'backward',
                'aria-live': 'polite',
                'aria-busy': isPageTransitioning
            },
                pageProjects.map((project) => h(ProjectCard, { project, key: project.id }))
            ),
            pageCount > 1 && h(ProjectPagination, {
                currentPage,
                pageCount,
                pageNumbers,
                changePage,
                transitionDirection,
                placement: 'bottom'
            })
        );
    }

    const root = ReactDOM.createRoot(rootElement);
    const renderProjects = () => root.render(h(ProjectsApp));

    document.addEventListener('translationsready', renderProjects);
    document.addEventListener('languagechange', renderProjects);
    if (i18n.initialized) {
        renderProjects();
    }
})();
