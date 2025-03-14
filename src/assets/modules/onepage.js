function preloadImgs(main, func) {
    let inc = 0;
    let imgs = []
    main.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
        if (img.getAttribute("src") != "")
            imgs.push(img);
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
/**
 * type:
 * default  pas de transition, changeent de paga normal     .xhr
 * full     transition toute la page                        .xhr-full
 * main     transition main                                 .xhr-main
 * popin    load page in popin or panel                     .xhr-popin
 * 
 */
const onepage = onchange => {
    const addLinksAjax = el => {
        const links = el.querySelectorAll('.xhr,.xhr-full,.xhr-main,.xhr-popin');
        links.forEach(link => {
            link.onclick = e => {
                e.preventDefault();
                let type = "xhr";
                if (link.classList.contains("xhr-full")) {
                    type = "full";
                } else if (link.classList.contains("xhr-main")) {
                    type = "main";
                } else if (link.classList.contains("xhr-popin")) {
                    type = "popin";
                }

                const href = slashify(link);

                (window.location.pathname !== href) && page(href, true, type);
            }
        });
    }

    const slashify = (link) => {
        let href = link.getAttribute('href');
        href += href.endsWith("/") ? "" : "/";
        return href
    }

    function currentPage(slug) {
        document.querySelectorAll("a").forEach(link => {
            if (slashify(link) == slug) {
                link.setAttribute("aria-current", "page")
            } else {
                link.removeAttribute("aria-current")
            }
        })
    }

    const page = (slug, pushstate, type = "full") => {
        document.body.classList.add("transition");

        fetch(slug).then(response => response.text()).then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const head = doc.querySelector("head");
            const main_wrapper = document.getElementById('main-wrapper');

            if (type === "full") {
                const newheader = doc.querySelector("#header");
                const newfooter = doc.querySelector("#footer");
                const newmain_wrapper = doc.getElementById('main-wrapper');
                const header = document.querySelector('#header');
                const footer = document.querySelector('#footer');
                const transition = document.getElementById("transition");

                transition.classList.add("transitionstart");
                transition.addEventListener('transitionend', () => {
                    main_wrapper.replaceWith(newmain_wrapper);
                    header.replaceWith(newheader);
                    footer.replaceWith(newfooter);
                    addLinksAjax(document);
                    currentPage(slug);
                    transition.classList.add("transitionend");
                    transition.addEventListener('transitionend', () => {
                        transition.classList.remove("transitionstart", "transitionend");
                        document.body.classList.remove("transition");
                    }, { once: true })
                }, { once: true })
            } else if (type === "main") {
                const main = document.querySelector("main");
                const newmain = doc.querySelector("main");
                main_wrapper.appendChild(newmain);

                // recupere la page dans les differentes langue pour les selecteur de langueg
                doc.querySelectorAll("link[hreflang]").forEach(lang => {
                    document.querySelectorAll(`a[lang="${lang.hreflang}"]`).forEach(link => link.href = lang.href);
                });

                main.classList.add("hide");
                newmain.classList.add("show");
                currentPage(slug);

                main.addEventListener('animationend', () => {
                    main.remove();
                }, { once: true })

                newmain.addEventListener('animationend', () => {
                    newmain.classList.remove("show");
                    document.body.classList.remove("transition");
                }, { once: true })

            } else if (type === "panel") {
            } else {
                window.location = slug;
            }

            document.title = head.innerText;

            if (pushstate) {
                history.pushState({ 'type': type }, slug, slug);
                console.log("fetch", slug);
            }
        }).catch(err => console.warn('Something went wrong.', err));
    }

    addLinksAjax(document);

    currentPage(window.location.pathname);

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    window.onpopstate = function (e) {
 
        const type = e.state ? e.state.type : null;
        if (!window.location.hash) page(document.location.pathname, false, type);

        /*  const lanselector = document.querySelector('.dropdown');
          const langlinks = lanselector.querySelectorAll('.dropdown a');
          const pathname = document.location.pathname;
  
          langlinks.forEach(link => {
              const href = link.getAttribute('href').endsWith("/") ? link.getAttribute('href') : link.getAttribute('href') + "/"
              if (href === pathname) link.classList.add('active');
              else link.classList.remove('active');
          });*/
    }

    // history.replaceState({ 'type': "main" }, "", document.location.pathname);
};

export default onepage;