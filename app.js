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
  imageDialog: document.getElementById("image-dialog"),
  imageDialogClose: document.getElementById("image-dialog-close"),
  imageDialogImage: document.getElementById("image-dialog-image"),
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

function isSafeImageUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  try {
    const url = new URL(value, window.location.href);
    return ["http:", "https:", "file:"].includes(url.protocol);
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

function openImagePopup(item) {
  const imageSource = item.popupImage || item.image;

  if (!isSafeImageUrl(imageSource)) {
    return;
  }

  elements.imageDialogImage.src = imageSource;
  elements.imageDialogImage.alt = item.popupAlt || item.title;
  elements.imageDialog.setAttribute("aria-label", `${item.title} image preview`);

  if (typeof elements.imageDialog.showModal === "function") {
    elements.imageDialog.showModal();
  }
}

function setupImageDialog() {
  elements.imageDialogClose.addEventListener("click", () => {
    elements.imageDialog.close();
  });

  elements.imageDialog.addEventListener("click", (event) => {
    if (event.target === elements.imageDialog) {
      elements.imageDialog.close();
    }
  });

  elements.imageDialog.addEventListener("close", () => {
    elements.imageDialogImage.removeAttribute("src");
  });
}

function createCard(item) {
  const opensPopup = item.action === "popup";
  const card = createElement(opensPopup ? "button" : "a", "link-card");

  if (opensPopup) {
    card.type = "button";
    card.setAttribute("aria-label", `View ${item.title} image`);
    card.addEventListener("click", () => openImagePopup(item));
  } else {
    card.href = item.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.setAttribute("aria-label", `${item.title} — opens in a new tab`);
  }

  const shouldShowImage = item.showImage === true && Boolean(item.image);

  if (shouldShowImage) {
    card.classList.add("has-image");
    const image = createElement("img", "card-image");
    image.src = item.image;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.remove();
      card.classList.remove("has-image");
    }, { once: true });
    card.appendChild(image);
  }

  const copy = createElement("div", "card-copy");
  copy.appendChild(createElement("h3", "card-title", item.title));

  if (item.description) {
    copy.appendChild(
      createElement("p", "card-description", item.description)
    );
  }

  card.appendChild(copy);
  return card;
}

function createCarousel(list, sectionTitle) {
  const shell = createElement("div", "carousel-shell");
  const previous = createElement("button", "carousel-button carousel-previous");
  const next = createElement("button", "carousel-button carousel-next");
  const previousIcon = createElement("i", "bi bi-chevron-left");
  const nextIcon = createElement("i", "bi bi-chevron-right");

  previous.type = "button";
  next.type = "button";
  previous.setAttribute("aria-label", `Previous ${sectionTitle} items`);
  next.setAttribute("aria-label", `Next ${sectionTitle} items`);
  previousIcon.setAttribute("aria-hidden", "true");
  nextIcon.setAttribute("aria-hidden", "true");
  previous.appendChild(previousIcon);
  next.appendChild(nextIcon);
  list.setAttribute("role", "region");
  list.setAttribute("aria-label", `${sectionTitle} carousel`);
  list.setAttribute("tabindex", "0");

  const scrollAmount = () => Math.max(240, list.clientWidth * 0.82);

  const updateControls = () => {
    const maximumScroll = Math.max(0, list.scrollWidth - list.clientWidth);
    previous.disabled = list.scrollLeft <= 2;
    next.disabled = list.scrollLeft >= maximumScroll - 2;
  };

  previous.addEventListener("click", () => {
    list.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    list.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });

  list.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    list.scrollBy({
      left: event.key === "ArrowLeft" ? -scrollAmount() : scrollAmount(),
      behavior: "smooth"
    });
  });

  list.addEventListener("scroll", updateControls, { passive: true });
  window.addEventListener("resize", updateControls);
  requestAnimationFrame(updateControls);

  shell.append(previous, list, next);
  return shell;
}

function renderSections(sections = []) {
  const fragment = document.createDocumentFragment();

  sections
    .filter((section) => section.visible !== false)
    .forEach((section) => {
      const visibleLinks = (section.links || []).filter((item) => {
        const hasValidAction = item.action === "popup"
          ? isSafeImageUrl(item.popupImage || item.image)
          : isSafeUrl(item.url);

        return item.visible !== false && item.title && hasValidAction;
      });

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

      const useCarousel = section.carousel === true && visibleLinks.length > 1;

      if (useCarousel) {
        sectionElement.classList.add("section-carousel");
        list.classList.add("is-carousel");
        sectionElement.append(heading, createCarousel(list, section.title));
      } else {
        sectionElement.append(heading, list);
      }

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

setupImageDialog();
loadContent();
