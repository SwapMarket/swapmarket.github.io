import { defineConfig } from "vitepress";

const appUrl = "https://swapmarket.github.io";
const docsRoot = `${appUrl}/docs/`;

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "Boltz Web App",
    description: "Boltz Web App Docs",
    base: "/docs/",
    head: [["link", { rel: "icon", href: "/docs/assets/logo.svg" }]],
    markdown: {
        // Replaces {appUrl} in the docs with the web app's URL
        config: (md) => {
            md.core.ruler.before("normalize", "app-url", (state) => {
                state.src = state.src.replaceAll("{appUrl}", appUrl);
            });
        },
    },
    themeConfig: {
        logo: "/assets/logo.svg",
        search: {
            provider: "local",
            options: {
                detailedView: true,
            },
        },
        nav: [{ text: "🏠 Docs Home", link: docsRoot, target: "_self" }],
        sidebar: [
            {
                items: [
                    { text: "🖥️ Run from Source", link: "/index" },
                    { text: "📲 Install as App", link: "/pwa" },
                    { text: "🔍 URL Parameters", link: "/urlParams" },
                    { text: "🏠 Docs Home", link: docsRoot, target: "_self" },
                ],
            },
        ],
        socialLinks: [
            {
                icon: "github",
                link: "https://github.com/BoltzExchange/boltz-web-app",
            },
        ],
    },
    // Ignore dead links to localhost
    ignoreDeadLinks: [/https?:\/\/localhost/],
});
