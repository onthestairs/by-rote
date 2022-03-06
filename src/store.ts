import { nanoid } from "nanoid";

export type Poem = { title: string; author: string; text: string };
interface PoemMap {
  [key: string]: Poem;
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
