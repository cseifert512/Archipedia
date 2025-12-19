import { useEffect } from "react";

type MetaSpec = {
  title: string;
  description?: string;
  /**
   * Fully-qualified URL is best; if omitted we use the current location.
   */
  url?: string;
  /**
   * Fully-qualified URL is best.
   */
  image?: string;
};

function upsertMetaTag(
  selector: { name?: string; property?: string },
  content?: string,
) {
  if (!content) return;

  const head = document.head;
  const isProperty = Boolean(selector.property);
  const attr = isProperty ? "property" : "name";
  const key = isProperty ? selector.property! : selector.name!;
  const query = `meta[${attr}="${CSS.escape(key)}"]`;

  const el =
    (head.querySelector(query) as HTMLMetaElement | null) ??
    ((): HTMLMetaElement => {
      const m = document.createElement("meta");
      m.setAttribute(attr, key);
      head.appendChild(m);
      return m;
    })();

  el.setAttribute("content", content);
}

function upsertLinkTag(rel: string, href?: string) {
  if (!href) return;
  const head = document.head;
  const query = `link[rel="${CSS.escape(rel)}"]`;
  const el =
    (head.querySelector(query) as HTMLLinkElement | null) ??
    ((): HTMLLinkElement => {
      const l = document.createElement("link");
      l.setAttribute("rel", rel);
      head.appendChild(l);
      return l;
    })();
  el.setAttribute("href", href);
}

export function usePageMeta(meta: MetaSpec) {
  useEffect(() => {
    document.title = meta.title;

    const url =
      meta.url ??
      (typeof window !== "undefined" ? window.location.href : undefined);

    upsertMetaTag({ name: "description" }, meta.description);

    // OpenGraph
    upsertMetaTag({ property: "og:title" }, meta.title);
    upsertMetaTag({ property: "og:description" }, meta.description);
    upsertMetaTag({ property: "og:type" }, "website");
    upsertMetaTag({ property: "og:url" }, url);
    if (meta.image) upsertMetaTag({ property: "og:image" }, meta.image);

    // Twitter
    upsertMetaTag({ name: "twitter:card" }, meta.image ? "summary_large_image" : "summary");
    upsertMetaTag({ name: "twitter:title" }, meta.title);
    upsertMetaTag({ name: "twitter:description" }, meta.description);
    if (meta.image) upsertMetaTag({ name: "twitter:image" }, meta.image);

    // Canonical (best-effort; SPA)
    upsertLinkTag("canonical", url);
  }, [meta.title, meta.description, meta.url, meta.image]);
}



