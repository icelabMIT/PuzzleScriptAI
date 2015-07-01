# PuzzleScript-AI

## Introduction
This repository provides Artificial Intelligence extensions to Stephen Lavelle's Puzzlescript, an open-source HTML5 Puzzle Game Engine available at http://www.puzzlescript.net

## Getting Started

First, load up editor.html. Then start any game and load up its first level (e.g., Microban).

Then, the place to look would be to the javascript file:
- simulator.js

In simulator.js: you should find the two basic search algorithms (bfs, bestfs). It should be pretty straightforward to extend them. For example, if you wanted to solve a particular level of a given game, open up your browser’s javascript console at input:

'''
moves = bestfs(level.dat, 1200)     // use bestfs to solve the level within 1200 iterations
'''

You will then see the search algorithm printing out its status every 100 iterations. If it manages to find a solution, you will find the solution stored in the moves array.

The rest of simulator.js has utility methods to simulate moves on a given game. You should be able to poke around by seeing how bestfs and bfs make use of the methods.

There are a couple of extra utilities, such the method makeGIF(moves) which will make a GIF given a series of moves. The moves array contains objects of the same type as PuzzleScript’s inputHistory array, which is what it uses internally to perform undo/redo. So you technically can just do:

'''
inputHistory = bestfs(level.dat, 1200) 
'''

And hit ‘U’ and ‘R’ on the keyboard to undo/redo and see how the solution pans out. 

## Referencing/Citing this work

The PuzzleScript-AI extensions including the simulator and evolver were presented at the Computational Intelligence and Games 2014 Conference in Dortmund, Germany. To cite:

- Chong-U Lim and D. Fox Harrell. (2014) "An Approach to General Videogame Evaluation and Automatic Generation using a Description Language", Proceedings of the IEEE Conference on Computational Intelligence and Games (CIG), Dortmund, Germany, 2014. 8 pp.


## License

PuzzleScript-AI is dual-licensed. 

 - All the code-related to PuzzleScript is under the [MIT License](http://opensource.org/licenses/MIT) (MIT) and Copyright (c) Stephen Lavelle
 - The AI-extensions (js/simulator.js and js/evolver.js) are under the [Creative Commons  Attribution-NonCommercial-ShareAlike 3.0 Unported](http://creativecommons.org/licenses/by-nc-sa/3.0/)


