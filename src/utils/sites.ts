// SwapMarket's sites are on GitHub Pages, and also nsites (NIP-5A) under SwapMarket's key, each its own subdomain on a gateway:
// <key in base36><name>.<gateway>, or <npub>.<gateway> for the root site, this app. A link opened on one of those stays on the
// same gateway; anywhere else, including a copy under another key, it goes to GitHub Pages.
export const key36 = "1cdzwdkc0uepk5ll8mhpcbyw3xh8gakldbfdq8fphhqnv503bc";
export const npub =
    "npub1xhklzztd83v34zsf9da2gvfrctj5wcsvsx09er9v26jy7r0uq8yq4vme7d";

// name: "liq2sol", "sol2base", "eth2base", or "" for this app.
export const siteUrl = (
    name: string,
    hostname: string = window.location.hostname,
): string => {
    const [label, ...gateway] = hostname.split(".");
    const named =
        label.startsWith(key36) &&
        /^[a-z0-9-]{1,13}$/.test(label.slice(key36.length));
    if (gateway.length > 0 && (label === npub || named)) {
        return `https://${name ? key36 + name : npub}.${gateway.join(".")}/`;
    }
    return `https://swapmarket.github.io/${name ? `${name}/` : ""}`;
};

// A site's address on an nsite gateway, wherever the app is opened.
export const nsiteUrl = (name: string, gateway: string): string =>
    `https://${name ? key36 + name : npub}.${gateway}/`;
