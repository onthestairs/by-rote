import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  MutableRefObject,
  useCallback,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Link } from "react-router-dom";
import { useDebounce } from "use-debounce";
import {
  getPoemById,
  addPoemToStore,
  Poem,
  getPoemsFromStore,
  removePoemFromStore,
  registerScore,
  getPoemScores,
  registerHardScore,
  getPoemHardScores,
} from "./store";

const ByRoteWithRouter = () => {
  return (
    <BrowserRouter>
      <ByRote />
    </BrowserRouter>
  );
};

const ByRote = () => {
  let navigate = useNavigate();
  return (
    <div className="mainBody">
      <header className="header">
        <Link to="/">
          <h1>By rote</h1>
        </Link>
      </header>

      <Routes>
        <Route path="/" element={<List />} />
        <Route
          path="/add"
          element={
            <PoemForm
              onSubmit={(poem: Poem) => {
                const poemId = addPoemToStore(poem);
                navigate(`/learn/${poemId}/easy`);
              }}
            />
          }
        />
        <Route path="/learn/:poemId/easy" element={<PlayPoemWrapper />} />
        <Route path="/learn/:poemId/hard" element={<PlayPoemHardWrapper />} />
      </Routes>
      <footer></footer>
    </div>
  );
};

const List = () => {
  const poems = getPoemsFromStore();
  const poemLinks = Object.keys(poems).map((poemId) => {
    const poem = poems[poemId];
    return (
      <li>
        {poem.title}, {poem.author}
        <br />
        <Link to={`/learn/${poemId}/easy`}>Easy</Link>
        {" ~ "}
        <Link to={`/learn/${poemId}/hard`}>Hard</Link>
        {" ~ "}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            return window.confirm("Are you sure?")
              ? removePoemFromStore(poemId)
              : null;
          }}
        >
          Delete
        </a>
      </li>
    );
  });

  return (
    <div className="poemList">
      <ul>
        {poemLinks}
        <li>
          <Link to="/add">Add</Link>
        </li>
      </ul>
    </div>
  );
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

const extractWords = (poem: string): Set<string> => {
  let words = splitLines(poem)
    .map((line) =>
      splitWords(line.trim()).map((word) =>
        extractActualWord(word).toUpperCase(),
      ),
    )
    .flat();
  return new Set(words);
};

const PoemForm = ({ onSubmit }: { onSubmit: (poem: Poem) => void }) => {
  const [poemText, setPoemText] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  return (
    <div className="addPoem">
      <p>Enter the text of the poem to learn</p>
      <input
        value={title}
        placeholder={"Title"}
        onChange={(e) => setTitle(e.target.value)}
      />
      <br />
      <input
        value={author}
        placeholder={"Author"}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <br />
      <textarea
        className="poemInput"
        value={poemText}
        placeholder="Poem text"
        onChange={(e) => setPoemText(e.target.value)}
      ></textarea>{" "}
      <br />
      <input
        type="submit"
        onClick={(_e) =>
          onSubmit({
            title: title.trim(),
            author: author.trim(),
            text: poemText.trim(),
          })
        }
        value={"Add"}
      />
    </div>
  );
};

const extractActualWord = (word: string) => {
  return word.replace(/([^a-zA-ZÀ-ÿ'-]|(-$))/g, "");
};

const PlayPoemWrapper = () => {
  let params = useParams();
  const poemId = params.poemId;
  if (poemId === null || poemId === undefined) {
    return <p>No poem</p>;
  }
  const poem = getPoemById(poemId);
  return <PlayPoem poem={poem} poemId={poemId} />;
};

const PlayPoem = ({ poemId, poem }: { poemId: string; poem: Poem }) => {
  const structuredPoem = useMemo(
    () => makeStructuredPoem(poem.text),
    [poem.text],
  );
  const wordsInPoem = useMemo(() => extractWords(poem.text), [poem.text]);
  const [correctWords, setCorrectWords] = useState<Set<string>>(new Set());
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());
  const isCompleted: boolean = useMemo(() => {
    return Array.from(wordsInPoem).every((value, _index, _array): boolean => {
      return correctWords.has(value) || revealedWords.has(value);
    });
  }, [correctWords, wordsInPoem, revealedWords]);
  useEffect(() => {
    if (isCompleted) {
      const score = revealedWords.size;
      registerScore(poemId, score);
    }
  }, [poemId, revealedWords, isCompleted]);
  const [guess, setGuess] = useState("");

  const addCorrectWord = useCallback(
    (word: string) => {
      const newCorrectWords = new Set(correctWords);
      newCorrectWords.add(word.toUpperCase());
      setCorrectWords(newCorrectWords);
    },
    [correctWords, setCorrectWords],
  );

  const addRevealedWord = (word: string) => {
    const newRevealedWords = new Set(revealedWords);
    newRevealedWords.add(word.toUpperCase());
    setRevealedWords(newRevealedWords);
  };

  // Only check the guess after 350ms without any typing.
  // This prevents the user typing "and", the correct guess for "a" being triggered immediatly,
  // and the user being left with "nd" in the guess box.
  const [debouncedGuess] = useDebounce(guess, 350);
  const changeGuess = (guess: string) => {
    setGuess(guess);
    // If the user has pressed space, that means they have finished the word: skip debouncing
    // and check the guess straight away
    if (guess.slice(-1) === " ") {
      checkGuess(guess.trim());
    }
  };

  const checkGuess = useCallback(
    (guessToCheck: string) => {
      const upperGuess = guessToCheck.toUpperCase();
      if (
        wordsInPoem.has(upperGuess) &&
        !correctWords.has(upperGuess) &&
        !revealedWords.has(upperGuess)
      ) {
        addCorrectWord(upperGuess);
        setGuess("");
      }
    },
    [wordsInPoem, correctWords, revealedWords, addCorrectWord],
  );

  useEffect(() => {
    checkGuess(debouncedGuess);
  }, [debouncedGuess, checkGuess]);

  const revealWord = (word: string) => {
    addRevealedWord(word);
  };

  const reset = () => {
    setCorrectWords(new Set());
    setRevealedWords(new Set());
  };

  const scores = getPoemScores(poemId);
  let scoreStr;
  if (scores.length === 0) {
    scoreStr = "No completions";
  } else {
    let perfectScores = scores.filter((score: number) => score === 0).length;
    if (perfectScores > 0) {
      scoreStr = `${perfectScores} perfect scores`;
    } else {
      const bestScore = Math.min(...scores);
      scoreStr = `Best score: ${bestScore}`;
    }
  }
  return (
    <>
      <div className="guesses">
        <input
          tabIndex={-1}
          autoFocus
          className="wordGuess"
          value={guess}
          onChange={(e) => changeGuess(e.target.value)}
        />
        <p>
          {revealedWords.size} cheats{" | "}
          {scoreStr}
          {" | "}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            Start again
          </a>
          {" | "}
          <Link to={`/learn/${poemId}/hard`}>Hard mode</Link>
        </p>
      </div>
      <div className="poem">
        <MaskedPoem
          isCompleted={isCompleted}
          poem={poem}
          structuredPoem={structuredPoem}
          visibleWords={correctWords}
          revealedWords={revealedWords}
          revealWord={revealWord}
        ></MaskedPoem>
      </div>
    </>
  );
};

const PlayPoemHardWrapper = () => {
  let params = useParams();
  const poemId = params.poemId;
  if (poemId === null || poemId === undefined) {
    return <p>No poem</p>;
  }
  const poem = getPoemById(poemId);
  return <PlayPoemHard poem={poem} poemId={poemId} />;
};

const isWhiteSpace = (s: string): boolean => {
  return /\s/g.test(s) || s === "";
};

const splitStructuredPoem = (
  structuredPoem: string[][],
  stopIndex: number,
): [string[][], string | null] => {
  let index = 0;
  let truncatedStructuredPoem: string[][] = [];
  for (let i = 0; i < structuredPoem.length; i++) {
    const line = structuredPoem[i];
    let lineWords: string[] = [];
    for (let j = 0; j < line.length; j++) {
      const word = line[j];
      const isWordWhiteSpace = isWhiteSpace(word);
      if (index === stopIndex && !isWordWhiteSpace) {
        truncatedStructuredPoem = [...truncatedStructuredPoem, lineWords];
        return [truncatedStructuredPoem, extractActualWord(word)];
      }
      lineWords = [...lineWords, word];
      if (!isWordWhiteSpace) {
        index += 1;
      }
    }
    truncatedStructuredPoem = [...truncatedStructuredPoem, lineWords];
  }
  return [truncatedStructuredPoem, null];
};

const PlayPoemHard = ({ poemId, poem }: { poemId: string; poem: Poem }) => {
  const structuredPoem = useMemo(
    () => makeStructuredPoem(poem.text),
    [poem.text],
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [truncatedStructuredPoem, expectedWord] = useMemo(() => {
    return splitStructuredPoem(structuredPoem, currentIndex);
  }, [structuredPoem, currentIndex]);
  const [cheatIndexes, setCheatIndexes] = useState<number[]>([]);
  const isCompleted = expectedWord === null;
  useEffect(() => {
    if (isCompleted) {
      registerHardScore(poemId, cheatIndexes.length);
    }
  }, [poemId, cheatIndexes, isCompleted]);
  const lastLineRef = useRef<null | HTMLDivElement>(null);
  useEffect(() => {
    if (lastLineRef !== null && lastLineRef.current !== null) {
      lastLineRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentIndex]);
  const [guess, setGuess] = useState("");

  const revealNextWord = () => {
    setCheatIndexes([...cheatIndexes, currentIndex]);
    setCurrentIndex(currentIndex + 1);
  };

  const changeGuess = (guess: string) => {
    const upperGuess = guess.toUpperCase();
    if (upperGuess === expectedWord?.toUpperCase()) {
      setCurrentIndex(currentIndex + 1);
      setGuess("");
    } else {
      setGuess(guess);
    }
  };

  const reset = () => {
    setCheatIndexes([]);
    setCurrentIndex(0);
  };

  const scores = getPoemHardScores(poemId);
  let scoreStr;
  if (scores.length === 0) {
    scoreStr = "No completions";
  } else {
    let perfectScores = scores.filter((score: number) => score === 0).length;
    if (perfectScores > 0) {
      scoreStr = `${perfectScores} perfect scores`;
    } else {
      const bestScore = Math.min(...scores);
      scoreStr = `Best score: ${bestScore}`;
    }
  }
  return (
    <div className="learnPoem">
      <div className="guesses">
        <input
          className="wordGuess"
          value={guess}
          onChange={(e) => changeGuess(e.target.value)}
        />
        <p>
          {cheatIndexes.length} cheats{" | "}
          {scoreStr}
          {" | "}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            Start again
          </a>
          {" | "}
          <Link to={`/learn/${poemId}/easy`}>Easy mode</Link>
        </p>
      </div>
      <div className="poem">
        <TruncatedPoem
          poem={poem}
          isCompleted={isCompleted}
          cheatIndexes={cheatIndexes}
          truncatedStructuredPoem={truncatedStructuredPoem}
          revealNextWord={revealNextWord}
          lastLineRef={lastLineRef}
        ></TruncatedPoem>
      </div>
    </div>
  );
};

const TruncatedPoem = ({
  poem,
  truncatedStructuredPoem,
  cheatIndexes,
  isCompleted,
  revealNextWord,
  lastLineRef,
}: {
  poem: Poem;
  truncatedStructuredPoem: string[][];
  cheatIndexes: number[];
  isCompleted: boolean;
  revealNextWord: () => void;
  lastLineRef: MutableRefObject<null | HTMLDivElement>;
}) => {
  const numberOfLines = truncatedStructuredPoem.length;
  let index = 0;
  const lines = truncatedStructuredPoem.map((line, i) => {
    if (line.length === 1 && line[0] === "") {
      return <br key={i} />;
    }
    let words = line.map((word, j) => {
      const wordEl = (
        <ShownWord
          key={j}
          word={word}
          revealed={cheatIndexes.includes(index)}
        />
      );
      if (!isWhiteSpace(word)) {
        index += 1;
      }
      return wordEl;
    });
    if (i === numberOfLines - 1 && !isCompleted) {
      const maskedWord = <MaskedWord word={""} onReveal={revealNextWord} />;
      words = [...words, maskedWord];
    }
    const ref = i === numberOfLines - 1 ? lastLineRef : null;

    return (
      <div key={i} ref={ref}>
        {intersperse(words, <span> </span>)}
      </div>
    );
  });
  return (
    <div className={`maskedPoem ${isCompleted ? "completed" : ""}`}>
      <PoemTitle poem={poem} />
      {lines}
    </div>
  );
};

const intersperse = <A,>(xs: A[], a: A): A[] => {
  return xs.flatMap((e) => [a, e]).slice(1);
};

const MaskedPoem = ({
  poem,
  structuredPoem,
  isCompleted,
  visibleWords,
  revealedWords,
  revealWord,
}: {
  poem: Poem;

  structuredPoem: string[][];
  isCompleted: boolean;
  visibleWords: Set<string>;
  revealedWords: Set<string>;
  revealWord: (word: string) => void;
}) => {
  const lines = structuredPoem.map((line, i) => {
    if (line.length === 1 && line[0] === "") {
      return <br key={i} />;
    }
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
  return (
    <div className={`maskedPoem ${isCompleted ? "completed" : ""}`}>
      <PoemTitle poem={poem} />
      {lines}
    </div>
  );
};

const PoemTitle = ({ poem }: { poem: Poem }) => {
  return (
    <div className="poemTitle">
      <h2>
        {poem.title} <span> by </span> {poem.author}
      </h2>
    </div>
  );
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
    <span
      onClick={(e) => {
        e.preventDefault();
        onReveal(extractActualWord(word));
      }}
      className="maskedWord"
    >
      -----
    </span>
  );
};

export default ByRoteWithRouter;
