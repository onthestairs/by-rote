import React, { useState, useMemo } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Link } from "react-router-dom";
import {
  getPoemById,
  addPoemToStore,
  Poem,
  getPoemsFromStore,
  removePoemFromStore,
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
      <Link to="/">
        <h1>By rote</h1>
      </Link>

      <Routes>
        <Route path="/" element={<List />} />
        <Route
          path="/add"
          element={
            <PoemForm
              onSubmit={(poem: Poem) => {
                const poemId = addPoemToStore(poem);
                navigate(`/learn/${poemId}`);
              }}
            />
          }
        />
        <Route path="/learn/:poemId" element={<PlayPoemWrapper />} />
      </Routes>
    </div>
  );
};

const List = () => {
  const poems = getPoemsFromStore();
  const poemLinks = Object.keys(poems).map((poemId) => {
    const poem = poems[poemId];
    return (
      <li>
        <Link to={`/learn/${poemId}`}>
          {poem.title} - {poem.author}
        </Link>{" "}
        <a
          href="/"
          onClick={(_e) =>
            window.confirm("Are you sure?") ? removePoemFromStore(poemId) : null
          }
        >
          (Delete)
        </a>
      </li>
    );
  });

  return (
    <div>
      <ul>{poemLinks}</ul>
      <Link to="/add">Add</Link>
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

const extractWords = (poem: string): Set<String> => {
  let words = splitLines(poem)
    .map((line) =>
      splitWords(line).map((word) => extractActualWord(word).toUpperCase())
    )
    .flat();
  return new Set(words);
};

const PoemForm = ({ onSubmit }: { onSubmit: (poem: Poem) => void }) => {
  const [poemText, setPoemText] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [author, setAuthor] = useState<string>("");
  return (
    <div>
      <p>Enter the text of the poem to learn</p>
      <input
        value={title}
        placeholder={"Title"}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        value={author}
        placeholder={"Author"}
        onChange={(e) => setAuthor(e.target.value)}
      />
      <textarea
        className="poemInput"
        value={poemText}
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
  return word.replace(/([^a-zA-Z'-]|(-$))/g, "");
};

const PlayPoemWrapper = () => {
  let params = useParams();
  const poemId = params.poemId;
  if (poemId === null || poemId === undefined) {
    return <p>No poem</p>;
  }
  const poem = getPoemById(poemId);
  return <PlayPoem poem={poem} />;
};

const PlayPoem = ({ poem }: { poem: Poem }) => {
  const structuredPoem = useMemo(
    () => makeStructuredPoem(poem.text),
    [poem.text]
  );
  const wordsInPoem = useMemo(() => extractWords(poem.text), [poem.text]);
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
    if (
      wordsInPoem.has(upperGuess) &&
      !correctWords.has(upperGuess) &&
      !revealedWords.has(upperGuess)
    ) {
      addCorrectWord(upperGuess);
      setGuess("");
    } else {
      setGuess(guess);
    }
  };

  const revealWord = (word: string) => {
    addRevealedWord(word);
  };

  const reset = () => {
    setCorrectWords(new Set());
    setRevealedWords(new Set());
  };

  return (
    <div>
      <div className="guesses">
        <input
          className="wordGuess"
          value={guess}
          onChange={(e) => changeGuess(e.target.value)}
        />
        <p>
          {revealedWords.size} cheats |{" "}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              reset();
            }}
          >
            Reset
          </a>
        </p>
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
    <span
      onClick={(e) => {
        e.preventDefault();
        onReveal(extractActualWord(word));
      }}
      className="maskedWord"
    >
      ------
    </span>
  );
};

export default ByRoteWithRouter;
