/**
 * Downloads freely licensed demo photography from Wikimedia Commons and
 * portrait placeholders from pravatar.cc into /public/images.
 *
 * Run: node scripts/fetch-images.mjs
 * Credits are written to public/images/credits.json
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images");
fs.mkdirSync(OUT, { recursive: true });

const COMMONS = [
  ["hero-campus", "modern university campus building architecture", 0],
  ["hero-library", "university library reading room students", 0],
  ["about-campus", "university campus aerial view quad", 1],
  ["director", null, null],
  ["classroom", "university lecture hall students", 0],
  ["laboratory", "university science laboratory students experiment", 0],
  ["computer-lab", "university computer lab students", 0],
  ["library", "library bookshelves students reading", 1],
  ["sports", "university sports ground athletics students", 0],
  ["graduation", "university graduation ceremony students", 0],
  ["seminar", "academic seminar conference speaker audience", 0],
  ["workshop", "students workshop collaborative teamwork", 1],
  ["campus-event", "university cultural festival stage students", 0],
  ["campus-life", "students walking campus university", 1],
  ["campus-hostel", "university student hostel residence building", 0],
  ["campus-canteen", "university cafeteria students", 0],
  ["campus-auditorium", "university auditorium hall", 0],
  ["course-cs", "computer science students programming", 0],
  ["course-business", "business students meeting presentation", 0],
  ["course-engineering", "engineering students workshop machine", 1],
  ["course-health", "nursing students hospital training", 0],
  ["course-design", "design students studio creative work", 1],
  ["course-commerce", "accounting finance students classroom", 1],
  ["course-hotel", "hotel management students hospitality", 0],
  ["course-science", "chemistry laboratory students research", 1],
  ["news-1", "university students studying together", 2],
  ["news-2", "academic books research study desk", 1],
  ["news-3", "campus tree walkway autumn", 2],
  ["faculty-work", "professor teaching classroom university", 0],
  ["placement", "job interview career fair students", 0],
  ["research", "research laboratory scientist university", 2],
  ["mentorship", "teacher student mentor discussion", 1],
  ["gallery-1", "university building facade architecture", 3],
  ["gallery-2", "students laboratory practical", 2],
  ["gallery-3", "campus garden statue", 3],
  ["gallery-4", "students group study library", 3],
];

const PORTRAITS = [
  ["p-01", 12], ["p-02", 13], ["p-03", 14], ["p-04", 15],
  ["p-05", 16], ["p-06", 17], ["p-07", 26], ["p-08", 31],
  ["p-09", 33], ["p-10", 44], ["p-11", 47], ["p-12", 51],
  ["p-13", 56], ["p-14", 60], ["p-15", 68], ["p-16", 5],
];

const credits = [];

const UA = "AgentivaDemoBuilder/1.0 (educational demo website; contact: demo@agentiva.example)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchWithRetry(url, tries = 6) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`http ${res.status}`);
        await sleep(4000 + i * 5000);
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      await sleep(3000 + i * 4000);
    }
  }
  throw lastErr;
}

async function commonsSearch(query, index) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent("filetype:bitmap " + query)}` +
    "&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1600&format=json";
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`search ${res.status}`);
  const json = await res.json();
  const pages = Object.values(json?.query?.pages ?? {});
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  const page = pages[Math.min(index, pages.length - 1)];
  if (!page?.imageinfo?.[0]?.thumburl && !page?.imageinfo?.[0]?.url)
    throw new Error("no image for " + query);
  const info = page.imageinfo[0];
  return {
    url: info.thumburl || info.url,
    title: page.title,
    page: info.descriptionurl,
    artist: String(info.extmetadata?.Artist?.value ?? "")
      .replace(/<[^>]+>/g, "")
      .trim()
      .slice(0, 80),
    license: String(info.extmetadata?.LicenseShortName?.value ?? "").slice(0, 40),
  };
}

async function download(name, url) {
  const file = path.join(OUT, `${name}.jpg`);
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`download ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(file, buf);
  return buf.length;
}

const FALLBACKS = {
  seminar: "conference presentation audience lecture",
  workshop: "students team working table",
  "campus-event": "university students celebration event",
  "campus-hostel": "student residence hall building",
  "campus-canteen": "canteen restaurant interior",
  "campus-auditorium": "auditorium interior seats",
  "course-cs": "programming code screen computer",
  "course-business": "business meeting presentation office",
  "course-engineering": "mechanical workshop lathe machine",
  "course-health": "nurse hospital ward care",
  "course-design": "graphic design studio desk",
  "course-commerce": "calculator financial documents desk",
  "course-hotel": "hotel reception lobby",
  "course-science": "laboratory flask chemistry",
  "news-1": "students studying notebook",
  "news-2": "books open study",
  "news-3": "campus path trees",
  "faculty-work": "professor lecturer blackboard",
  placement: "handshake interview office",
  research: "microscope research laboratory",
  mentorship: "two people talking desk",
  "gallery-1": "university building entrance",
  "gallery-2": "students laboratory experiment",
  "gallery-3": "garden park bench",
  "gallery-4": "group study library table",
};

let failures = 0;

for (const [name, query, index] of COMMONS) {
  const file = path.join(OUT, `${name}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 45000) {
    console.log("skip", name);
    continue;
  }
  if (!query) continue;
  const attempts = [query, FALLBACKS[name]].filter(Boolean);
  let done = false;
  for (const q of attempts) {
    try {
      const meta = await commonsSearch(q, q === query ? index : 0);
      const size = await download(name, meta.url);
      credits.push({ name, ...meta });
      console.log("ok", name, (size / 1024) | 0, "KB");
      done = true;
      break;
    } catch (err) {
      console.log("retry-fail", name, q, err.message);
      await sleep(3500);
    }
  }
  if (!done) {
    failures++;
    console.log("FAIL", name);
  }
  await sleep(2200);
}

for (const [name, idx] of PORTRAITS) {
  const file = path.join(OUT, `${name}.jpg`);
  if (fs.existsSync(file) && fs.statSync(file).size > 5000) continue;
  try {
    const size = await download(name, `https://i.pravatar.cc/600?img=${idx}`);
    credits.push({ name, title: `Portrait placeholder ${idx}`, page: "https://pravatar.cc", artist: "pravatar.cc", license: "placeholder" });
    console.log("ok", name, (size / 1024) | 0, "KB");
  } catch (err) {
    failures++;
    console.log("FAIL", name, err.message);
  }
}

// director portrait (larger)
try {
  if (!fs.existsSync(path.join(OUT, "director.jpg"))) {
    const size = await download("director", "https://i.pravatar.cc/600?img=11");
    credits.push({ name: "director", title: "Portrait placeholder", page: "https://pravatar.cc", artist: "pravatar.cc", license: "placeholder" });
    console.log("ok director", (size / 1024) | 0, "KB");
  }
} catch (err) {
  console.log("FAIL director", err.message);
}

fs.writeFileSync(path.join(OUT, "credits.json"), JSON.stringify(credits, null, 2));
console.log("done. failures:", failures);
