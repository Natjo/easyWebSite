function preloadImgs(main, func) {
  let inc = 0;
  let imgs = [];
  main.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
    if (img.getAttribute("src") != "") imgs.push(img);
  });
  const length = imgs.length;
  function load(src) {
    const img = new Image();
    img.onload = () => {
      inc++;
      if (inc === length) {
        func();
      }
    };
    img.src = src;
  }
  length ? imgs.forEach(img => load(img.src)) : func();
}
const onepage = onchange => {
  const main_wrapper = document.querySelector('.main-wrapper');
  const addLinksAjax = el => {
    const links = el.querySelectorAll('.xhr,.xhr-full,.xhr-main,.xhr-popin');
    console.log(links);
    links.forEach(link => {
      link.addEventListener("click", e => {
        e.preventDefault();
        let type = "xhr";
        if (link.classList.contains("xhr-full")) {
          type = "full";
        } else if (link.classList.contains("xhr-main")) {
          type = "main";
        } else if (link.classList.contains("xhr-popin")) {
          type = "popin";
        }
        let href = link.getAttribute('href');
        href += href.endsWith("/") ? "" : "/";
        if (window.location.pathname !== href) {
          page(href, true, type);
        }
      }, true);
    });
  };
  const page = (slug, history, type = "full") => {
    fetch(slug).then(response => response.text()).then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const head = doc.querySelector("head");
      if (type === "full") {
        const newbody = doc.querySelector("body");
        const currentbody = document.querySelector("body");
        currentbody.innerHTML = "";
        currentbody.appendChild(newbody);
        addLinksAjax(newbody);
      } else if (type === "main") {
        const oldmain = document.querySelector("main");
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newmain = doc.querySelector("main");
        main_wrapper.appendChild(newmain);
        doc.querySelectorAll("link[hreflang]").forEach(lang => {
          document.querySelectorAll(`a[lang="${lang.hreflang}"]`).forEach(link => link.href = lang.href);
        });
        oldmain.classList.add("hide");
        newmain.classList.add("show");
        oldmain.addEventListener('animationend', () => {
          oldmain.remove();
        }, {
          once: true
        });
        newmain.addEventListener('animationend', () => {
          newmain.classList.remove("show");
        }, {
          once: true
        });
      } else if (type === "panel") {}
      if (history) {
        document.title = head.innerText;
        window.history.pushState({
          'type': "page"
        }, slug, slug);
      }
    }).catch(err => console.warn('Something went wrong.', err));
  };
  addLinksAjax(document);
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.onpopstate = function (e) {
    page(document.location.pathname, false);
    const lanselector = document.querySelector('.dropdown');
    const langlinks = lanselector.querySelectorAll('.dropdown a');
    const pathname = document.location.pathname;
    langlinks.forEach(link => {
      const href = link.getAttribute('href').endsWith("/") ? link.getAttribute('href') : link.getAttribute('href') + "/";
      if (href === pathname) link.classList.add('active');else link.classList.remove('active');
    });
  };
};
const headernav = () => {
  console.log('headernav');
};
onepage(el => {});
headernav();
const observer = new IntersectionObserver(items => items.forEach(e => {
  if (e.isIntersecting) {
    import(`./views/${e.target.dataset.view}/${e.target.dataset.view}.js`).then(mod => {
      mod.default(e.target);
    });
    observer.unobserve(e.target);
  }
}));
document.querySelectorAll('[data-view]').forEach(view => observer.observe(view));