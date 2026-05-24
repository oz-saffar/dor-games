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
  'puzzle-drag': lazy(() => import('../games/PuzzleDragGame')),
  'runner-dash': lazy(() => import('../games/RunnerDashGame')),
  'water-sort': lazy(() => import('../games/WaterSortGame')),
  'color-pop-hunt': lazy(() => import('../games/ColorPopHuntGame')),
  'hide-seek': lazy(() => import('../games/HideSeekGame')),
  'monster-munch': lazy(() => import('../games/monsterMunch/MonsterMunchGame')),
  'monster-drag-chomp': lazy(() => import('../games/monsterDragChomp/MonsterDragChompGame')),
  'boy-cried-wolf': lazy(() => import('../games/BoyCriedWolfGame')),
  'football': lazy(() => import('../games/FootballGame')),
  'football-drag': lazy(() => import('../games/FootballDragGame')),
};
