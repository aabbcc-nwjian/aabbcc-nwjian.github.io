window.addEventListener("DOMContentLoaded", function () {
  const html = document.querySelector("html");
  const navBtn = document.querySelector(".navbar-btn");
  const navList = document.querySelector(".navbar-list");
  const backToTopFixed = document.querySelector(".back-to-top-fixed");
  const postContainer = document.querySelector(".post-container");
  const tocToggle = document.querySelector(".toc-toggle");
  const articleEntry = document.querySelector(".article-entry");
  const articleScrollbar = document.querySelector(".article-scrollbar");
  const articleScrollbarThumb = document.querySelector(
    ".article-scrollbar-thumb",
  );
  let lastTop = 0;
  let lastRefreshTime = 0;
  let frameCount = 0;
  let refreshRate = 0;
  let theme = window.localStorage.getItem("theme") || "";
  let isDraggingArticleScrollbar = false;

  theme && html.classList.add(theme);

  const setTocCollapsed = (collapsed) => {
    if (!postContainer || !tocToggle) return;

    postContainer.classList.toggle("toc-collapsed", collapsed);
    tocToggle.textContent = collapsed ? ">" : "<";
    tocToggle.setAttribute("aria-label", collapsed ? "显示目录" : "隐藏目录");
    tocToggle.setAttribute("aria-expanded", String(!collapsed));
    window.localStorage.setItem("toc-collapsed", collapsed ? "true" : "false");
  };

  if (postContainer && tocToggle) {
    setTocCollapsed(window.localStorage.getItem("toc-collapsed") === "true");
    tocToggle.addEventListener("click", function () {
      setTocCollapsed(!postContainer.classList.contains("toc-collapsed"));
    });
  }

  const getArticleScrollbarState = () => {
    if (!articleEntry || !articleScrollbar || !articleScrollbarThumb) {
      return null;
    }

    const articleRect = articleEntry.getBoundingClientRect();
    const articleTop = articleRect.top + getScrollTop();
    const articleHeight = articleEntry.offsetHeight;
    const viewportHeight = window.innerHeight;
    const trackHeight = articleScrollbar.clientHeight;
    const thumbHeight = Math.max(
      32,
      Math.min(trackHeight, Math.floor((viewportHeight / articleHeight) * trackHeight)),
    );
    const scrollableDistance = Math.max(articleHeight - viewportHeight, 1);
    const progress = Math.min(
      Math.max((getScrollTop() - articleTop) / scrollableDistance, 0),
      1,
    );
    const thumbTop = Math.floor((trackHeight - thumbHeight) * progress);

    return {
      articleTop,
      scrollableDistance,
      thumbHeight,
      thumbTop,
      trackHeight,
    };
  };

  const updateArticleScrollbar = () => {
    const state = getArticleScrollbarState();
    if (!state) return;

    articleScrollbarThumb.style.height = `${state.thumbHeight}px`;
    articleScrollbarThumb.style.transform = `translate3d(0, ${state.thumbTop}px, 0)`;
  };

  updateArticleScrollbar();
  window.addEventListener("resize", updateArticleScrollbar);

  if (articleScrollbar && articleScrollbarThumb) {
    const scrollArticleByTrackPosition = (clientY) => {
      const state = getArticleScrollbarState();
      if (!state) return;

      const trackRect = articleScrollbar.getBoundingClientRect();
      const draggableDistance = Math.max(
        state.trackHeight - state.thumbHeight,
        1,
      );
      const targetThumbTop = Math.min(
        Math.max(clientY - trackRect.top - state.thumbHeight / 2, 0),
        draggableDistance,
      );
      const progress = targetThumbTop / draggableDistance;

      window.scrollTo({
        top: state.articleTop + state.scrollableDistance * progress,
      });
    };

    articleScrollbar.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      isDraggingArticleScrollbar = true;
      articleScrollbar.classList.add("dragging");
      articleScrollbarThumb.setPointerCapture(event.pointerId);
      scrollArticleByTrackPosition(event.clientY);
    });

    articleScrollbarThumb.addEventListener("pointerdown", function (event) {
      event.preventDefault();
      event.stopPropagation();
      isDraggingArticleScrollbar = true;
      articleScrollbar.classList.add("dragging");
      articleScrollbarThumb.setPointerCapture(event.pointerId);
    });

    articleScrollbarThumb.addEventListener("pointermove", function (event) {
      if (!isDraggingArticleScrollbar) return;
      scrollArticleByTrackPosition(event.clientY);
    });

    articleScrollbarThumb.addEventListener("pointerup", function (event) {
      isDraggingArticleScrollbar = false;
      articleScrollbar.classList.remove("dragging");
      articleScrollbarThumb.releasePointerCapture(event.pointerId);
    });

    articleScrollbarThumb.addEventListener("pointercancel", function (event) {
      isDraggingArticleScrollbar = false;
      articleScrollbar.classList.remove("dragging");
      articleScrollbarThumb.releasePointerCapture(event.pointerId);
    });
  }

  /**
   * 初始化刷新率估计
   */
  const estimateRefreshRate = () => {
    const currentTime = performance.now();
    if (currentTime - lastRefreshTime >= 1000) {
      // fps
      refreshRate = frameCount;
      frameCount = 0;
      lastRefreshTime = currentTime;
    } else {
      frameCount++;
    }
    requestAnimationFrame(estimateRefreshRate);
  };

  estimateRefreshRate();

  const goScrollTop = () => {
    let currentTop = getScrollTop();
    let speed = Math.floor(-currentTop / (refreshRate / 6));
    if (currentTop > lastTop + 0.5 || currentTop < lastTop - 0.5) {
      // interrupt the animation
      return (lastTop = 0);
    }
    let distance = currentTop + speed;
    lastTop = distance;
    document.documentElement.scrollTop = distance;
    distance > 0 && window.requestAnimationFrame(goScrollTop);
  };

  const toggleBackToTopBtn = (top) => {
    top = top || getScrollTop();
    if (top >= 100) {
      backToTopFixed.classList.add("show");
    } else {
      backToTopFixed.classList.remove("show");
    }
  };

  toggleBackToTopBtn();

  // theme light click
  document.querySelector("#theme-light").addEventListener("click", function () {
    html.classList.remove("theme-dark");
    html.classList.add("theme-light");
    window.localStorage.setItem("theme", "theme-light");
  });

  // theme dark click
  document.querySelector("#theme-dark").addEventListener("click", function () {
    html.classList.remove("theme-light");
    html.classList.add("theme-dark");
    window.localStorage.setItem("theme", "theme-dark");
  });

  // theme auto click
  document.querySelector("#theme-auto").addEventListener("click", function () {
    html.classList.remove("theme-light");
    html.classList.remove("theme-dark");
    window.localStorage.setItem("theme", "");
  });

  // mobile nav click
  navBtn.addEventListener("click", function () {
    html.classList.toggle("show-mobile-nav");
    this.classList.toggle("active");
  });

  // mobile nav link click
  navList.addEventListener("click", function (e) {
    if (
      e.target.nodeName == "A" &&
      html.classList.contains("show-mobile-nav")
    ) {
      navBtn.click();
    }
  });

  // click back to top
  backToTopFixed.addEventListener("click", function () {
    lastTop = getScrollTop();
    goScrollTop();
  });

  window.addEventListener(
    "scroll",
    function () {
      toggleBackToTopBtn();
      updateArticleScrollbar();
    },
    { passive: true },
  );

  /** handle lazy bg iamge */
  handleLazyBG();
});

/**
 * 获取当前滚动条距离顶部高度
 *
 * @returns 距离高度
 */
function getScrollTop() {
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop
  );
}

function querySelectorArrs(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function handleLazyBG() {
  const lazyBackgrounds = querySelectorArrs("[background-image-lazy]");
  let lazyBackgroundsCount = lazyBackgrounds.length;
  if (lazyBackgroundsCount > 0) {
    let lazyBackgroundObserver = new IntersectionObserver(function (
      entries,
      observer,
    ) {
      entries.forEach(function ({ isIntersecting, target }) {
        if (isIntersecting) {
          let img = target.dataset.img;
          if (img) {
            target.style.backgroundImage = `url(${img})`;
          }
          lazyBackgroundObserver.unobserve(target);
          lazyBackgroundsCount--;
        }
        if (lazyBackgroundsCount <= 0) {
          lazyBackgroundObserver.disconnect();
        }
      });
    });

    lazyBackgrounds.forEach(function (lazyBackground) {
      lazyBackgroundObserver.observe(lazyBackground);
    });
  }
}
