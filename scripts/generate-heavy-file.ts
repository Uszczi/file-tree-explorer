import { createWriteStream, statSync } from "node:fs";

// Usage: node scripts/generate-heavy-file.ts <MB> [output-file]
//   node scripts/generate-heavy-file.ts 300           -> data-300mb.json (300,000,000 bytes)
//   node scripts/generate-heavy-file.ts 42 out.json   -> out.json (42,000,000 bytes)
//
// Output is a JSON tree accepted by src/lib/tree/validate.ts:
// root -> 100 folders -> each has one subfolder (20 files) + k direct files.
// Serialized as a stream, so memory use is constant regardless of target size.

const FOLDERS = 100;
const SUBFOLDER_FILES = 20;
// 9-digit names keep every node the same length for any realistic file count.
const fileJson = (i: number): string =>
  `{"name":"file-${String(i).padStart(9, "0")}","type":"file","size":${1000000 + ((i * 7919) % 9000000)}}`;

const FILE_LEN = fileJson(0).length;
const DIR_WITH_SUBFOLDER =
  `{"name":"dir-0000","type":"folder","children":[` +
  `{"name":"sub-0000","type":"folder","children":[${Array.from({ length: SUBFOLDER_FILES }, (_, j) => fileJson(j)).join(",")}]}` +
  `]}`;
const DIR_LEN = DIR_WITH_SUBFOLDER.length;
const ROOT_PREFIX = '{"name":"root","type":"folder","children":[';
const ROOT_SUFFIX = "]}";

function parseArgs(): { target: number; outFile: string } {
  const mbArg = process.argv[2];
  if (mbArg === undefined || !/^\d+$/.test(mbArg)) {
    console.error("Usage: node scripts/generate-heavy-file.ts <MB> [output-file]");
    process.exit(1);
  }
  const mb = Number(mbArg);
  if (mb === 0) {
    console.error("MB must be a positive integer");
    process.exit(1);
  }
  if (mb * 1_000_000 > 512_000_000) {
    console.error(
      `Note: V8 strings max out near 536M chars, so JSON.parse cannot load a ${mb} MB file at once (see src/lib/tree/validate.ts).`,
    );
  }
  return { target: mb * 1_000_000, outFile: process.argv[3] ?? `data-${mb}mb.json` };
}

async function generate(target: number, outFile: string): Promise<void> {
  const k = Math.floor(
    (target - ROOT_PREFIX.length - ROOT_SUFFIX.length - (FOLDERS - 1) - FOLDERS * DIR_LEN) /
      (FOLDERS * (FILE_LEN + 1)),
  );
  const total =
    ROOT_PREFIX.length + FOLDERS * (DIR_LEN + k * (FILE_LEN + 1)) + (FOLDERS - 1) + ROOT_SUFFIX.length;
  const pad = target - total;
  if (k < 0 || pad < 0) {
    throw new Error(`target ${target} bytes too small for this layout (max ${total < 0 ? 0 : total})`);
  }

  const stream = createWriteStream(outFile);
  const failed = new Promise<never>((_, reject) => stream.once("error", reject));
  const writeChunk = (s: string) =>
    Promise.race([
      new Promise<void>((resolve) => {
        if (stream.write(s)) resolve();
        else stream.once("drain", () => resolve());
      }),
      failed,
    ]);

  let counter = 0;
  await writeChunk(ROOT_PREFIX);
  for (let d = 0; d < FOLDERS; d++) {
    const ds = String(d).padStart(4, "0");
    let chunk =
      `{"name":"dir-${ds}","type":"folder","children":[` +
      `{"name":"sub-${ds}","type":"folder","children":[`;
    const subParts: string[] = [];
    for (let j = 0; j < SUBFOLDER_FILES; j++) subParts.push(fileJson(counter++));
    chunk += subParts.join(",") + "]}";
    const parts: string[] = [];
    for (let j = 0; j < k; j++) {
      const i = counter++;
      // The last file in the tree absorbs the padding needed for an exact byte size.
      parts.push(
        d === FOLDERS - 1 && j === k - 1
          ? fileJson(i).replace('","type":"file"', "x".repeat(pad) + '","type":"file"')
          : fileJson(i),
      );
    }
    chunk += "," + parts.join(",") + "]}";
    await writeChunk(chunk + (d < FOLDERS - 1 ? "," : ""));
  }
  await writeChunk(ROOT_SUFFIX);
  await Promise.race([new Promise<void>((resolve) => stream.end(resolve)), failed]);

  const size = statSync(outFile).size;
  if (size !== target) throw new Error(`size mismatch: ${size} != ${target}`);
  console.log(`${outFile}: ${size} bytes, ${FOLDERS * (SUBFOLDER_FILES + k) + FOLDERS * 2 + 1} nodes`);
}

const { target, outFile } = parseArgs();
generate(target, outFile).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
