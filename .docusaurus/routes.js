import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/es/blog',
    component: ComponentCreator('/es/blog', 'ca5'),
    exact: true
  },
  {
    path: '/es/blog/archive',
    component: ComponentCreator('/es/blog/archive', 'c1d'),
    exact: true
  },
  {
    path: '/es/blog/authors',
    component: ComponentCreator('/es/blog/authors', 'e39'),
    exact: true
  },
  {
    path: '/es/blog/homelab',
    component: ComponentCreator('/es/blog/homelab', '294'),
    exact: true
  },
  {
    path: '/es/blog/tags',
    component: ComponentCreator('/es/blog/tags', 'b1d'),
    exact: true
  },
  {
    path: '/es/blog/tags/adguard',
    component: ComponentCreator('/es/blog/tags/adguard', '044'),
    exact: true
  },
  {
    path: '/es/blog/tags/caddy',
    component: ComponentCreator('/es/blog/tags/caddy', 'e3e'),
    exact: true
  },
  {
    path: '/es/blog/tags/dev-ops',
    component: ComponentCreator('/es/blog/tags/dev-ops', 'ac7'),
    exact: true
  },
  {
    path: '/es/blog/tags/docker',
    component: ComponentCreator('/es/blog/tags/docker', '7ce'),
    exact: true
  },
  {
    path: '/es/blog/tags/homelab',
    component: ComponentCreator('/es/blog/tags/homelab', 'db8'),
    exact: true
  },
  {
    path: '/es/blog/tags/immich',
    component: ComponentCreator('/es/blog/tags/immich', '057'),
    exact: true
  },
  {
    path: '/es/blog/tags/jellyfin',
    component: ComponentCreator('/es/blog/tags/jellyfin', '863'),
    exact: true
  },
  {
    path: '/es/docs',
    component: ComponentCreator('/es/docs', 'c17'),
    routes: [
      {
        path: '/es/docs',
        component: ComponentCreator('/es/docs', 'e6d'),
        routes: [
          {
            path: '/es/docs',
            component: ComponentCreator('/es/docs', 'ce1'),
            routes: [
              {
                path: '/es/docs/site-infrastructure',
                component: ComponentCreator('/es/docs/site-infrastructure', '4ad'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/es/',
    component: ComponentCreator('/es/', '124'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
