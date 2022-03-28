const axios = require('axios');
const googleTTS = require('google-tts-api');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const MAIN_DIR = './public';

function randomName() {
  return (Math.random() * 10e9).toString(32).replace('.', '');
}

function languages() {
  return [
    {
      short: 'ru',
      full: 'Русский',
    },
    {
      short: 'en',
      full: 'English',
    },
    {
      short: 'es',
      full: 'Español',
    },
  ];
}

async function makeACat() {
  const cat = await axios(
    'https://api.thecatapi.com/api/images/get?format=json',
  );
  const imageExtension = cat.data[0].url.slice(
    cat.data[0].url.lastIndexOf('.') + 1,
  );
  const fileName = path.join(MAIN_DIR, `${randomName()}.${imageExtension}`);

  const writer = fsSync.createWriteStream(fileName);

  const response = await axios({
    url: cat.data[0].url,
    method: 'GET',
    responseType: 'stream',
  });

  await response.data.pipe(writer);

  return fileName;
}

async function makeAVoice(lang) {
  const insult = await axios(
    `https://evilinsult.com/generate_insult.php?lang=${lang}&amp;type=json`,
  );

  const resultBase64 = await googleTTS.getAllAudioBase64(insult.data, {
    lang,
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
    splitPunct: ',.?',
  });

  const voiceBase64 = resultBase64.reduce((acc, el) => acc + el.base64, '');
  const fileName = path.join(MAIN_DIR, `${randomName()}.mp3`);
  await fs.writeFile(fileName, voiceBase64, 'base64');
  return fileName;
}

async function tryGenerateCard(lang) {
  let catName;
  let voiceName;
  const outputName = path.join(MAIN_DIR, `${lang}-${randomName()}.mov`);
  try {
    catName = await makeACat();
    voiceName = await makeAVoice(lang);
    await exec(
      // `ffmpeg -y -i ${catName} -i ${voiceName} -vf scale=720x406 -vcodec mpeg4 ${outputName}`,
      `ffmpeg -loop 1 -i ${catName} -i ${voiceName} -vf "scale='min(1280,iw)':-2,format=yuv420p" -c:v libx264 -preset medium -profile:v main -c:a aac -shortest -movflags +faststart ${outputName}`,
    );
  } catch (err) {
    console.error(err);
    try {
      await fs.unlink(outputName);
    } catch (error) {
      console.error(error);
    }
    return undefined;
  } finally {
    try {
      await fs.unlink(catName);
    } catch (err) {
      console.error(err);
    }
    try {
      await fs.unlink(voiceName);
    } catch (err) {
      console.error(err);
    }
  }
  return outputName;
}

async function generateCard(lang = 'ru') {
  for (let i = 0; i < 3; i += 1) {
    const outputName = await tryGenerateCard(lang);
    if (outputName) {
      setTimeout(() => {
        fs.unlink(outputName);
      }, 6e4);
      return outputName;
    }
  }
  return undefined;
}

module.exports = { generateCard, languages };
