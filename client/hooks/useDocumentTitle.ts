import { useEffect } from "react";

interface MetaOptions {
  title: string;
  description?: string;
  image?: string | null;
  type?: "website" | "video.other";
  url?: string;
}

const DEFAULT_DESC =
  "Assiste a vídeos porno grátis em HD, conteúdo amador, clipes XXX caseiros e as melhores modelos. Novo conteúdo todos os dias no SuckOrSex.";

function setMeta(attr: string, value: string, content: string) {
  const selector = `meta[${attr}="${value}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, value);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useDocumentTitle({
  title,
  description,
  image,
  type = "website",
  url,
}: MetaOptions) {
  useEffect(() => {
    const pageUrl = url ?? window.location.href;
    const desc = description ?? DEFAULT_DESC;

    document.title = title;

    // Standard meta
    setMeta("name", "description", desc);

    // Open Graph
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", pageUrl);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", "SuckOrSex");
    if (image) setMeta("property", "og:image", image);

    // Twitter Cards
    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    if (image) setMeta("name", "twitter:image", image);

    // Canonical
    setCanonical(pageUrl);
  }, [title, description, image, type, url]);
}
