#!/usr/bin/env node

import { resolve, basename, parse } from "path";
import { readdir, rename } from "fs/promises";

async function* getFiles(dir, reg) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      yield* getFiles(res, reg);
    } else {
      if (reg.test(basename(res))) {
        yield res;
      }
    }
  }
}

void (async () => {
  for await (const file of getFiles("./", /\.js/)) {
    const { dir, base } = parse(file);
    const newBase = base.replace(/bar/, "code");
    const oldPath = resolve(dir, base);
    const newPath = resolve(dir, newBase);

    const res = await rename(oldPath, newPath);
    if (!res) {
      console.log(`success: ${newPath}`);
    }
  }
})();
