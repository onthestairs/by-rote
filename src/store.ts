import { nanoid } from "nanoid";

export type Poem = { title: string; author: string; text: string };
interface PoemMap {
  [key: string]: Poem;
}
interface PoemScoreMap {
  [key: string]: number[];
}

export const addPoemToStore = (poem: Poem): string => {
  const poems = getPoemsFromStore();
  const newId = nanoid();
  const newPoems = {
    ...poems,
    [newId]: poem,
  };
  setPoemsInStore(newPoems);
  return newId;
};

const setPoemsInStore = (poems: PoemMap) => {
  const poemsString = JSON.stringify(poems);
  localStorage.setItem("poems", poemsString);
};

export const removePoemFromStore = (id: string) => {
  const poems = getPoemsFromStore();
  let newPoems = { ...poems };
  delete newPoems[id];
  setPoemsInStore(newPoems);
};

export const getPoemById = (id: string): Poem => {
  const poems = getPoemsFromStore();
  return poems[id] as Poem;
};

export const getPoemsFromStore = (): PoemMap => {
  const poemsString = localStorage.getItem("poems");
  if (poemsString === null) return {};
  return JSON.parse(poemsString);
};

const getHardScores = (): PoemScoreMap => {
  const scoresString = localStorage.getItem("hardScores");
  if (scoresString === null) return {};
  return JSON.parse(scoresString);
};

const setHardScores = (poemScores: PoemScoreMap) => {
  const poemScoresString = JSON.stringify(poemScores);
  localStorage.setItem("scores", poemScoresString);
};

export const getPoemScores = (id: string): number[] => {
  const poemScores = getScores();
  const scores = poemScores[id];
  if (scores === undefined) {
    return [];
  } else {
    return scores;
  }
};

export const registerScore = (id: string, score: number) => {
  const poemScores = getScores();
  const scores = poemScores[id];
  if (scores === undefined) {
    poemScores[id] = [score];
  } else {
    poemScores[id] = [...scores, score];
  }
  setScores(poemScores);
};

const getScores = (): PoemScoreMap => {
  const scoresString = localStorage.getItem("hardScores");
  if (scoresString === null) return {};
  return JSON.parse(scoresString);
};

const setScores = (poemScores: PoemScoreMap) => {
  const poemScoresString = JSON.stringify(poemScores);
  localStorage.setItem("scores", poemScoresString);
};

export const getPoemHardScores = (id: string): number[] => {
  const poemScores = getHardScores();
  const scores = poemScores[id];
  if (scores === undefined) {
    return [];
  } else {
    return scores;
  }
};

export const registerHardScore = (id: string, score: number) => {
  const poemScores = getHardScores();
  const scores = poemScores[id];
  if (scores === undefined) {
    poemScores[id] = [score];
  } else {
    poemScores[id] = [...scores, score];
  }
  setHardScores(poemScores);
};
