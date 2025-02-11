const fs = require("fs-extra");
const path = require("path");
const postcss = require("postcss");
const cssnested = require("postcss-nested");
const cssCustomMedia = require("postcss-custom-media");
const postcssGlobalData = require('@csstools/postcss-global-data');
const autoprefixer = require("autoprefixer");
const uglifycss = require("uglifycss");
const babel = require("@babel/core");
const watch = require("node-watch");
const { optimize } = require('svgo');
const isProd = process.argv[2] == "--prod" ? true : false;

let version = 0;
let hasError = false;
let page = {};
let root = false;

let routing;

const src = "src/";
const dist = "web/";

const icon = (literal, width = 24, height = 24) => `<svg class="icon" width="${width}" height="${height}" aria-hidden="true" viewBox="0 0 ${width} ${height}"><use xlink:href="/assets/img/icons.svg#${literal}"></use></svg>`;

const tpl = (literal, args) => `<template id="tpl-${literal}">${fs.readFileSync(`${__dirname}/src/assets/views/${literal}/${literal}.html`, "utf8")}</template>`;

const view = (literal, args) => eval("`" + fs.readFileSync(`${__dirname}/src/assets/views/${literal}/${literal}.html`, "utf8") + "`");

const footer = (literal, args) => eval("`" + fs.readFileSync(`${__dirname}/src/assets/layout/footer.html`, "utf8") + "`");

const header = (args) => eval("`" + fs.readFileSync(`${__dirname}/src/assets/layout/header.html`, "utf8") + "`");

const link = (id, classes, title) => `<a ${classes? `class="${classes}"` : ''} href="${routing[id][page.lang].slug}">${title ? title : routing[id][page.lang].title}</a>`;

const push = (literal, id, args = routing[id][page.lang]) => eval("`" + fs.readFileSync(`${__dirname}/src/assets/views/${literal}/${literal}.html`, "utf8") + "`");

const selectlang = (id) => {
    let html = "";
    for (key in routing[page.id]) {
        const active = key === page.lang ? " active" : "";
        html += `<li><a class="xhr-full${active}"  href="${routing[page.id][key].slug}" lang="${key}">${key}</a></li>`
    }
    return `<ul>${html}</ul>`
}

const core = {
    styles: [],
    initTime: new Date(),
    setVersion() {
        let date = new Date();
        version = `${date.getMonth()}${date.getDay()}${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
    },
    babel(result, dest) {
        let res = isProd ? result.replace(/(import[ {}'".\/a-z_,]+)(.js)/igm, `$1.js?v=${version}`) : result;
        result = babel.transform(res, {
            minified: isProd ? true : false,
            comments: false,
            presets: isProd ? [["minify", { builtIns: "entry" }]] : [],
        }).code;
        fs.ensureDirSync(path.dirname(dest));
        fs.writeFileSync(dest, result);
    },
    postcss(str, func, name) {
        postcss([
            cssnested,
            postcssGlobalData({
                files: [`${src}assets/css/customMedias.css`]
            }),
            cssCustomMedia(),
            autoprefixer({ add: true }),])
            .process(str, { from: "undefined" })
            .catch(error => {
                console.log(`\x1b[90m${error}\x1b[39m\x1b[23m`);
                console.log(error.reason, 'line:', error.line, 'col', error.column);
                core.console(name, "error");
            })
            .then(result => {
                if (result) {
                    func(isProd ? uglifycss.processString(result.css) : result.css);
                }
            });
    },
    compileAssets(file, dist_name, ext) {
        if (ext == ".js") {
            const name = path.parse(file).name;
            let content = fs.readFileSync(file, 'utf8');
            try {
                if (name === "app") {
                    // replace import with content of file
                    // remove export in files
                    for (const match of content.matchAll(/import (.*) from ".(.*)";/g)) {
                        const filecontent = fs.readFileSync("src/assets/" + match[2], 'utf8');
                        content = content.replace(match[0], filecontent);
                    }
                    this.babel(content.replace(/export (.*);/igm, ""), dist_name);
                } else {
                    this.babel(content, dist_name);
                }
            } catch (error) {
                hasError = true;
                console.log(error);
            }
        }
        else if (ext == ".css") {
            const name = path.parse(file).base;
            const str = fs.readFileSync(file, 'utf8')
            this.postcss(str, css => {
                fs.ensureDirSync(path.dirname(dist_name));
                fs.writeFileSync(dist_name, css);
            }, name);
        }
        else if (ext == '.svg') {
            if (isProd) {
                const svgString = fs.readFileSync(file, 'utf8');
                const result = optimize(svgString, {
                    path: dist_name,
                    multipass: true,
                    plugins: ["removeUselessDefs"]
                });
                const optimizedSvgString = result.data;
                fs.ensureDirSync(path.dirname(dist_name));
                fs.writeFileSync(dist_name, optimizedSvgString);
            } else {
                fs.copySync(file, dist_name);
            }
        }
        else fs.copySync(file, dist_name);
    },
    compilePage(file) {
        page.id = path.parse(file).dir.replace(`${__dirname}/src/pages/`, "");
        const name = path.parse(file).name.replace(`${__dirname}/src/pages`, "").split("-");
        page.lang = name.length > 1 ? name[1] : "fr";
        if (!routing[page.id]) return;
        if (!routing[page.id][page.lang]) return;
        page.title = routing[page.id][page.lang].title;
        const content = eval("`" + fs.readFileSync(file, "utf8") + "`");
        const slug = routing[page.id][page.lang].slug;
        const slashe = slug.endsWith("/") ? "" : "/";
        //if (page.slug === "/") root = true;
        const url = dist + slug + slashe;
        fs.ensureDirSync(url);
        fs.writeFileSync(`${url}index.html`, content);
    },
    compileStyles(update = false) {
        let str = "";
        for (let file of core.styles) {
            if (fs.existsSync(file)) {
                str += fs.readFileSync(`${file}`, "utf8");
            }
        }
        core.postcss(str, css => {
            fs.writeFileSync(`${dist}assets/styles.css`, css);
            update && core.console('styles.css', 'update');
        }, 'styles.css');
    },
    dirPage(dir) {
        const recursive = (dir) => {
            fs.readdirSync(dir).forEach((res) => {
                const file = path.resolve(dir, res);
                const stat = fs.statSync(file);
                if (stat && stat.isDirectory()) recursive(file);
                else if (!/.DS_Store$/.test(file)) {
                    if (!/assets/.test(file)) {
                        if (/.html$/.test(file)) {
                            core.compilePage(file);
                        }
                    }
                }
            });
        };
        recursive(dir);
    },
    dirScan(dir) {
        const recursive = (dir) => {
            fs.readdirSync(dir).forEach((res) => {
                const file = path.resolve(dir, res);
                const stat = fs.statSync(file);
                if (stat && stat.isDirectory()) recursive(file);
                else if (!/.DS_Store$/.test(file)) {
                    if (/.css$/.test(file) && !/print.css$/.test(file)) {
                        core.styles.push(file);
                    }
                    else if (!/.html$/.test(file)) {
                        const name = file.replace(`${__dirname}/src/`, "");
                        const filename = path.parse(name).base;
                        const ext = path.extname(filename);
                        core.compileAssets(file, dist + name, ext);
                    }
                }
            });
        };
        recursive(dir);
    },
    rmDir(dirPath, removeSelf) {
        if (removeSelf === undefined) removeSelf = true;
        try {
            var files = fs.readdirSync(dirPath);
        } catch (e) {
            return;
        }
        for (let file of files) {
            const filePath = `${dirPath}/${file}`;
            fs.statSync(filePath).isFile()
                ? fs.unlinkSync(filePath)
                : core.rmDir(filePath);
        }
        removeSelf && fs.rmdirSync(dirPath);
    },
    time: () => (time = (new Date() - core.initTime) / 1000),
    console(filename, evt) {
        let status;
        if (evt == "remove") status = `31mremoved`;
        if (evt == "update") status = `32mupdated`;
        if (evt == "add") status = `36madded`;
        console.log(
            `\x1b[1m${filename}\x1b[22m`,
            `\x1b[${status}\x1b[39m`
        );
    },
};
function start() {
    routing = JSON.parse(fs.readFileSync(`${__dirname}/src/routing.json`, "utf8"));
    isProd && core.setVersion();
    core.rmDir(`${dist}`, false);
    core.dirPage(`${src}pages/`);
    core.dirScan(`${src}`);
    core.compileStyles();
}
start();
if (hasError) {
    core.console('', 'error');
    return;
}

//add htacces if root = false

console.log(`${core.time()}s`);

if (isProd) return;

watch("src/", { recursive: true }, (evt, file) => {

    if (/.DS_Store$/.test(file)) return;

    core.initTime = new Date();
    const isFile = file.indexOf(".") > 0 ? true : false;
    const filename = path.basename(file);
    const ext = path.extname(filename);
    const name = file.replace(`src/`, "");

    if (name === "routing.json") {
        routing = JSON.parse(fs.readFileSync(`${__dirname}/src/routing.json`, "utf8"));
        core.dirPage(`${src}pages/`);
    }
    if (ext === ".html") {
        if (evt == "update" || evt == "add") core.dirPage(`${src}`);
    }
    else {
        if (evt == "update" || evt == "add") {
            core.compileAssets(file, dist + name, ext);
            if (ext === ".js" && filename != "app.js") {
                // compile app.js with is import replaced file
                core.compileAssets(`${src}assets/app.js`, dist + `assets/app.js`, ext);
            }
        }
        if (ext === ".css") core.compileStyles();
    }

    if (ext != ".html") { }
    if (fs.existsSync(dist + name)) {
        // isFile && evt == "remove" ? fs.unlinkSync(dist + name) : core.rmDir(dist + name);

    }


    core.console(filename, evt);
});

console.log(`I'm Watching you...`);
