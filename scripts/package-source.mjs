import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

// A portable source export: standard ZIP/DEFLATE, UTF-8 paths, no credentials,
// hosting identity, build outputs or nested archives. No package dependency.
export function packageSource(root) {
  const files = [
    "AGENTS.md",
    "README.md",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "next-env.d.ts",
    ".gitignore",
  ];
  const walk = (dir) => {
    for (const entry of readdirSync(join(root, dir), {
      withFileTypes: true,
    }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name);
      if (path === "public/downloads") continue;
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  for (const dir of ["app", "components", "lib", "tests", "scripts", "public"])
    walk(dir);
  const table = Uint32Array.from({ length: 256 }, (_, i) => {
    for (let bit = 0; bit < 8; bit++)
      i = i & 1 ? 0xedb88320 ^ (i >>> 1) : i >>> 1;
    return i >>> 0;
  });
  const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) crc = table[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };
  const local = [],
    central = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from("nowhere-nextjs/" + file.split("\\").join("/"));
    const bytes = readFileSync(join(root, file)),
      compressed = deflateRawSync(bytes),
      crc = crc32(bytes);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(33, 12); // Fixed Jan 1, 1980 date makes exports reproducible.
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(bytes.length, 22);
    header.writeUInt16LE(name.length, 26);
    local.push(header, name, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(crc, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(bytes.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    central.push(record, name);
    offset += header.length + name.length + compressed.length;
  }
  const directory = Buffer.concat(central),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const output = join(root, "public", "downloads", "nowhere-nextjs.zip");
  mkdirSync(join(root, "public", "downloads"), { recursive: true });
  const archive = Buffer.concat([...local, directory, end]);
  writeFileSync(output, archive);
  writeFileSync(
    join(root, "public", "downloads", "nowhere-ecommerce.zip"),
    archive,
  );
  mkdirSync(join(root, "out", "downloads"), { recursive: true });
  writeFileSync(join(root, "out", "downloads", "nowhere-nextjs.zip"), archive);
  writeFileSync(
    join(root, "out", "downloads", "nowhere-ecommerce.zip"),
    archive,
  );
  console.log(
    `Packaged ${files.length} source files: ${relative(root, output)}`,
  );
  return output;
}

packageSource(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
