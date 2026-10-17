/**
 * Game component registry for dynamic routing (lazy-loaded)
 */
import { lazy } from 'react';

export const GAME_COMPONENTS = {
  bubbles: lazy(() => import('../games/BubblePopGame')),
  colors: lazy(() => import('../games/ColorMatchGame')),
  memory: lazy(() => import('../games/MemoryMatchGame')),
  animals: lazy(() => import('../games/AnimalSoundsGame')),
  numbers: lazy(() => import('../games/NumberTapGame')),
  'count-with-me': lazy(() => import('../games/CountWithMeGame')),
  shapes: lazy(() => import('../games/ShapeMatchGame')),
  'what-doesnt-belong': lazy(() => import('../games/WhatDoesntBelongGame')),
  'shadow-match': lazy(() => import('../games/ShadowMatchGame')),
  'rhythm-tap': lazy(() => import('../games/RhythmTapGame')),
  'maze-rescue': lazy(() => import('../games/MazeRescueGame')),
  'runner-dash': lazy(() => import('../games/RunnerDashGame')),
  'water-sort': lazy(() => import('../games/WaterSortGame')),
  'color-pop-hunt': lazy(() => import('../games/ColorPopHuntGame')),
  'hide-seek': lazy(() => import('../games/HideSeekGame')),
  'monster-drag-chomp': lazy(() => import('../games/monsterDragChomp/MonsterDragChompGame')),
  'number-trace': lazy(() => import('../games/NumberTraceGame')),
  'dino-sneak': lazy(() => import('../games/dinoSneak/DinoSneakGame')),
  'dino-stomp': lazy(() => import('../games/dinoStomp/DinoStompGame')),
  'photo-puzzle': lazy(() => import('../games/photoPuzzle/PhotoPuzzleGame')),
  'web-sling': lazy(() => import('../games/webSling/WebSlingGame')),
  'snake-garden': lazy(() => import('../games/snakeGarden/SnakeGardenGame')),
  'room-tidy': lazy(() => import('../games/roomTidy/RoomTidyGame')),
  'xylophone': lazy(() => import('../games/xylophone/XylophoneGame')),
  'color-book': lazy(() => import('../games/colorBook/ColorBookGame')),
  'tic-tac-toe': lazy(() => import('../games/ticTacToe/TicTacToeGame')),
  'kitchen-sort': lazy(() => import('../games/kitchenSort/KitchenSortGame')),
  'four-in-row': lazy(() => import('../games/fourInRow/FourInRowGame')),
  'animal-merge': lazy(() => import('../games/animalMerge/AnimalMergeGame')),
  'spot-difference': lazy(() => import('../games/spotDifference/SpotDifferenceGame')),
  'pop-it': lazy(() => import('../games/popIt/PopItGame')),
  'arrow-escape': lazy(() => import('../games/arrowEscape/ArrowEscapeGame')),
};
