const pkg = require("../app/pkg.json");
const fs = require("fs");
// const { ProxyAgent } = require("undici");
// nodejs delete directory
// https://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
const rimraf = require("rimraf");
rimraf.sync("data");
fs.mkdirSync("data");

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
  return [from.toISOString().split("T")[0], until.toISOString().split("T")[0]];
}

pkg.forEach((p) => {
  const name = encodeURIComponent(p);
  const path = `data/${name}`;
  fs.mkdirSync(path);
  dimensions.forEach((d) => {
    const [from, to] = getTimeRange(d);
    fetch(
      `https://npm-trends-proxy.uidotdev.workers.dev/npm/downloads/range/${from}:${to}/${p}`,
      // {
      //   dispatcher: new ProxyAgent("http://127.0.0.1:8889"),
      // }
    ).then((res) => {
      res.json().then((data) => {
        const downloads =
          d === "w"
            ? data.downloads
            : data.downloads.filter((d, idx) => idx % 7 === 0);
        fs.writeFileSync(
          `${path}/${d}.json`,
          JSON.stringify({ ...data, downloads }, null, 2)
        );
      });
    });
  });
});
