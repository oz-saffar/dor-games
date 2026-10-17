import { createContext } from 'react';

/** Id of the game currently on screen (null on the home hub or in tests). */
export const ActiveGameContext = createContext(null);
