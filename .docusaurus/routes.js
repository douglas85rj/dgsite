import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/__docusaurus/debug',
    component: ComponentCreator('/__docusaurus/debug', '5ff'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/config',
    component: ComponentCreator('/__docusaurus/debug/config', '5ba'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/content',
    component: ComponentCreator('/__docusaurus/debug/content', 'a2b'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/globalData',
    component: ComponentCreator('/__docusaurus/debug/globalData', 'c3c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/metadata',
    component: ComponentCreator('/__docusaurus/debug/metadata', '156'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/registry',
    component: ComponentCreator('/__docusaurus/debug/registry', '88c'),
    exact: true
  },
  {
    path: '/__docusaurus/debug/routes',
    component: ComponentCreator('/__docusaurus/debug/routes', '000'),
    exact: true
  },
  {
    path: '/blog',
    component: ComponentCreator('/blog', '181'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '182'),
    exact: true
  },
  {
    path: '/blog/authors',
    component: ComponentCreator('/blog/authors', '0b7'),
    exact: true
  },
  {
    path: '/blog/homelab',
    component: ComponentCreator('/blog/homelab', 'b93'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '287'),
    exact: true
  },
  {
    path: '/blog/tags/adguard',
    component: ComponentCreator('/blog/tags/adguard', 'c9e'),
    exact: true
  },
  {
    path: '/blog/tags/caddy',
    component: ComponentCreator('/blog/tags/caddy', '3ad'),
    exact: true
  },
  {
    path: '/blog/tags/dev-ops',
    component: ComponentCreator('/blog/tags/dev-ops', 'd92'),
    exact: true
  },
  {
    path: '/blog/tags/docker',
    component: ComponentCreator('/blog/tags/docker', 'a6f'),
    exact: true
  },
  {
    path: '/blog/tags/homelab',
    component: ComponentCreator('/blog/tags/homelab', '709'),
    exact: true
  },
  {
    path: '/blog/tags/immich',
    component: ComponentCreator('/blog/tags/immich', 'dec'),
    exact: true
  },
  {
    path: '/blog/tags/jellyfin',
    component: ComponentCreator('/blog/tags/jellyfin', '0a0'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', 'c14'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '597'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '685'),
            routes: [
              {
                path: '/docs/site-infrastructure',
                component: ComponentCreator('/docs/site-infrastructure', '413'),
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
    path: '/',
    component: ComponentCreator('/', '2e1'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
