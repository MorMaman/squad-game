/**
 * Generate WAV sound files for game effects
 */

const fs = require('fs');
const path = require('path');

const SOUNDS_DIR = path.join(__dirname, '../assets/sounds');

// Ensure directory exists
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

function generateWav(frequency, duration, volume, filename) {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * duration);
  const amplitude = Math.min(1, volume) * 32767;

  // WAV header
  const headerLength = 44;
  const dataLength = numSamples * 2; // 16-bit samples
  const fileLength = headerLength + dataLength;

  const buffer = Buffer.alloc(fileLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileLength - 8, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  // Generate sine wave with envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Apply simple envelope (attack/decay)
    const attackSamples = sampleRate * 0.01;
    const decaySamples = sampleRate * 0.05;
    const envelope = Math.min(1, i / attackSamples) * Math.min(1, (numSamples - i) / decaySamples);
    const sample = Math.sin(2 * Math.PI * frequency * t) * amplitude * envelope;
    buffer.writeInt16LE(Math.round(sample), headerLength + i * 2);
  }

  fs.writeFileSync(path.join(SOUNDS_DIR, filename), buffer);
  console.log(`Generated: ${filename}`);
}

function generateMelody(notes, filename) {
  const sampleRate = 44100;
  let totalSamples = 0;
  notes.forEach(note => {
    totalSamples += Math.floor(sampleRate * note.duration);
  });

  const amplitude = 32767 * 0.4;

  // WAV header
  const headerLength = 44;
  const dataLength = totalSamples * 2;
  const fileLength = headerLength + dataLength;

  const buffer = Buffer.alloc(fileLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileLength - 8, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  // Generate notes
  let sampleIndex = 0;
  notes.forEach(note => {
    const noteSamples = Math.floor(sampleRate * note.duration);
    for (let i = 0; i < noteSamples; i++) {
      const t = i / sampleRate;
      const attackSamples = sampleRate * 0.01;
      const decaySamples = sampleRate * 0.03;
      const envelope = Math.min(1, i / attackSamples) * Math.min(1, (noteSamples - i) / decaySamples);
      const sample = Math.sin(2 * Math.PI * note.frequency * t) * amplitude * envelope;
      buffer.writeInt16LE(Math.round(sample), headerLength + (sampleIndex + i) * 2);
    }
    sampleIndex += noteSamples;
  });

  fs.writeFileSync(path.join(SOUNDS_DIR, filename), buffer);
  console.log(`Generated: ${filename}`);
}

// Generate individual sounds
const sounds = [
  { name: 'tap.wav', frequency: 800, duration: 0.08, volume: 0.3 },
  { name: 'correct.wav', frequency: 880, duration: 0.2, volume: 0.4 },
  { name: 'wrong.wav', frequency: 200, duration: 0.3, volume: 0.3 },
  { name: 'countdown.wav', frequency: 440, duration: 0.15, volume: 0.3 },
  { name: 'go.wav', frequency: 880, duration: 0.25, volume: 0.5 },
  { name: 'levelUp.wav', frequency: 660, duration: 0.35, volume: 0.5 },
  { name: 'match.wav', frequency: 700, duration: 0.25, volume: 0.4 },
  { name: 'flip.wav', frequency: 1200, duration: 0.08, volume: 0.2 },
  { name: 'tick.wav', frequency: 1000, duration: 0.05, volume: 0.15 },
  { name: 'warning.wav', frequency: 300, duration: 0.2, volume: 0.3 },
];

sounds.forEach(s => generateWav(s.frequency, s.duration, s.volume, s.name));

// Generate melodies
generateMelody([
  { frequency: 523.25, duration: 0.12 }, // C5
  { frequency: 659.25, duration: 0.12 }, // E5
  { frequency: 783.99, duration: 0.25 }, // G5
], 'success.wav');

generateMelody([
  { frequency: 400, duration: 0.18 },
  { frequency: 300, duration: 0.18 },
  { frequency: 200, duration: 0.35 },
], 'gameOver.wav');

// Simon Says notes
generateWav(329.63, 0.35, 0.4, 'simon-red.wav');    // E4
generateWav(261.63, 0.35, 0.4, 'simon-blue.wav');   // C4
generateWav(392.00, 0.35, 0.4, 'simon-green.wav');  // G4
generateWav(523.25, 0.35, 0.4, 'simon-yellow.wav'); // C5

console.log('All sounds generated!');
