(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal ---------- */
  const revealTargets = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Header background on scroll ---------- */
  const header = document.querySelector(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Burger menu ---------- */
  const burger = document.querySelector(".burger");
  const siteMenu = document.getElementById("site-menu");

  const setMenuOpen = (open) => {
    siteMenu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
  };

  burger.addEventListener("click", () => setMenuOpen(!siteMenu.classList.contains("is-open")));

  // Any menu item closes the panel (the Email item copies and then closes)
  siteMenu.querySelectorAll(".menu__link").forEach((link) => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("click", (e) => {
    if (!siteMenu.classList.contains("is-open")) return;
    if (!siteMenu.contains(e.target) && !burger.contains(e.target)) setMenuOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && siteMenu.classList.contains("is-open")) {
      setMenuOpen(false);
      burger.focus();
    }
  });

  // Back to the desktop layout: reset the panel state
  window.matchMedia("(min-width: 1101px)").addEventListener("change", (e) => {
    if (e.matches) setMenuOpen(false);
  });

  /* ---------- Menu: active section ---------- */
  const sectionLinks = [...document.querySelectorAll(".menu [data-section]")];

  const setActive = (id) => {
    sectionLinks.forEach((link) => link.classList.toggle("is-active", link.dataset.section === id));
  };

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sectionLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.section);
      if (section) sectionObserver.observe(section);
    });
  }

  /* ---------- Concepts lightbox ---------- */
  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = lightbox.querySelector(".lightbox__image");
  const lightboxCaption = lightbox.querySelector(".lightbox__caption");
  let lastTrigger = null;

  const openLightbox = (trigger) => {
    const img = trigger.querySelector("img");
    const figcaption = trigger.closest("figure")?.querySelector("figcaption");
    const caption = (trigger.dataset.caption ?? figcaption?.textContent ?? "").trim();
    lastTrigger = trigger;
    lightboxImage.src = img.currentSrc || img.src;
    lightboxImage.alt = caption;
    lightboxCaption.textContent = caption;
    lightbox.showModal();
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
  };

  const closeLightbox = () => {
    if (!lightbox.open) return;
    lightbox.classList.remove("is-open");
    const finish = () => {
      lightbox.close();
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    };
    if (reduceMotion) finish();
    else setTimeout(finish, 300);
  };

  document.querySelectorAll(".concept__image, [data-lightbox]").forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  lightbox.querySelector(".lightbox__close").addEventListener("click", closeLightbox);

  // Close on a click anywhere outside the picture
  lightbox.addEventListener("click", (e) => {
    if (e.target !== lightboxImage) closeLightbox();
  });

  // Esc: run our animated close instead of the instant native one
  lightbox.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeLightbox();
  });

  /* ---------- Copy email + toast ---------- */
  const toast = document.querySelector(".toast");
  const toastText = toast.querySelector(".toast__text");
  let toastTimer = null;

  const hideToast = () => {
    clearTimeout(toastTimer);
    toast.classList.remove("is-visible");
  };

  const showToast = (message) => {
    toastText.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 3000);
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for browsers / contexts without the Clipboard API
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
      document.body.append(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      return ok;
    }
  };

  document.querySelectorAll("[data-copy-email]").forEach((button) => {
    button.addEventListener("click", async () => {
      const email = button.dataset.copyEmail;
      const ok = await copyText(email);
      showToast(ok ? "Email скопирован" : `Не удалось скопировать: ${email}`);
    });
  });

  toast.querySelector(".toast__close").addEventListener("click", hideToast);

  // Keep the toast open while the cursor is over it
  toast.addEventListener("mouseenter", () => clearTimeout(toastTimer));
  toast.addEventListener("mouseleave", () => {
    if (toast.classList.contains("is-visible")) toastTimer = setTimeout(hideToast, 1500);
  });

  /* ---------- Subtle tilt on project cards ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover) and (min-width: 961px)").matches) {
    document.querySelectorAll(".case").forEach((card) => {
      const mockup = card.querySelector(".case__mockup img");
      card.addEventListener("mouseenter", () => {
        // Faster, delay-free easing while following the cursor
        mockup.style.transition = "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease";
      });
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mockup.style.transform = `translate(${x * -14}px, ${y * -10}px)`;
      });
      card.addEventListener("mouseleave", () => {
        mockup.style.transform = "";
      });
    });
  }
})();
