let words100 =
  "years|ways|worlds|live|lives|hands|parts|children|eyes|places|weeks|cases|points|numbers|groups|problems|facts|times|days|men|women|one|two|three|four|five|six|seven|eight|nine|ten|zero|none|size|sized|sizes|sizing|calls|called|calling|leaves|lefts|leaving|try|tries|trying|feels|felt|feeling|seems|seemed|seeming|asks|asked|asking|tells|told|telling|finds|found|finding|looks|looked|looking|see|sees|seeing|saw|knows|knowing|knew|get|gets|got|getting|works|worked|working|I|a|able|about|after|all|also|am|an|and|any|are|as|ask|at|back|bad|be|because|been|being|bes|big|but|by|call|came|can|case|child|come|comes|coming|company|could|day|different|do|does|doing|done|early|even|eye|fact|feel|few|find|first|for|from|gave|get|give|gives|giving|go|goes|going|good|government|great|group|had|hand|has|have|he|her|high|him|his|how|if|important|in|into|is|it|its|just|know|large|last|leave|life|like|little|long|look|make|makes|making|man|me|most|my|new|next|no|not|now|number|of|old|on|one|only|or|other|our|out|over|own|part|people|person|place|point|problem|public|right|said|same|saw|say|says|see|seeing|seem|sees|shall|she|should|small|so|some|take|takes|taking|tell|than|that|the|their|them|then|there|these|they|thing|think|thinking|thinks|this|thought|time|to|took|try|two|up|us|use|used|uses|using|want|wanted|wanting|wants|was|way|we|week|well|went|were|what|when|which|who|will|with|woman|work|world|would|year|yes|yet|you|young|your";
words100 = words100
  .split("|")
  .filter((x) => x.length <= 5)
  .join("|");
const norm = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

// run **before** you split into tokens
const glueCommonPairs = (text) => {
  const re = RegExp(`\\b(${words100})\\s+(${words100})\\b`, "g");
  let next = text,
    prev;
  do {
    prev = next;
    next = prev.replace(re, "$1_$2");
  } while (next !== prev);
  return next;
};

const glueShortPairs = (text) => {
  const re = /\b([a-z]{1,3})\s+([a-z]{1,3})\b/g;
  let next = text,
    prev;
  do {
    prev = next;
    next = prev.replace(re, "$1_$2");
  } while (next !== prev);
  return next;
};
const words = words100 + "|[a-z]{1,3}";
const gluePairs = (text) => {
  const re = RegExp(`\\b(${words})\\s+(${words})\\b`, "g");
  let next = text,
    prev;
  do {
    prev = next;
    next = prev.replace(re, "$1_$2");
  } while (next !== prev);
  return next;
};

const revWords = [...words100].reverse().join("") + "|[a-z]{1,3}";
const glueReverse = (text) => {
  text = [...text].reverse().join("");
  const re = RegExp(`\\b(${words})\\s+(${words})\\b`, "g");
  let next = text,
    prev;
  do {
    prev = next;
    next = prev.replace(re, "$1_$2");
  } while (next !== prev);
  return [...next].reverse().join("");
};

function buildNGrams(text, n = 3) {
  const model = {};
  text = text
    .replace(/[^a-zA-Z\.\?\!,';\s\(\)]/g, " ")
    .replace(/(\s*\.)+/g, ".")
    .replace(/(\s*\?)+/g, "?")
    .replace(/(\s*\!)+/g, "!")
    .replace(/(\s*\,)+/g, ",")
    .replaceAll(" re ", "'re ")
    .replaceAll(" s ", "'s ")
    .replaceAll(" t ", "'t ")
    .replaceAll(" ve ", "'ve ")
    .replaceAll(" ll ", "'ll ")
    .replaceAll("Sm agol", "Smeagol")
    .replaceAll(" ing ", "ing ")
    .replaceAll("h oden", "heoden")
    .replaceAll("magi cal", "magical")
    .replace(/[A-Z]{2,}/g, (x) => x[0] + x.slice(1).toLowerCase());
  let tokens = norm(`${gluePairs(text)} ${glueReverse(text)} ${text}`)
    .split(/\s+/)
    .filter((x) => x?.trim?.());
  for (let i = 0; i < tokens.length - n + 1; i++) {
    const key = tokens
      .slice(i, i + n - 1)
      .join(" ")
      .trim();
    const next = tokens[i + n - 1];
    if (["www.", ".com", "http"].some((x) => `${key} ${next}`.includes(x)))
      continue;
    model[key] ??= {};
    model[key][next] = (model[key][next] || 0) + 1;
  }
  return model;
}

function buildPrunedNGrams(text, n = 3) {
  const model = {};
  text = text
    .replace(/[^a-zA-Z\.\?\!,';\s\(\)]/g, " ")
    .replace(/(\s*\.)+/g, ".")
    .replace(/(\s*\?)+/g, "?")
    .replace(/(\s*\!)+/g, "!")
    .replace(/(\s*\,)+/g, ",")
    .replaceAll(" re ", "'re ")
    .replaceAll(" s ", "'s ")
    .replaceAll(" t ", "'t ")
    .replaceAll(" ve ", "'ve ")
    .replaceAll(" ll ", "'ll ")
    .replaceAll("Sm agol", "Smeagol")
    .replaceAll(" ing ", "ing ")
    .replace(/[A-Z]{2,}/g, (x) => x[0] + x.slice(1).toLowerCase());
  let tokens = norm(text)
    .split(/\s+/)
    .filter((x) => x?.trim?.());
  for (let i = 0; i < tokens.length - n + 1; i++) {
    const key = tokens
      .slice(i, i + n - 1)
      .join(" ")
      .trim();
    const next = tokens[i + n - 1];
    if (["www.", ".com", "http"].some((x) => `${key} ${next}`.includes(x)))
      continue;
    model[key] ??= {};
    model[key][next] = (model[key][next] || 0) + 1;
  }
  for (const key in model) {
    if (Object.keys(model[key]).length < 2) {
      delete model[key];
    }
  }
  return model;
}

const mergeModels = (...models) => {
  const model = {};
  for (const m of models) {
    for (const key in m) {
      model[key] ??= {};
      for (const next in m[key]) {
        model[key][next] = (model[key][next] || 0) + m[key][next];
      }
    }
  }
  return model;
};

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

function parseDoc(input) {
  return new JSDOM(input).window.document;
}

async function fetchText() {
  try {
    return await (await fetch(...arguments)).text();
  } catch (e) {
    return e.message;
  }
}

async function getDocText(url) {
  const rawDoc = await fetchText(url);
  const doc = parseDoc(rawDoc);
  [
    ...doc.querySelectorAll(
      'script,style,[aria-label="Contents"],[class*="reflist"],[class*="refbegin"],#search,[class*="language-list"]',
    ),
  ].forEach((x) => x.remove());
  return doc.firstElementChild.textContent;
}
//longest common subsequence. Used to find the closest matching trigram if no exact match is found.
const lcs = function lcs(seq1, seq2) {
  "use strict";
  let arr1 = [...(seq1 ?? [])];
  let arr2 = [...(seq2 ?? [])];
  if (arr2.length > arr1.length) {
    [arr1, arr2] = [arr2, arr1];
  }
  const dp = Array(arr1.length + 1)
    .fill(0)
    .map(() => Array(arr2.length + 1).fill(0));
  const dp_length = dp.length;
  for (let i = 1; i !== dp_length; i++) {
    const dpi_length = dp[i].length;
    for (let x = 1; x !== dpi_length; x++) {
      if (arr1[i - 1] === arr2[x - 1]) {
        dp[i][x] = dp[i - 1][x - 1] + 1;
      } else {
        dp[i][x] = Math.max(dp[i][x - 1], dp[i - 1][x]);
      }
    }
  }
  return dp[arr1.length][arr2.length];
};

const stringify = (x) => {
  try {
    return JSON.parse(x);
  } catch {
    return String(x);
  }
};

//Count the number of of possible trigrams that follow a given trigram
const followCount = (model, key) => {
  if (!model[key]) return 0;
  return Object.keys(model[key]).length;
};

function getContextBoost(tokens, key) {
  const context = stringify(tokens.slice(-20));
  return lcs(context, key) / context.length / 20;
}

const actors =
  "Aragorn|Frodo|Gandalf|Legolas|Gimli|Boromir|Samwise|Merry|Pippin|Faramir|Denethor|Elrond|Galadriel|Saruman"
    .toLowerCase()
    .split("|");
const activeActors = {};

function getActorBoost(model, key) {
  if (!model[key]) return 0;
  let score = 0;
  const smk = stringify(model[key]).toLowerCase();
  for (const actor in activeActors) {
    if (smk.includes(actor)) {
      score += 0.2;
    }
    score += 0.2 * ((lcs(smk, actor) * actor.length) / smk.length);
  }
  return score;
}

//Get the next token in the sequence. This is the core of the model.
function getNextToken(keywords, trimodel, bimodel, tokens = []) {
  const randoSkip = false; //Math.random() < 0.1;
  const strtok = stringify(tokens);
  let model = trimodel;
  let maxMatch = 0;
  let keyMatch = keywords;
  let matches = trimodel[keywords];
  let selectedModel = "trigram";
  // 10% chance to do fuzzy match search even if exact match is found.
  if (randoSkip || !matches) {
    selectedModel = "bigram";
    matches = bimodel[keywords.split(" ").pop()];
    if (randoSkip || !matches) {
      selectedModel = "lcs";
      for (const key in trimodel) {
        // lcs finds common sequences.
        // min length/max length punishes differences in length
        // strtok.split(key).length punishes repeated sequences
        const keylcs =
          (lcs(key, keywords) * Math.min(key.length, keywords.length)) /
          (Math.max(key.length, keywords.length) * strtok.split(key).length);
        if (keylcs > maxMatch) {
          maxMatch = keylcs;
          keyMatch = key;
        }
      }
      matches = trimodel[keyMatch];
    } else {
      model = bimodel;
    }
  }
  maxMatch = 0;
  for (const key in matches) {
    //followCount boosts trigrams that have more possible followups
    //followCount is a hueristic inspired by Kneser–Ney smoothing but much simpler
    if (
      (matches[key] +
        getActorBoost(model, key) +
        getContextBoost(tokens, key) +
        followCount(model, key) * 0.01) /
        strtok.split(key).length >
      maxMatch
    ) {
      maxMatch = matches[key];
      keyMatch = key;
    }
  }
  keyMatch = stringify(keyMatch);
  const lk = keyMatch.toLowerCase();
  for (const actor of actors) {
    if (lk.includes(actor)) {
      activeActors[actor] = 20;
    }
  }
  for (const actor in activeActors) {
    activeActors[actor]--;
    if (activeActors[actor] <= 0) {
      delete activeActors[actor];
    }
  }
  if (/[A-Z]/.test(keyMatch) && !/\?|\.|\!/.test(keywords)) {
    activeActors[keyMatch] = 20;
  }
  delete activeActors["I"];
  console.log(
    `Key ${keyMatch} selected from ${selectedModel} and skips ${randoSkip}`,
  );
  return keyMatch;
}

const join = (x, y = "") => {
  try {
    return x.join(y);
  } catch {
    return String(y);
  }
};

const nextTime =
  globalThis.requestIdleCallback ??
  globalThis.requestAnimationFrame ??
  ((x) => setTimeout(x, 0));

const nextIdle = () => new Promise((resolve) => nextTime(resolve));

function generateStream(prompt, trimodel, bimodel, context = []) {
  return new ReadableStream({
    async start(controller) {
      try {
        const tokens = context;
        if (!prompt) {
          prompt = context[context.length - 1];
        }
        if (!prompt) {
          prompt = getNextToken(crypto.randomUUID(), trimodel, bimodel, tokens);
        }
        const out = [];
        context.push(prompt);
        while (join(out).split(/[\.\?\!]/).length < 10) {
          await nextIdle();
          const nextToken = getNextToken(
            `${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`,
            trimodel,
            bimodel,
            tokens,
          );
          tokens.push(nextToken);
          out.push(nextToken);
          controller.enqueue(nextToken);
        }
        controller.close();
      } catch (e) {
        log(e.message);
      }
    },
  });
}

const cap = (txt) => {
  txt = txt.trim();
  return (txt[0]?.toUpperCase?.() || "") + txt.slice(1);
};

function generate(prompt, trimodel, bimodel, context = []) {
  console.log(context.length);
  if (!prompt) {
    prompt = context[context.length - 1];
  }
  const seed1 = getNextToken(prompt, trimodel, bimodel, context);
  const seed2 = getNextToken(`${prompt} ${seed1}`, trimodel, bimodel, context);
  const out = [seed1, seed2];
  context.push(seed1);
  context.push(seed2);
  const tokens = context;
  while (join(out).split(/[\.\?\!]/).length < 10) {
    const nextToken = getNextToken(
      `${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`,
      trimodel,
      bimodel,
      tokens,
    );
    tokens.push(nextToken);
    out.push(nextToken);
  }
  return out
    .join(" ")
    .replace(/\? [a-z]/g, (x) => x.toUpperCase())
    .replace(/\. [a-z]/g, (x) => x.toUpperCase())
    .replace(/\! [a-z]/g, (x) => x.toUpperCase());
}

function generateStream(prompt, trimodel, bimodel, context = []) {
  return new ReadableStream({
    async start(controller) {
      if (!prompt) {
        prompt = context[context.length - 1];
      }
      const seed1 = getNextToken(prompt, trimodel, bimodel, context);
      const seed2 = getNextToken(
        `${prompt} ${seed1}`,
        trimodel,
        bimodel,
        context,
      );
      const out = [seed1, seed2];
      context.push(seed1);
      context.push(seed2);
      const tokens = context;
      while (join(out).split(/[\.\?\!]/).length < 10) {
        await nextIdle();
        const nextToken = getNextToken(
          `${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`,
          trimodel,
          bimodel,
          tokens,
        );
        tokens.push(nextToken);
        out.push(nextToken);
        controller.enqueue(nextToken);
      }
      controller.close();
    },
  });
}

const fsPromises = require("fs/promises");
async function readFile(filePath) {
  try {
    return await fsPromises.readFile(filePath, { encoding: "utf8" });
  } catch (err) {
    return err.message;
  }
}

(async () => {
  let text = (
    await Promise.all([
      readFile("fellowship.txt"),
      readFile("towers.txt"),
      readFile("king.txt"),
      readFile("hobbit.txt"),

      //silmarillion
      //   getDocText("https://archive.org/stream/TheSilmarillionIllustratedJ.R.R.TolkienTedNasmith/The%20Silmarillion%20%28Illustrated%29%20-%20J.%20R.%20R.%20Tolkien%3B%20Ted%20Nasmith%3B_djvu.txt"),

      /*
      //elfland
      getDocText("https://www.gutenberg.org/files/61077/61077-0.txt"),
      
      //beowulf
      getDocText("https://www.gutenberg.org/cache/epub/16328/pg16328.txt"),
      
      
      //modern beowulf
      getDocText("https://www.gutenberg.org/cache/epub/50742/pg50742.txt"),
      
      //The Kalevala

      getDocText("https://www.gutenberg.org/cache/epub/5186/pg5186.txt"),
      
      //fellowship movie script
      getDocText("https://imsdb.com/scripts/Lord-of-the-Rings-Fellowship-of-the-Ring,-The.html"),
      getDocText("https://imsdb.com/scripts/Lord-of-the-Rings-The-Two-Towers.html"),
      getDocText("https://imsdb.com/scripts/Lord-of-the-Rings-Return-of-the-King.html"),
      getDocText("https://pjhobbitfilms.fandom.com/wiki/The_Hobbit:_An_Unexpected_Journey/Transcript"),*/
      /*   (async () =>
        (
          await getDocText("https://www.gutenberg.org/cache/epub/10/pg10.txt")
        ).replaceAll("’", "'"))(),*/
    ])
  ).join(" ");

  let trimodel = mergeModels(buildNGrams(text), buildPrunedNGrams(text));
  trimodel = Object.fromEntries(Object.entries(trimodel).sort());
  let bimodel = mergeModels(buildNGrams(text, 2), buildPrunedNGrams(text, 2));
  bimodel = Object.fromEntries(Object.entries(bimodel).sort());

  const fs = require("fs");
  const { execSync } = require("child_process");

  fs.writeFileSync("trimodel.json.txt", JSON.stringify(trimodel).replaceAll('","','¸'));
  execSync("gzip -k --force trimodel.json.txt");

  fs.writeFileSync("bimodel.json.txt", JSON.stringify(bimodel).replaceAll('","','¸'));
  execSync("gzip -k --force bimodel.json.txt");

  const sil = await getDocText(
    "https://archive.org/stream/TheSilmarillionIllustratedJ.R.R.TolkienTedNasmith/The%20Silmarillion%20%28Illustrated%29%20-%20J.%20R.%20R.%20Tolkien%3B%20Ted%20Nasmith%3B_djvu.txt",
  );
  fs.writeFileSync("sil.txt", sil);

  let context = [];
  let prompt = ">Aragorn";
  console.log(prompt);
  console.log(generate(prompt, trimodel, bimodel, context));
})();
