function getNextToken(keywords, trimodel, bimodel, tokens = []) {
  // ... (your existing randoSkip, strtok, etc.)

  let model = trimodel;
  let maxMatch = 0;
  let keyMatch = keywords;
  let matches = trimodel[keywords];  // Exact trigram
  let selectedModel = "trigram";

  if (randoSkip || !matches) {
    selectedModel = "bigram";
    matches = bimodel[keywords.split(" ").pop()];
    if (randoSkip || !matches) {
      selectedModel = "knn-lcs";  // New: k-NN pre-filter + LCS rerank

      // k-NN query: Find top 30 similar trigram keys to current 'keywords'
      const knnNominees = lexicalSearch.search(keywords, 30);  // Returns {id, similarity, text: originalKey}
      const nomineeKeys = knnNominees.map(n => n.text);  // e.g., ["of power", "in shadows", ...]

      // Rerank nominees with your exact scoring logic
      for (const nomineeKey of nomineeKeys) {
        if (!trimodel[keywords.split(" ").pop()]?.[nomineeKey]) continue;  // Must be a valid follow-up

        let repeatTax = strtok.split(nomineeKey).length;
        const candidateScore = (
          trimodel[keywords.split(" ").pop()][nomineeKey] +  // Base freq
          getActorBoost(model, nomineeKey) +
          getContextBoost(tokens, nomineeKey) +
          followCount(model, nomineeKey) * 0.01
        ) / repeatTax;

        if (candidateScore > maxMatch) {
          maxMatch = candidateScore;
          keyMatch = nomineeKey;
          matches = { [nomineeKey]: trimodel[keywords.split(" ").pop()][nomineeKey] };  // Fake 'matches' for downstream
        }
      }
    } else {
      model = bimodel;
    }
  }

  // ... (rest unchanged: score loop, actor boosts, etc.)
  // In the score loop, it now works on the filtered 'matches' from k-NN
  maxMatch = 0;
  for (const key in matches) {
    // Your existing scoring...
  }

  // ... (return keyMatch)
}
