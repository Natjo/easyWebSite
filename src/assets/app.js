import onepage from "./modules/onepage.js";
import headernav from "./views/headernav/headernav.js";


onepage(el => {
   // el.querySelectorAll('[data-view]').forEach(view => observer.observe(view))
});


headernav();



/**
 * Observe views
 */

const observer = new IntersectionObserver(items => items.forEach(e => {
    if (e.isIntersecting) {
        import(`./views/${e.target.dataset.view}/${e.target.dataset.view}.js`).then(mod => { mod.default(e.target) });
        observer.unobserve(e.target)
    }
}));
document.querySelectorAll('[data-view]').forEach(view => observer.observe(view))




