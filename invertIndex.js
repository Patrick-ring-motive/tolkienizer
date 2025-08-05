(() => {
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
    for (let i = 1; i !== dp_length; ++i) {
      const dpi_length = dp[i].length;
      for (let x = 1; x !== dpi_length; ++x) {
        if (arr1[i - 1] === arr2[x - 1]) {
          dp[i][x] = dp[i - 1][x - 1] + 1;
        } else {
          dp[i][x] = Math.max(dp[i][x - 1], dp[i - 1][x]);
        }
      }
    }
    return dp[arr1.length][arr2.length];
  };

  const weightedLCS = (seq1, seq2) => {
    return (
      (lcs(seq1, seq2) * Math.min(seq1.length, seq2.length)) /
      Math.max(seq1.length, seq2.length)
    );
  };

  let wordList = Object.keys(
    globalThis["ngram-models"]?.trimodel ?? { test: "test" },
  );

  const charIndex = new Map();
  const pairIndex = new Map();

  const unique = (iter) => [...new Set([...iter])];

  const clamp = (min, x, max) => {
    return Math.min(Math.max(x, min), max);
  };

  const getPairs = (word) => {
    const distance = 2;
    const pairs = new Set();
    const wordLength = word.length;
    for (let c = 0; c !== wordLength; ++c) {
      const cDistance = 1 + c + distance;
      for (let i = c; i !== cDistance; ++i) {
        if (word[i]) {
          pairs.add([word[c], word[i]].sort().join(""));
        }
      }
    }
    return pairs;
  };

  const wordListLength = wordList.length;
  for (let i = 0; i !== wordListLength; ++i) {
    const word = wordList[i];
    const pairs = getPairs(word);
    for (const pair of pairs) {
      const pairSet = pairIndex.get(pair);
      if (!pairSet) {
        const newPairSet = new Set([word]);
        pairIndex.set(pair, newPairSet);
      } else {
        pairSet.add(word);
      }
    }
  }

  for (const [key, pairIndexValue] of pairIndex) {
    const [firstLetter, secondLetter] = key.toLowerCase();
    let firstLetterMap = charIndex.get(firstLetter);
    if (!firstLetterMap) {
      firstLetterMap = new Map();
      charIndex.set(firstLetter, firstLetterMap);
    }
    let secondLetterSet = firstLetterMap.get(secondLetter);
    if (!secondLetterSet) {
      secondLetterSet = new Set();
      firstLetterMap.set(secondLetter, secondLetterSet);
    }
    for (const w of pairIndexValue) {
      secondLetterSet.add(w);
    }
  }

  const wordHits = function wordHits(word, keep) {
    const pairs = getPairs(word);
    const hits = new Set();
    for (const pair of pairs) {
      const [firstLetter, secondLetter] = pair;
      if (firstLetter === secondLetter && !keep) {
        continue;
      }
      const wList = charIndex.get(firstLetter)?.get(secondLetter) ?? [];
      for (const w of wList) {
        hits.add(w);
      }
    }
    if (!keep && !hits.size) {
      return wordHits(word, true);
    }
    return [...hits];
  };

  const tryParse = (x) => {
    try {
      return JSON.parse(x);
    } catch {
      return x;
    }
  };

  const instanceOf = (x, y) => {
    try {
      return x instanceof y;
    } catch {
      return false;
    }
  };

  const isObject = (x) => typeof x === "object" && x !== null;

  const isArray = (x) =>
    instanceOf(x, Array) ||
    Array.isArray(x) ||
    x?.__proto__ === Array.prototype ||
    x?.constructor?.name === "Array";
  const isMap = (x) =>
    instanceOf(x, Map) ||
    String(x).slice(8, -1) === "Map" ||
    x?.__proto__ === Map.prototype ||
    x?.constructor?.name === "Map";
  const isSet = (x) =>
    instanceOf(x, Set) ||
    String(x).slice(8, -1) === "Set" ||
    x?.__proto__ === Set.prototype ||
    x?.constructor?.name === "Set";

  const isOnlyObject = (x) =>
    isObject(x) && !(isArray(x) || isMap(x) || isSet(x));

  function serializeMap(map) {
    if (isSet(map)) return serializeSet(map);
    if (!isMap(map)) return map;
    const obj = {};
    for (const [key, value] of map) {
      obj[key] = serializeMap(value);
    }
    return obj;
  }

  function serializeSet(set) {
    if (isMap(set)) return serializeMap(set);
    if (!isSet(set)) return set;
    const arr = [];
    for (const value of set) {
      arr.push(serializeSet(value));
    }
    return arr;
  }

  function serialize(x) {
    return JSON.stringify(serializeMap(x));
  }

  function deserializeMap(obj) {
    if (isArray(obj)) return deserializeSet(obj);
    if (!isOnlyObject) return obj;
    const map = new Map();
    for (const key in obj) {
      map.set(key, deserializeMap(obj[key]));
    }
    return map;
  }

  function deserializeSet(arr) {
    if (isOnlyObject(arr)) return deserializeMap(arr);
    if (!isArray(arr)) return arr;
    const set = new Set();
    for (const value of arr) {
      set.add(deserializeSet(value));
    }
    return set;
  }

  function deserialize(x) {
    return deserializeMap(tryParse(x));
  }

  const seri = serialize(charIndex);
  console.log(deserialize(seri));
  console.log(wordHits("text"));
})();
