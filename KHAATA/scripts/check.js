"use strict";

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const errors = [];
const htmlFiles = ["index.html", "about.html", "faq.html", "guides.html", "how-it-works.html", "privacy.html", "terms.html"];

function check(condition, message) {
    if (!condition) errors.push(message);
}

for (const file of ["api/analyze.js", "api/cities.js", "server.js"]) {
    const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    check(result.status === 0, `JavaScript syntax failed for ${file}: ${result.stderr || result.stdout}`);
}

for (const file of htmlFiles) {
    const full = path.join(root, file);
    check(fs.existsSync(full), `Missing required HTML page: ${file}`);
    if (!fs.existsSync(full)) continue;
    const html = fs.readFileSync(full, "utf8");
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)];
    for (const [, attrs, body] of scripts) {
        if (!body.trim() || /\bsrc\s*=/.test(attrs)) continue;
        const temp = path.join(os.tmpdir(), `khaata-inline-${process.pid}.js`);
        fs.writeFileSync(temp, body);
        const result = spawnSync(process.execPath, ["--check", temp], { encoding: "utf8" });
        fs.rmSync(temp, { force: true });
        check(result.status === 0, `Inline JavaScript syntax failed in ${file}: ${result.stderr || result.stdout}`);
    }

    for (const [, href] of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
        if (/^(?:https?:|mailto:|tel:|javascript:|\/\/)/i.test(href)) continue;
        const [pathname, fragment] = href.split("#");
        if (pathname) {
            const target = pathname.startsWith("/")
                ? path.resolve(root, "." + pathname)
                : path.resolve(root, path.dirname(file), pathname);
            check(target.startsWith(root) && fs.existsSync(target), `Broken local link in ${file}: ${href}`);
        }
        if (fragment) {
            const id = decodeURIComponent(fragment);
            check(new RegExp(`(?:id|name)=["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "i").test(html), `Broken in-page anchor in ${file}: ${href}`);
        }
    }
}

const analyze = fs.readFileSync(path.join(root, "api/analyze.js"), "utf8");
check(/item\.id\s*&&/.test(analyze), "World Bank directory filter must use item.id.");
check(/return\s+match\s*\?\s*match\.id\s*:\s*null/.test(analyze), "World Bank country lookup must return match.id.");
check(fs.existsSync(path.join(root, "ads.txt")), "ads.txt is missing.");
check(fs.existsSync(path.join(root, "robots.txt")), "robots.txt is missing.");
check(fs.existsSync(path.join(root, "sitemap.xml")), "sitemap.xml is missing.");

if (errors.length) {
    console.error(`KHAATA checks failed (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
}

console.log(`KHAATA checks passed: ${htmlFiles.length} HTML pages, local links, inline JS syntax, API syntax, legal pages, and SEO files.`);
