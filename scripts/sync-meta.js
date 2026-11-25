// Copies the title / description / share text from content/site.json into the plain HTML of index.html.
// Why: link previews (iMessage, LinkedIn, Instagram, Google) read index.html directly and don't run the page's JavaScript.
// Run automatically by .github/workflows/sync-meta.yml whenever content/site.json changes. Safe to run by hand: node scripts/sync-meta.js
const fs = require('fs');
const site = JSON.parse(fs.readFileSync('content/site.json', 'utf8'));
let html = fs.readFileSync('index.html', 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const share = site.share || {};
const origin = String(share.url || '').replace(/\/+$/, '');
const image = !share.image ? '' : /^https?:/.test(share.image) ? share.image : origin + '/' + String(share.image).replace(/^\/+/, '');

function meta(attr, key, value) {
  if (!value) return;
  const re = new RegExp('(<meta\\s+' + attr + '="' + key + '"\\s+content=")[^"]*(")');
  if (!re.test(html)) { console.warn('not found: ' + key); return; }
  html = html.replace(re, (m, a, b) => a + esc(value) + b);
}
if (site.title) html = html.replace(/<title>[^<]*<\/title>/, () => '<title>' + esc(site.title) + '</title>');
meta('name', 'description', site.description);
meta('property', 'og:title', share.title);
meta('property', 'og:description', share.description);
meta('property', 'og:url', share.url);
meta('property', 'og:image', image);
meta('name', 'twitter:image', image);
fs.writeFileSync('index.html', html);
console.log('index.html meta updated');
