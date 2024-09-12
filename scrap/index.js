const pkg4css = require("../components/pkgs/css.json");
const pkg4js = require("../components/pkgs/js.json");
const pkg4viz = require("../components/pkgs/viz.json");
const pkg4build = require("../components/pkgs/build.json");
const pkg4d3 = require("../components/pkgs/d3.json");
const pkg4visx = require("../components/pkgs/visx.json");
const fs = require("fs");
const { ProxyAgent } = require("undici");
// nodejs delete directory
// https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
const rimraf = require("rimraf");
rimraf.sync("public/data");
fs.mkdirSync("public/data");

const dimensions = ["w", "m", "y"];

// get time range in format [yyyy-MM-dd, yyyy-MM-dd] by given dimension
// if d is "w" then return the range of the last week
// if d is "m" then return the range of the last month
// if d is "y" then return the range of the last year
function getTimeRange(d) {
  const now = new Date();
  const from = new Date();
  let until = new Date();
  switch (d) {
    case "w":
      from.setDate(now.getDate() - 7);
      break;
    case "m":
      from.setMonth(now.getMonth() - 1);
      break;
    case "y":
      from.setFullYear(now.getFullYear() - 1);
      break;
  }
  from.setDate(from.getDate() - 7);
  until.setDate(until.getDate() - 7);
  return [from.toISOString().split("T")[0], until.toISOString().split("T")[0]];
}

function scrapPkg(pkg) {
  pkg.forEach((p) => {
    const name = p.replace("/", "-");
    const path = `public/data/${name}`;
    try {
      fs.mkdirSync(path);
    } catch (e) {
      console.log(`Directory ${path} already exists`);
    }
    dimensions.forEach((d) => {
      const [from, to] = getTimeRange(d);
      fetch(
        `https://npm-trends-proxy.uidotdev.workers.dev/npm/downloads/range/${from}:${to}/${p}`,
        {
          dispatcher: new ProxyAgent("http://127.0.0.1:8889"),
        }
      ).then((res) => {
        res.json().then((data) => {
          const downloads =
            d === "w"
              ? data.downloads
              : data.downloads.filter((d, idx) => idx % 7 === 0);
          try {
            fs.writeFileSync(
              `${path}/${d}.json`,
              JSON.stringify({ ...data, downloads }, null, 2)
            );
          } catch (error) {
            console.log(`Error writing file: ${path}/${d}.json`, error);
          }
        });
      });
    });
  });
}

scrapPkg(pkg4css);
scrapPkg(pkg4js);
scrapPkg(pkg4viz);
scrapPkg(pkg4build);
scrapPkg(pkg4d3);
scrapPkg(pkg4visx);
