"use strict";

const CONTENT_FILE = "content.json";

const elements = {
  avatarWrap: document.getElementById("avatar-wrap"),
  avatar: document.getElementById("avatar"),
  backgroundImage: document.getElementById("background-image"),
  backgroundOverlay: document.getElementById("background-overlay"),
  eyebrow: document.getElementById("eyebrow"),
  name: document.getElementById("profile-name"),
  description: document.getElementById("profile-description"),
  socials: document.getElementById("social-links"),
  sections: document.getElementById("sections"),
  status: document.getElementById("content-status")
};

function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text) {
    element.textContent = text;
  }

  return element;
}

function isSafeUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function applyTheme(theme = {}) {
  const themeMap = {
    background: "--background",
    surface: "--surface",
    card: "--card",
    text: "--text",
    mutedText: "--muted",
    accent: "--accent"
  };

  Object.entries(themeMap).forEach(([contentKey, cssVariable]) => {
    if (typeof theme[contentKey] === "string" && theme[contentKey].trim()) {
      document.documentElement.style.setProperty(cssVariable, theme[contentKey]);
    }
  });
}

function renderBackground(background = {}) {
  const showImage =
    background.showImage !== false &&
    typeof background.image === "string" &&
    background.image.trim();

  if (!showImage) {
    elements.backgroundImage.hidden = true;
    return;
  }

  try {
    const imageUrl = new URL(background.image, window.location.href);
    const allowedProtocols = ["http:", "https:", "file:"];

    if (!allowedProtocols.includes(imageUrl.protocol)) {
      throw new Error("Unsupported background image URL");
    }

    const imageOpacity = clamp(background.imageOpacity, 0, 1, 0.42);
    const overlayOpacity = clamp(background.overlayOpacity, 0, 1, 0.68);
    const blur = clamp(background.blur, 0, 12, 1);

    elements.backgroundImage.hidden = false;
    elements.backgroundImage.style.backgroundImage = `url("${imageUrl.href}")`;
    elements.backgroundImage.style.backgroundPosition =
      background.position || "center center";
    elements.backgroundImage.style.opacity = String(imageOpacity);
    elements.backgroundImage.style.filter =
      `saturate(0.88) contrast(0.95) blur(${blur}px)`;
    elements.backgroundOverlay.style.opacity = String(overlayOpacity);
  } catch (error) {
    console.warn(error);
    elements.backgroundImage.hidden = true;
  }
}

function renderProfile(site = {}) {
  document.documentElement.lang = site.language || "en";
  elements.eyebrow.textContent = site.eyebrow || "";
  elements.name.textContent = site.name || "The Seminyak Beach Resort & Spa";
  elements.description.textContent = site.description || "";
  document.title = site.name || document.title;

  const showAvatar = site.showAvatar !== false && Boolean(site.avatar);
  elements.avatarWrap.hidden = !showAvatar;

  if (showAvatar) {
    elements.avatar.src = site.avatar;
    elements.avatar.alt = `${site.name || "Resort"} logo`;
    elements.avatar.addEventListener("error", () => {
      elements.avatarWrap.hidden = true;
    }, { once: true });
  }
}

function renderSocials(socials = []) {
  const fragment = document.createDocumentFragment();

  socials
    .filter((social) => social.visible !== false && isSafeUrl(social.url))
    .forEach((social) => {
      const link = createElement("a", "social-link");

      link.href = social.url;
      link.setAttribute("aria-label", social.label);
      link.title = social.label;

      if (social.icon) {
        const icon = createElement("i", `bi bi-${social.icon}`);
        icon.setAttribute("aria-hidden", "true");
        link.appendChild(icon);
      } else {
        link.textContent = social.shortLabel || social.label;
      }

      if (!social.url.startsWith("mailto:") && !social.url.startsWith("tel:")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      fragment.appendChild(link);
    });

  elements.socials.replaceChildren(fragment);
  elements.socials.hidden = elements.socials.childElementCount === 0;
}

function createCard(item) {
  const link = createElement("a", "link-card");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("aria-label", `${item.title} — opens in a new tab`);

  const shouldShowImage = item.showImage === true && Boolean(item.image);

  if (shouldShowImage) {
    link.classList.add("has-image");
    const image = createElement("img", "card-image");
    image.src = item.image;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.remove();
      link.classList.remove("has-image");
    }, { once: true });
    link.appendChild(image);
  }

  const copy = createElement("div", "card-copy");
  copy.appendChild(createElement("h3", "card-title", item.title));

  if (item.description) {
    copy.appendChild(
      createElement("p", "card-description", item.description)
    );
  }

  link.appendChild(copy);
  link.appendChild(createElement("span", "card-arrow", "↗"));
  return link;
}

function renderSections(sections = []) {
  const fragment = document.createDocumentFragment();

  sections
    .filter((section) => section.visible !== false)
    .forEach((section) => {
      const visibleLinks = (section.links || []).filter(
        (item) =>
          item.visible !== false &&
          item.title &&
          isSafeUrl(item.url)
      );

      if (visibleLinks.length === 0) {
        return;
      }

      const sectionElement = createElement("section", "section");
      const heading = createElement("div", "section-heading");
      heading.appendChild(createElement("h2", "", section.title));

      if (section.subtitle) {
        heading.appendChild(createElement("p", "", section.subtitle));
      }

      const list = createElement("div", "link-list");
      visibleLinks.forEach((item) => list.appendChild(createCard(item)));

      sectionElement.append(heading, list);
      fragment.appendChild(sectionElement);
    });

  elements.sections.replaceChildren(fragment);
}

async function loadContent() {
  try {
    const response = await fetch(CONTENT_FILE, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`Content request failed with status ${response.status}`);
    }

    const content = await response.json();
    applyTheme(content.theme);
    renderBackground(content.background);
    renderProfile(content.site);
    renderSocials(content.socials);
    renderSections(content.sections);
    elements.status.hidden = true;
  } catch (error) {
    console.error(error);
    elements.status.className = "content-error";
    elements.status.textContent =
      window.location.protocol === "file:"
        ? "This page uses content.json. Preview it through a local web server or GitHub Pages."
        : "Resort information could not be loaded. Please refresh the page.";
  }
}

loadContent();
