import React, { useState, useEffect, useMemo, SetStateAction } from "react";

const App = () => {
  const [poem, setPoem] = useState<string | null>(null);
  if (poem === null) {
    return <PoemForm onSubmit={(poem: string) => setPoem(poem)} />;
  } else {
    return <PlayPoem poem={poem} />;
  }
};

const makeStructuredPoem = (poem: string): string[][] => {
  return poem.split("\n").map((line) => line.split(" "));
};

const extractWords = (poem: string): Set<String> => {
  let words = poem
    .split("\n")
    .map((line) =>
      line.split(" ").map((word) => actualWord(word).toUpperCase())
    )
    .flat();
  return new Set(words);
};

const PoemForm = ({ onSubmit }: { onSubmit: (poem: string) => void }) => {
  const [poemText, setPoemText] = useState<string>("");
  return (
    <div>
      <textarea
        value={poemText}
        onChange={(e) => setPoemText(e.target.value)}
      ></textarea>
      <input type="submit" onClick={(e) => onSubmit(poemText)} />
    </div>
  );
};

const actualWord = (word: string) => {
  return word.replace(/[^a-zA-Z']/g, "");
};

const PlayPoem = ({ poem }: { poem: string }) => {
  const structuredPoem = useMemo(() => makeStructuredPoem(poem), [poem]);
  const wordsInPoem = useMemo(() => extractWords(poem), [poem]);
  const [started, setStarted] = useState(false);
  const [correctWords, setCorrectWords] = useState<Set<string>>(new Set());
  const [guess, setGuess] = useState("");

  const changeGuess = (guess: string) => {
    const upperGuess = guess.toUpperCase();
    if (wordsInPoem.has(upperGuess) && !correctWords.has(upperGuess)) {
      const newCorrectWords = new Set(correctWords);
      newCorrectWords.add(upperGuess);
      setCorrectWords(newCorrectWords);
      setGuess("");
    } else {
      setGuess(guess);
    }
  };

  return (
    <div>
      <input value={guess} onChange={(e) => changeGuess(e.target.value)} />
      <MaskedPoem
        structuredPoem={structuredPoem}
        correctWords={correctWords}
      ></MaskedPoem>
    </div>
  );
};

const MaskedPoem = ({
  structuredPoem,
  correctWords,
}: {
  structuredPoem: string[][];
  correctWords: Set<string>;
}) => {
  const lines = structuredPoem.map((line) => {
    return (
      <div>
        {line.map((word) => {
          if (correctWords.has(actualWord(word).toUpperCase())) {
            return <span>{word}</span>;
          } else {
            return <span>------</span>;
          }
        })}
      </div>
    );
  });
  return <div>{lines}</div>;
};

export default App;
