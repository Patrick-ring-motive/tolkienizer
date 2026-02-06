https://patrick-ring-motive.github.io/tolkienizer/# Tolkienizer

[Live Demo](https://patrick-ring-motive.github.io/tolkienizer/)

A specialized text processing and analysis tool designed for exploring the works of J.R.R. Tolkien through n-gram models, k-nearest neighbors (k-NN) analysis, and inverted indexing.

## Features

- **N-Gram Models**: Implements bi-gram and tri-gram models for linguistic analysis of Tolkien's texts.
- **Search & Indexing**: Includes an inverted index for efficient text searching across multiple book files.
- **Linguistic Comparisons**: Contains various versions of Tolkien's works (The Hobbit, Fellowship of the Ring, etc.) in different languages and formats for comparative analysis.
- **Web Interface**: Interactive HTML/JS interface for exploring the models and data.

## Project Structure

- `index.html`: Main web entry point.
- `index.js`: Core logic for text processing and model interaction.
- `invertIndex.js`: Logic for building and querying the inverted index.
- `knn-gen.js`: k-Nearest Neighbors generation for text similarity.
- `*.txt`: A vast collection of source texts from Tolkien's bibliography, including translations.
- `*.json.txt.gz`: Compressed pre-computed linguistic models.

## Usage

Simply open `index.html` in a browser to access the interactive Tolkienizer tools. The application loads the pre-computed models to provide insights into the vocabulary and linguistic patterns of the Middle-earth legendarium.
