#!/usr/bin/env node

import { resolve, parse } from "path";
import { readdir, rename, stat } from "fs/promises";

async function* getTargets(dir, reg) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      yield* getTargets(res, reg);
    }

    if (reg.test(parse(res).base)) {
      yield res;
    }
  }
}

void (async () => {
  for await (const file of getTargets("./", /./)) {
    const { dir, base } = parse(file);
    const newBase = base.replace(/code$/, "bar");

    const oldPath = resolve(dir, base);
    const newPath = resolve(dir, newBase);

    const ignoreDirectory = true;

    if (ignoreDirectory) {
      const { isDirectory } = await stat(oldPath);
      if (isDirectory) {
        continue;
      }
    }

    const res = await rename(oldPath, newPath);

    if (!res) {
      console.log(`success: ${newPath}`);
    }
  }
})();
