/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const fs = require("fs");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const size = process.argv[2];
const name = process.argv[3];

if (!size || !name) {
  console.log("Usage: genex [size] [name]");
  process.exit(1);
}

const output = path.join(__dirname, "./src/examples/", `${name}.json`);

const lorem =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam efficitur ante justo. Nullam bibendum lectus augue. Vivamus sed commodo felis, non laoreet nibh. Nam facilisis velit tincidunt, lacinia turpis sed, pellentesque lacus.";

const getID = () => ~~(Math.random() * 100000);
const getDouble = () => +(Math.random() * 10000).toFixed(2);
const getBool = () => Math.random() < 0.55;

const obj = {
  id: getID(),
  name: "A Generated Json",
  date: new Date(),
  time: Date.now(),
  subGroup: {
    id: getID(),
    name: "A Generated Group",
    items: new Array(3).fill(null).map((_, i) => ({
      id: getID() + i,
      price: getDouble(),
      ordered: getBool(),
    })),
  },
  children: new Array(+size).fill(null).map((_, i) => ({
    id: i,
    date: new Date(Date.now() - Math.random() * 10000),
    message: lorem.slice(0, Math.max(Math.random() * lorem.length, 5)).trim(),
    bool: getBool(),
  })),
};

function saveExample() {
  console.log("Saving example at: ", path.relative(__dirname, output));
  fs.writeFileSync(output, JSON.stringify(obj, null, 2), {
    encoding: "utf-8",
  });
}

if (fs.existsSync(output)) {
  readline.question(
    `Example "${name}.json" already exists, overwrite? [y/N]: `,
    (res) => {
      if (res.toLowerCase() === "y") {
        saveExample();
      }
      process.exit();
    }
  );
} else {
  saveExample();
}
