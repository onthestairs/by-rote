import React, { useState, useMemo } from "react";

const ByRote = () => {
  return (
    <div className="mainBody">
      <h1>By rote</h1>
      <App></App>
    </div>
  );
};

const App = () => {
  const [poem, setPoem] = useState<string | null>(null);
  if (poem === null) {
    return <PoemForm onSubmit={(poem: string) => setPoem(poem)} />;
  } else {
    return <PlayPoem poem={poem} />;
  }
};

const splitLines = (s: string): string[] => {
  return s.split("\n");
};

const splitWords = (s: string): string[] => {
  return s.split(/[ —]/);
};

const makeStructuredPoem = (poem: string): string[][] => {
  return splitLines(poem).map((line) => splitWords(line));
};

const extractWords = (poem: string): Set<String> => {
  let words = splitLines(poem)
    .map((line) =>
      splitWords(line).map((word) => extractActualWord(word).toUpperCase())
    )
    .flat();
  return new Set(words);
};

const PoemForm = ({ onSubmit }: { onSubmit: (poem: string) => void }) => {
  const [poemText, setPoemText] = useState<string>("");
  return (
    <div>
      <p>Enter the text of the poem to learn</p>
      <textarea
        className="poemInput"
        value={poemText}
        onChange={(e) => setPoemText(e.target.value)}
      ></textarea>{" "}
      <br />
      <input
        type="submit"
        onClick={(_e) => onSubmit(poemText.trim())}
        value={"Go!"}
      />
    </div>
  );
};

const extractActualWord = (word: string) => {
  return word.replace(/([^a-zA-Z'-]|(-$))/g, "");
};

const PlayPoem = ({ poem }: { poem: string }) => {
  const structuredPoem = useMemo(() => makeStructuredPoem(poem), [poem]);
  const wordsInPoem = useMemo(() => extractWords(poem), [poem]);
  const [correctWords, setCorrectWords] = useState<Set<string>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const [guess, setGuess] = useState("");

  const addCorrectWord = (word: string) => {
    const newCorrectWords = new Set(correctWords);
    newCorrectWords.add(word.toUpperCase());
    setCorrectWords(newCorrectWords);
  };

  const addRevealedWord = (word: string) => {
    const newRevealedWords = new Set(revealedWords);
    newRevealedWords.add(word.toUpperCase());
    setRevealedWords(newRevealedWords);
  };

  const changeGuess = (guess: string) => {
    const upperGuess = guess.toUpperCase();
    if (wordsInPoem.has(upperGuess) && !correctWords.has(upperGuess)) {
      addCorrectWord(upperGuess);
      setGuess("");
    } else {
      setGuess(guess);
    }
  };

  const revealWord = (word: string) => {
    addRevealedWord(word);
  };

  console.log(revealedWords);

  return (
    <div>
      <div className="guesses">
        <input
          className="wordGuess"
          value={guess}
          onChange={(e) => changeGuess(e.target.value)}
        />
        <p>{revealedWords.size} cheats</p>
      </div>
      <MaskedPoem
        structuredPoem={structuredPoem}
        visibleWords={correctWords}
        revealedWords={revealedWords}
        revealWord={revealWord}
      ></MaskedPoem>
    </div>
  );
};

const intersperse = <A,>(xs: A[], a: A): A[] => {
  return xs.flatMap((e) => [a, e]).slice(1);
};

const MaskedPoem = ({
  structuredPoem,
  visibleWords,
  revealedWords,
  revealWord,
}: {
  structuredPoem: string[][];
  visibleWords: Set<string>;
  revealedWords: Set<string>;
  revealWord: (word: string) => void;
}) => {
  const lines = structuredPoem.map((line, i) => {
    const words = line.map((word, j) => {
      const actualWord = extractActualWord(word).toUpperCase();
      const isVisible = visibleWords.has(actualWord);
      const isRevealed = revealedWords.has(actualWord);
      if (isVisible || isRevealed) {
        return <ShownWord key={j} word={word} revealed={isRevealed} />;
      } else {
        return (
          <MaskedWord
            key={j}
            onReveal={(word: string) => revealWord(word)}
            word={word}
          />
        );
      }
    });

    return <div key={i}>{intersperse(words, <span> </span>)}</div>;
  });
  return <div className="maskedPoem"> {lines}</div>;
};

const ShownWord = ({ word, revealed }: { word: string; revealed: boolean }) => {
  return (
    <span className={`shownWord ${revealed ? "revealed" : ""}`}>{word}</span>
  );
};

const MaskedWord = ({
  word,
  onReveal,
}: {
  word: string;
  onReveal: (word: string) => void;
}) => {
  return (
    <span onClick={(_e) => onReveal(word)} className="maskedWord">
      ------
    </span>
  );
};

export default ByRote;
