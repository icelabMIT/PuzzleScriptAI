/*
* Analyzer
* Author: Chong-U Lim
*
* This contains methods to load and consolidate
* results from simulation or evolution.

*/

// namespace;
this.psai = this.psai||{};

(function() {
	"use strict";
var p;

// Class: Node
// ------------------------------
var Analyzer = function() {
	this.initialize();
};
p = Analyzer.prototype;

	// fields
	Analyzer.GAMES = [
		"microban",
		"block faker",
		"atlas shrank",
		"lime rick"
	];

	Analyzer.evolutionName = "";

	// constructor
	p.initialize = function() {
		console.log("Analyzer.initialize()");
	};

	// static methods
	Analyzer.isGameKey = function (str) {
		if (typeof(str) != "string") {
			return false;
		}
		
		// var regex = new RegExp("^"+state.metadata.title+"-\\d+[-\\D]*");
		for (var i=0; i < Analyzer.GAMES.length; i++){
			var game = Analyzer.GAMES[i];
			var regex = new RegExp("^"+game+"-\\d+$");
			var match = str.match(regex);
			if (match !== null) {
				return true;
			}
		}

		return false;
		
	};

	Analyzer.isEvolutionKey = function(str) {
		if (typeof(str) != "string") {
			return false;
		}


		var regex = new RegExp("^"+Analyzer.evolutionName+"\/\\d+");
		var match = str.match(regex);
		
		// console.log("isEvolutionKey, str=%s, regex=%s, match =%s", str, regex, match);

		return match !== null;
	};
	


	Analyzer.getSolutionInputHistory = function(sol) {
		return sol[0];
	};

	Analyzer.getSolutionInputLength = function(sol) {
		return sol[0].length;
	};

	Analyzer.getSolutionIterations = function(sol) {
		return sol[1];
	};



	// methods
	p.getSolutions = function() {
		var k = Object.keys(localStorage);
		var gameKeys = k.filter(Analyzer.isGameKey);

		var table = {};
		var gameKey = null;

		var solutions = null;
		var inputHistories = null;
		var inputLengths = null;
		var iterations = null;

		for (var i=0; i < gameKeys.length; i++) {
			gameKey = gameKeys[i];
			table[gameKey] = {};

			solutions = JSON.parse(localStorage.getItem(gameKey));
			if (solutions.length > 1 && typeof(solutions[1])!=="object") {
				// v1  (solutions[1] would have been a number)
				solutions = [solutions];
			}

			inputHistories = solutions.map(Analyzer.getSolutionInputHistory);
			inputLengths = solutions.map(Analyzer.getSolutionInputLength);
			iterations = solutions.map(Analyzer.getSolutionIterations);

			var bestfs = {
				inputHistory : solutions,
				inputLength : inputLengths.avg().toFixed(1),
				iterations : iterations.avg().toFixed(1)
			};
			table[gameKey]['bestfs'] = bestfs;

			var bfs = {
				inputHistory : [],
				inputLength : "NA",
				iterations : "NA"
			};

			var tempKey = gameKey+"-bfs";
			if (localStorage.getItem(tempKey) !== null) {
				
				solutions = JSON.parse(localStorage.getItem(tempKey));
				if (solutions.length > 1 && typeof(solutions[1])!=="object") {
					// v1 
					solutions = [solutions];
				}
				inputHistories = solutions.map(Analyzer.getSolutionInputHistory);
				inputLengths =  solutions.map(Analyzer.getSolutionInputLength);
				iterations = solutions.map(Analyzer.getSolutionIterations);

				bfs['inputHistory'] = solutions;
				bfs['inputLength'] = inputLengths.avg().toFixed(1);
				bfs['iterations'] = iterations.avg().toFixed(1);
			}
			table[gameKey]['bfs'] = bfs;
			
		}

		return table;
	};

	p.getSolution = function (algorithm) {
		var suffix = "";

		if (!algorithm || typeof(algorithm) =="none") {
			suffix = "";
			algorithm = "bestfs";
		}
		else {
			suffix = "-" + algorithm;
		}


		var k = Object.keys(localStorage);
		var gameKeys = k.filter(Analyzer.isGameKey);

		var table = {};
		var gameKey = null;

		var solutions = null;
		var inputHistories = null;
		var inputLengths = null;
		var iterations = null;

		for (var i=0; i < gameKeys.length; i++) {
			gameKey = gameKeys[i] + suffix;
			if (!localStorage.getItem(gameKey)) {
				continue;
			}
			table[gameKey] = {};


			solutions = JSON.parse(localStorage.getItem(gameKey));
			if (solutions.length > 1 && typeof(solutions[1])!=="object") {
				// v1  (solutions[1] would have been a number)
				solutions = [solutions];
			}

			inputHistories = solutions.map(Analyzer.getSolutionInputHistory);
			inputLengths = solutions.map(Analyzer.getSolutionInputLength);
			iterations = solutions.map(Analyzer.getSolutionIterations);

			var bestfs = {
				inputHistory : inputHistories,
				inputLength : inputLengths,
				iterations : iterations
			};

			table[gameKey][algorithm] = bestfs;
			
		}

		return table;
	};

	p.csv = function (table, attribute) {
		var str = "";
		var keys = Object.keys(table);	// gamelevels

		var seen = {};

		var i;

		for ( i=0; i < Analyzer.GAMES.length; i++) {
			var gameName = Analyzer.GAMES[i];
			seen[gameName] = 0;
		}

		var entry = null;
		var key = null;
		for ( i=0; i<keys.length; i++) {
			key = keys[i];
			entry = table[key];	// row for gamelevel

			var game = key.split("-")[0];
			var level = ++seen[game];

			// str += "\"" + key + "\"";	// col[0]

			str += "\"" + game + "\"" + ",";
			str += "\"" + level + "\"";

			var colNames = Object.keys(entry);

			for (var j=0; j<colNames.length; j++) {
				var colName = colNames[j];
				var col = entry[colName];
				str += "," + col[attribute];
			}

			str += "," + "\"" + key + "\"";	// localstoragename

			str += "\n";

		}

		return str;

	};

	p.csvMean = function(attribute) {
		var table = this.getSolutions();
		return this.csv(table, attribute);
	};

	p.getGameKeys = function() {
		return Object.keys(localStorage).filter(Analyzer.isGameKey);
	};

	p.getEvolution = function (evolutionName) {
		if (!evolutionName || typeof(evolutionName) == "undefined") {
			evolutionName = "evolver";
		}

		Analyzer.evolutionName = evolutionName;

		var keys = Object.keys(localStorage);
		var evoKeys = keys.filter(Analyzer.isEvolutionKey);
		evoKeys.sort(function(key1, key2) {
			var v1 = parseInt(key1.split("/")[1], 10);
			var v2 = parseInt(key2.split("/")[1], 10);

			if (v1 > v2) {
				return 1;
			}
			else if (v1 < v2) {
				return -1;
			}
			else {
				return 0;
			}
		});

		var i=0;

		var table = {};
		var evoKey = null;
		var baseName = null;
		var evo = null;
		var generation = null;
		var fitnessScores = null;
		var normalizedScores = null;
		var overallFitnessScores = null;
		var valids = null;
		var noErrors = null;
		var uniqueNodes = null;
		var csv = "";

		for (i=0; i<evoKeys.length; i++){

			var obj = {
				meanFitnessScores : -1,
				meanNormalizedScores : -1,
				valids : -1,
				errors : -1
			};

			evoKey = evoKeys[i];
			generation = evoKey.split("/")[1];
			baseName = evoKey.split("/")[0];

			evo = new psai.Evolver();
			evo.load(generation, baseName);
			evo.normalize();

			fitnessScores = evo.getFitnessScores();
			normalizedScores = evo.getNormalizedScores();
			overallFitnessScores = evo.getOverallFitnessScores();
			valids = evo.getValids();
			noErrors = evo.getNoErrors();
			uniqueNodes = evo.getUniqueNodes();

			obj["generation"] = i;
			obj["meanFitnessScores"] = fitnessScores.avg();
			obj["meanNormalizedScores"] = normalizedScores.avg();
			obj["meanOverallFitnessScores"] = overallFitnessScores.avg();
			obj["valids"] = valids.sum();
			obj["errors"] = noErrors.length - noErrors.sum();
			obj["uniqueNodes"] = uniqueNodes;
			obj["key"] = evoKey;

			table[evoKey] = obj;

			// csv
			csv += obj["generation"] + ",";
			csv += obj["meanFitnessScores"] + ",";
			csv += obj["meanOverallFitnessScores"] + ",";
			csv += obj["valids"] + ",";
			csv += obj["errors"] + ",";
			csv += obj["meanNormalizedScores"] + ",";
			csv += obj["uniqueNodes"] + ",";
			csv += "\"" + evoKey + "\"";
			csv += "\n";

		}



		var ret = {
			table : table,
			csv : csv
		};



		return ret;


	};




// Class declarations.
// ------------------------------
psai.Analyzer = Analyzer;

}());

analyzer = new psai.Analyzer();