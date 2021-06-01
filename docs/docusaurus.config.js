/** @type {import('@docusaurus/types').DocusaurusConfig} */
const path = require('path');

module.exports = {
  title: 'Documentation | lightdash',
  tagline: 'Documentation. Learn how to use lightdash and setup the BI tool for the modern data stack.',
  url: 'https://docs.lightdash.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',  // TODO update
  organizationName: 'lightdash', // Usually your GitHub org/user name.
  projectName: 'lightdash', // Usually your repo name.
  plugins: [
      [
          path.resolve(__dirname, 'docusaurus-rudderstack-plugin'),
          {
              dataplaneUrl: 'https://analytics.lightdash.com',
              writeKey: '1tLM5JN9u3GhRUidt5zjU0Uc5Qf',
          }
      ],
  ],
  themeConfig: {
    navbar: {
      title: 'lightdash',
      logo: {
        alt: 'lightdash logo',
        src: 'img/logo.png',   // TODO update
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://github.com/lightdash/lightdash',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
      ],
      copyright: `Copyright © ${new Date().getFullYear()}. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          // Please change this to your repo.
          editUrl:
            'https://github.com/lightdash/lightdash/edit/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
