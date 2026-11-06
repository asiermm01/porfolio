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
        }
    ];

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
            h('span', { className: 'project-label' }, i18n.get(project.labelKey)),
            h('h3', { className: 'project-title' }, i18n.get(project.titleKey)),
            h('p', { className: 'project-description' }, i18n.get(project.descriptionKey)),
            h('div', { className: 'project-tech-stack' },
                project.techKeys.map((key) => h('span', {
                    className: 'project-tech',
                    key
                }, i18n.get(key)))
            )
        ));
    }

    function ProjectsApp() {
        const [sortOrder, setSortOrder] = useState('featured');
        const sortedProjects = projects
            .map((project, index) => ({ project, index }))
            .sort((a, b) => {
                if (sortOrder === 'name-asc') {
                    return i18n.get(a.project.titleKey).localeCompare(i18n.get(b.project.titleKey), i18n.getLanguage()) || a.index - b.index;
                }
                if (sortOrder === 'name-desc') {
                    return i18n.get(b.project.titleKey).localeCompare(i18n.get(a.project.titleKey), i18n.getLanguage()) || a.index - b.index;
                }
                return Number(b.project.featured) - Number(a.project.featured) || a.index - b.index;
            })
            .map(({ project }) => project);

        return h(React.Fragment, null,
            h('div', { className: 'projects-toolbar' },
                h('label', { className: 'projects-sort-label', htmlFor: 'projects-sort' }, i18n.get('projects.sortLabel')),
                h('select', {
                    className: 'projects-sort-select',
                    id: 'projects-sort',
                    value: sortOrder,
                    onChange: (event) => setSortOrder(event.target.value)
                },
                h('option', { value: 'featured' }, i18n.get('projects.sortFeatured')),
                h('option', { value: 'name-asc' }, i18n.get('projects.sortNameAsc')),
                h('option', { value: 'name-desc' }, i18n.get('projects.sortNameDesc')))
            ),
            h('div', { className: 'projects-grid' },
                sortedProjects.map((project) => h(ProjectCard, { project, key: project.id }))
            )
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
