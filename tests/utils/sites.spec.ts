import {
    key36,
    npub,
    nsiteGateway,
    nsiteUrl,
    siteUrl,
} from "../../src/utils/sites";

describe("siteUrl", () => {
    test("links go to GitHub Pages from anywhere but an nsite", () => {
        for (const host of [
            "swapmarket.github.io",
            "localhost",
            "example.com",
        ]) {
            expect(siteUrl("liq2sol", host)).toEqual(
                "https://swapmarket.github.io/liq2sol/",
            );
            expect(siteUrl("", host)).toEqual("https://swapmarket.github.io/");
        }
    });

    test("links stay on the gateway of an nsite under SwapMarket's key", () => {
        for (const host of [
            `${npub}.nsite.lol`,
            `${key36}liq2sol.nsite.lol`,
            `${key36}sol2base.nsite.lol`,
        ]) {
            expect(siteUrl("liq2sol", host)).toEqual(
                `https://${key36}liq2sol.nsite.lol/`,
            );
            expect(siteUrl("", host)).toEqual(`https://${npub}.nsite.lol/`);
        }
        expect(siteUrl("liq2sol", `${npub}.nwb.tf`)).toEqual(
            `https://${key36}liq2sol.nwb.tf/`,
        );
    });

    test("another key, or a lookalike, does not count", () => {
        for (const host of [
            `${"0".repeat(50)}liq2sol.nsite.lol`,
            `${npub.slice(0, -1)}x.nsite.lol`,
            `${key36}UPPER.nsite.lol`,
            `${key36}waytoolongname.nsite.lol`,
            `x${key36}liq2sol.nsite.lol`,
            npub,
        ]) {
            expect(siteUrl("liq2sol", host)).toEqual(
                "https://swapmarket.github.io/liq2sol/",
            );
        }
    });

    test("nsiteUrl gives a site's address on a gateway", () => {
        expect(nsiteUrl("", "nwb.tf")).toEqual(`https://${npub}.nwb.tf/`);
        expect(nsiteUrl("liq2sol", "nwb.tf")).toEqual(
            `https://${key36}liq2sol.nwb.tf/`,
        );
    });

    test("nsiteGateway knows when the app is already one of SwapMarket's nsites", () => {
        expect(nsiteGateway(`${npub}.nwb.tf`)).toEqual("nwb.tf");
        expect(nsiteGateway(`${key36}liq2sol.nsite.lol`)).toEqual("nsite.lol");
        for (const host of [
            "swapmarket.github.io",
            "localhost",
            `${"0".repeat(50)}liq2sol.nwb.tf`,
            npub,
        ]) {
            expect(nsiteGateway(host)).toBeNull();
        }
    });
});
