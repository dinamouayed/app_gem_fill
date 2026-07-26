const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "assets", "sounds");

function writeToneWav(filePath, frequency, durationMs, volume = 0.28) {
  const sampleRate = 22050;
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < numSamples; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.exp((-5 * time) / (durationMs / 1000));
    const sample =
      Math.sin(2 * Math.PI * frequency * time) * envelope * volume;
    buffer.writeInt16LE(
      Math.max(-32768, Math.min(32767, Math.floor(sample * 32767))),
      44 + index * 2,
    );
  }

  fs.writeFileSync(filePath, buffer);
}

function writeSuccessWav(filePath) {
  const sampleRate = 22050;
  const tones = [
    { frequency: 660, startMs: 0, durationMs: 90, volume: 0.22 },
    { frequency: 880, startMs: 70, durationMs: 130, volume: 0.24 },
  ];
  const totalMs = 220;
  const numSamples = Math.floor((sampleRate * totalMs) / 1000);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < numSamples; index += 1) {
    const timeMs = (index / sampleRate) * 1000;
    let sample = 0;

    for (const tone of tones) {
      if (timeMs < tone.startMs || timeMs > tone.startMs + tone.durationMs) {
        continue;
      }

      const localTime = (timeMs - tone.startMs) / 1000;
      const envelope = Math.exp((-4 * localTime) / (tone.durationMs / 1000));
      sample +=
        Math.sin(2 * Math.PI * tone.frequency * localTime) *
        envelope *
        tone.volume;
    }

    buffer.writeInt16LE(
      Math.max(-32768, Math.min(32767, Math.floor(sample * 32767))),
      44 + index * 2,
    );
  }

  fs.writeFileSync(filePath, buffer);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
writeToneWav(path.join(OUTPUT_DIR, "select.wav"), 920, 45);
writeToneWav(path.join(OUTPUT_DIR, "place.wav"), 560, 75, 0.32);
writeToneWav(path.join(OUTPUT_DIR, "error.wav"), 180, 120, 0.35);
writeSuccessWav(path.join(OUTPUT_DIR, "success.wav"));

console.log("Generated sound effects in assets/sounds/");
