import { BsEnvelopeFill, BsGithub } from "solid-icons/bs";
import { Show } from "solid-js";

import nostr from "../assets/nostr.svg";
import simplex from "../assets/simplex.svg";
import { config } from "../config";
import { useGlobalContext } from "../context/Global";
import "../style/footer.scss";
import ExternalLink from "./ExternalLink";

const Footer = () => {
    const { t, backend } = useGlobalContext();

    return (
        <footer>
            <h4>
                {t("contact", {
                    alias: config.backends[backend()].alias,
                })}{" "}
                <a
                    title="Contact"
                    target="_blank"
                    href={config.backends[backend()].contact}>
                    {config.backends[backend()].contact}
                </a>
            </h4>
            <div class="socials">
                <ExternalLink
                    title="Github"
                    class="github"
                    href={config.githubUrl}>
                    <BsGithub size={22} color="#22374F" />
                </ExternalLink>
                <a title="Nostr" class="nostr" href={config.nostrUrl}>
                    <img src={nostr} alt="Nostr Logo" />
                </a>
                <a
                    title={t("email")}
                    class="email"
                    href={"mailto:" + config.email}>
                    <BsEnvelopeFill size={22} color="#22374F" />
                </a>
                <a
                    title="SimpleX"
                    class="simplex"
                    target="_blank"
                    href={config.simplexUrl}>
                    <img src={simplex} alt="SimpleX Logo" />
                </a>
            </div>
            <p class="footer-nav">
                <a target="_blank" href={config.blogUrl}>
                    {t("blog")}
                </a>{" "}
                |{" "}
                <ExternalLink href={config.regtestUrl}>
                    {t("regtest")}
                </ExternalLink>{" "}
                |{" "}
                <a target="_blank" href={config.testnetUrl}>
                    {t("testnet")}
                </a>
                <Show when={config.torUrl}>
                    |{" "}
                    <ExternalLink href={config.torUrl}>
                        {t("onion")}
                    </ExternalLink>
                </Show>
            </p>
            <p class="legal-nav">
                <a href="/terms">{t("terms")}</a>
                <a href="/privacy">{t("privacy")}</a>
            </p>
            <p class="version">
                {t("version")}:{" "}
                <a target="_blank" href={`${config.repoUrl}`}>
                    {__APP_VERSION__}
                </a>
                , {t("commithash")}:{" "}
                <ExternalLink
                    href={`${config.repoUrl}/commit/${__GIT_COMMIT__}`}>
                    {__GIT_COMMIT__}
                </ExternalLink>
            </p>
            <p>{t("footer")}</p>
        </footer>
    );
};
export default Footer;
