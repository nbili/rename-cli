#!/usr/bin/env node

import { resolve, parse } from "path";
import { readdir, stat, rename } from "fs/promises";
import meow from "meow";

const cli = meow(
  `
	Usage
	  $ rename <source> <destination>

	Options
	  --no-directory,--no-d   Ignore rename directory
    --filters=<filters>    Filter source string

	Examples
    Rename current files and directory name 'foo' to 'bar'
	   $ rename 'foo' 'bar'
`,
  {
    importMeta: import.meta,
    flags: {
      directory: {
        type: "boolean",
        alias: "d",
        default: true,
      },
      filters: {
        type: "string",
        default: "",
      },
    },
  }
);

async function* getTargets(dir, filters) {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const res = resolve(dir, dirent.name);

    if (dirent.isDirectory()) {
      yield* getTargets(res, filters);
    }

    if (parse(res).base.includes(filters)) {
      yield res;
    }
  }
}

void (async () => {
  const source = cli.input[0];
  const destination = cli.input[1];
  const filters = cli.flags.filters;

  if (!source || !destination) return process.exit(1);

  for await (const file of getTargets(".", filters)) {
    const { dir, base } = parse(file);
    const newBase = base.replace(source, destination);

    const oldPath = resolve(dir, base);
    const newPath = resolve(dir, newBase);

    const ignoreDirectory = cli.flags.directory;

    if (ignoreDirectory) {
      const ret = await stat(oldPath);

      if (ret.isDirectory()) {
        continue;
      }
    }

    const res = await rename(oldPath, newPath);

    if (!res) {
      console.log(`success: ${newPath}`);
    }
  }
})();
