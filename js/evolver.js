/*
* Evolver
* Author: Chong-U Lim
*
* This contains a set of methods that are used to modify aspects
* and components of a PuzzleScript game.
*/

// namespace;
this.psai = this.psai||{};

(function() {
	"use strict";
var p;

// Class: Node
// ------------------------------
var Evolver = function() {
	this.initialize();
};
p = Evolver.prototype;
	
	// fields
	p.enodes = null;
	p.generation = null;
	p.enodesHistory = null;

	// static 
	Evolver.nodeMutationProbability = 0.1;
	Evolver.ruleMutationProbability = 0.1;

	// config
	// p.maxNodeRules = null;

	// constructor
	p.initialize = function() {
		
		this.enodesHistory = {};
		this.generation = 0;

		this.begin();

	};

	p.parse = function(str) {
		
		var obj = JSON.parse(str);
		var generation = obj.generation;
		var enodes = obj.enodes.map(Node.parse);

		this.enodes = enodes;
		this.generation = generation;

		for (var i=0; i<enodes.length; i++) {
			enodes[i].setEvolver(this);
			enodes[i].parseMutators();
		}

		
	};

	p.stringify = function() {
		var obj = {};

		obj.enodes = this.enodes.map(Node.stringify);
		obj.generation = this.generation;

		return JSON.stringify(obj);
	};

	p.save = function(baseName) {
		if (!baseName || typeof(baseName)=="undefined") {
			baseName = document.URL;
		}
		try {
			if (!!window.localStorage) {
				var key = baseName + "/" + this.generation;
				console.log(">>>> saving generation %s to %s", this.generation, key);
				localStorage.setItem(key, this.stringify());
			}
		} catch(ex) {
			console.warn(ex);
		}
	};

	p.load = function(generation, baseName) {
		if (typeof(generation)==="undefined") {
			generation = this.generation;
		}

		if (!baseName || typeof(baseName)=="undefined") {
			baseName = document.URL;
		}

		try {
			if (!!window.localStorage) {
				var key = baseName+"/"+generation;
				if (localStorage[document.URL]!==undefined) {
					console.log(">>>> loading generation %s from localStorage", generation);
					var str = localStorage.getItem(key);
					this.parse(str);
				}
				else {
					console.warn(">>>> unable to load %s from localStorage", key);
				}
			}
		} catch(ex) {
			console.warn(ex);
		}

	};



	p.begin = function(generation) {
		if (!generation) {
			generation = this.generation;
		}
		// console.log(">>>> Evolver.begin(), generation=%s", generation);
		this.enodes = [];
	};

	p.next = function(forced) {
		console.log(">>>> Evolver.next(), forced=%s", forced);
		if (!(this.generation in this.enodesHistory)) {
			if (!forced) {
				console.log("\tGeneration %s has not been saved to history yet. Use forced parameter!");
				return false;
			}
		}

		// save the enodes to history
		this.saveHistory();
		this.begin(++this.generation);


		return true;
	};

	p.saveHistory = function() {
		this.enodesHistory[this.generation] = this.enodes;
	};

	p.sortNodes = function(descending) {
		// console.log("evolver.sortNodes(%s)", descending ? "descending" : "ascending");
		this.enodes.sort(psai.Node.sort);
		if (descending){
			this.enodes.reverse();
		}
	};

	p.sortNodesByAccumScore = function(descending) {
		// console.log("evolver.sortNodesByAccumScore(%s)", descending ? "descending" : "ascending");
		this.enodes.sort(psai.Node.accumScoreSort);
		if (descending){
			this.enodes.reverse();
		}
	};

	p.addNode = function(enode) {
		enode.setEvolver(this);
		this.enodes.push(enode);
	};



	p.evolve = function() {
		this.normalize();
		
		var nextNodes = [];
		
		var chosenNode = null;
		var chosenNode2 = null;

		var nextNode = null;
		var nextNode2 = null;

		var seen = {};

		while (nextNodes.length < 45){
// console.log("iter=", nextNodes.length);
// console.log("\t\tfirst selection");
			chosenNode = this.select();
// console.log("\t\tfirst selection done, chosenNode=%o", chosenNode);
			nextNode = Node.createCopy(chosenNode);
// console.log("\t\tfirst creation done");
			//nextNode.accumScore = chosenNode.accumScore;
			//nextNode.normalizedScore = chosenNode.normalizedScore;

			if (Math.random() < 0.65 && nextNodes.length < 44) {
// console.log("\tcrossover");
				// crossover

				// console.log("\t\tsecond selection");
				chosenNode2 = this.select();
// console.log("\t\tsecond selection, chosenNode2=%o", chosenNode2);

				var c = 0;
				while (!this.isCrossoverPossible(chosenNode, chosenNode2) && c < 20) {
// console.log("\t\tsecond selection again, chosenNode2=%o", chosenNode2);
					chosenNode2 = this.select();
					c++;
				}

// console.log("\t\tsecond selection (c=%s) ", c);

				if (!this.isCrossoverPossible(chosenNode, chosenNode2)) {
// console.log("\t\tfailed second selection");
					continue;
				}
// console.log("\t\tsecond selection done");
// console.log("\t\tsecond creation");
				nextNode2 = Node.createCopy(chosenNode2);
// console.log("\t\tsecond creation done");
				//nextNode2.accumScore = chosenNode2.accumScore;
				//nextNode2.normalizedScore = chosenNode2.normalizedScore;

// console.log("\t\t\tbeginning crossover");
				this.crossover(nextNode, nextNode2);
// console.log("\t\t\tend crossover");

				var v1 = nextNode.validate();
				var v2 = nextNode2.validate();
				if (!(v1 && v2)) {
					console.warn("(^_^): WAIT! Result of crossover has failed! v1=%o, v2=%o", v1, v2);
				}
				if (!(nextNode.print() in seen)){
					nextNodes.push(nextNode);
					seen[nextNode.print()] = true;
				}
				if (!(nextNode2.print() in seen)) {
					nextNodes.push(nextNode2);
					seen[nextNode2.print()] = true;
				}
				
				
			}
			else {
				// survive
				console.log("\tsurvive");

				if (Math.random() < 0.1) {
// console.log("\t\tmutate");
					nextNode.mutate();
				}

				nextNode.validate();
				if (!(nextNode.print() in seen)){
					nextNodes.push(nextNode);
					seen[nextNode.print()] = true;
				}
			}
			
		}

		while(nextNodes.length < 50) {
			evolver_force();
			
			var node;
			if (Math.random() < 0.05) {
				node = new Node();
				node.setState(state);
				node.setEvolver(this);
				node.addRule(psai.Rule.createNull());
				node.mutate();
				node.validate();
			}
			else {
				evolver_default();
				var existingNode = Math.random() < 0.5 ? this.select() : nextNodes.rand();
				node = Node.createCopy(existingNode);
				if (Math.random() < 0.1) {
					node.mutate();
				}
				
				node.validate();
			}
			
			//if (!(node.print() in seen)) {
				nextNodes.push(node);
			//}

			evolver_default();
		}

		return nextNodes;

	};

	p.isCrossoverPossible = function(n1, n2) {
		//console.log("isCrossoverPossible(), n1=%o, n2=%o", n1, n2);
		// same number of rules
		if (n1.rules.length != n2.rules.length) {
			//console.log("\t(F)%s", "n1.rules.length != n2.rules.length");
			return false;
		}
		
		// same number of blocks per rule.
		for (var i=0; i < n1.rules.length; i++){
			if (n1.rules[i].lhs.blocks.length != n2.rules[i].lhs.blocks.length) {
				//console.log("\t(F)%s", "n1.rules[i].blocks.length != n2.rules[i].blocks.length");
				return false;
			}
			
			// same number of elements per block
			for (var j=0; j < n1.rules[i].lhs.blocks.length; j++) {
				if (n1.rules[i].lhs.blocks[j].elements.length != n2.rules[i].lhs.blocks[j].elements.length) {
					//console.log("\t(F)%s", "n1.rules[i].lhs.blocks[j].elements.length != n2.rules[i].lhs.blocks[j].elements.length");
					return false;
				}
			}
		}
		//console.log("\t(T) n1=%o, n2=%o", n1, n2);
		return true;
	};

	p.select = function() {
		var r = Math.random();
		var candidates = this.enodes.filter(function(n){return n.accumScore > r;});
		candidates.reverse();

		// console.log("Evolver.select, r=%s, candidates=%o", r, candidates);

		return candidates[0];
	};

	p.simulate = function() {

	};

	p.getFitnessScores = function() {
		var fitnessScores = this.enodes.map(function(node) {
			return node.fitnessScore;
		});

		return fitnessScores;
	};

	p.getOverallFitnessScores = function() {
		var overallFitnessScores = this.enodes.map(function(node) {
			return parseFloat(node.fitnessScore + node.valid + node.noError)/3;
		});

		return overallFitnessScores;
	};

	p.getValids = function() {
		var valids = this.enodes.map(function(node) {
			return node.valid;
		});

		return valids;
	};

	p.getNoErrors = function() {
		var noErrors = this.enodes.map(function(node) {
			return node.noError;
		});

		return noErrors;
	};

	p.getNormalizedScores = function() {
		this.normalize();
		var normalizedScores = this.enodes.map(function(node) {
			return node.normalizedScore;
		});

		return normalizedScores;
	};

	p.getUniqueNodes = function() {
		var seen = {};
		var uniqueNodes = 0;
		var node = null;
		for (var i=0; i<this.enodes.length; i++) {
			node = this.enodes[i];
			if (!(node.print() in seen)) {
				uniqueNodes++;
				seen[node.print()] = true;
			}
		}

		return uniqueNodes;
	};

	p.normalize = function() {
		// console.log("Node.normalize()");

		this.sortNodes();

		var fitnessScores = this.enodes.map(function(node){ return (node.fitnessScore + node.valid + node.noError);});
		var sum = fitnessScores.sum();
		this.enodes.map(function(node){node.normalizedScore = (node.fitnessScore+node.valid+node.noError)/sum;});
		var accumScore = 0;
		for (var i=0; i<this.enodes.length; i++) {
			accumScore += this.enodes[i].normalizedScore;
			this.enodes[i].accumScore = accumScore;
		}
		this.sortNodesByAccumScore(true);
		
	};

	p.calculateFitness = function() {
		for (var i=0; i<this.enodes.length; i++){
			this.enodes[i].calculateFitness();
		}
	};

	p.stats = function(showRules) {
		console.log("Evolver.stats(), showRules=%s", showRules);
		for (var i=0; i<this.enodes.length; i++) {
			console.log("\tnode #%s, score=%s, valid=%s, noError=%s", i, this.enodes[i].fitnessScore, this.enodes[i].valid, this.enodes[i].noError);

			if (this.enodes[i].normalizedScore) {
				console.log("\tnode #%s, normalizedScore=%s", i, this.enodes[i].normalizedScore);
			}
			if (this.enodes[i].accumScore) {
				console.log("\tnode #%s, accumScore=%s", i, this.enodes[i].accumScore);
			}
			
			
			if (showRules) {
				for (var j=0; j < this.enodes[i].rules.length; j++) {
					console.log("\t\t%s", this.enodes[i].rules[j].print());
				}
			}
		}
	};
	
	p.crossover = function(node1, node2) {
		var minRules = Math.min(node1.rules.length, node2.rules.length);

		var lhs1 = null;
		var rhs1 = null;
		var lhs2 = null;
		var rhs2 = null;
		for (var i=0; i < minRules; i++) {
			lhs1 = node1.rules[i].lhs.print();
			rhs1 = node1.rules[i].rhs.print();
			lhs2 = node2.rules[i].lhs.print();
			rhs2 = node2.rules[i].rhs.print();

			// crossover the lhs/rhs of rules.
			node1.rules[i].lhs = new RuleHS(lhs2);
			node2.rules[i].lhs = new RuleHS(lhs1);

			var blockIndex = parseInt(node1.rules[i].lhs.blocks.length*Math.random(),10);
			var lhsBlock1 = node1.rules[i].lhs.blocks[blockIndex].print();
			var rhsBlock1 = node1.rules[i].rhs.blocks[blockIndex].print();
			var lhsBlock2 = node2.rules[i].lhs.blocks[blockIndex].print();
			var rhsBlock2 = node2.rules[i].rhs.blocks[blockIndex].print();

			// crossover blocks
			// node1.rules[i].lhs.blocks[blockIndex] = new RuleHSBlock(lhsBlock2);
			// node2.rules[i].lhs.blocks[blockIndex] = new RuleHSBlock(lhsBlock1);

			blockIndex = parseInt(node1.rules[i].lhs.blocks.length*Math.random(),10);
			var elementIndex = parseInt(node1.rules[i].lhs.blocks[blockIndex].elements.length*Math.random(),10);
			var lhsElement1 = node1.rules[i].lhs.blocks[blockIndex].elements[elementIndex].print();
			var rhsElement1 = node1.rules[i].rhs.blocks[blockIndex].elements[elementIndex].print();
			var lhsElement2 = node2.rules[i].lhs.blocks[blockIndex].elements[elementIndex].print();
			var rhsElement2 = node2.rules[i].rhs.blocks[blockIndex].elements[elementIndex].print();

			// crossover elements
			node1.rules[i].lhs.blocks[blockIndex].elements[elementIndex] = new RuleHSBlockElement(lhsElement2);
			node2.rules[i].lhs.blocks[blockIndex].elements[elementIndex] = new RuleHSBlockElement(lhsElement1);

			node1.crossOvered = true;
			node2.crossOvered = true;
			
		}
	};

	p.mutate = function() {
		for (var i=0; i < this.enodes.length; i++) {
			this.enodes[i].mutate();
		}
	};

	p.validate = function() {
		var valid = true;
		for (var i=0; i < this.enodes.length; i++) {
			valid = valid && this.enodes[i].validate();
		}

		return valid;
	};

	p.nextGeneration = function() {

	};

// Class: Node
// ------------------------------
var Node = function() {
	this.initialize();
};
p = Node.prototype;
	
	// public fields
	p.state = null;
	p.nodeMutators = [];
	p.ruleMutators = [];
	p.originalRules = [];
	p.rules = null;
	p.id = null;
	p.ruleLineNumbers = null;
	p.maxNodeRules = null;
	p.fitness = null;
	p.valid = null;
	p.solution = null;
	p.iterations = null;

	// static
	Node.sort = function( node1, node2 ) {
		// console.log("Node.sort");
		if (node1.noError > node2.noError) {
			return 1;
		}
		else if (node1.noError < node2.noError) {
			return -1;
		}
		else {

			if (node1.valid > node2.valid ) {
				return 1;
			}
			else if (node1.valid < node2.valid) {
				return -1;
			}
			else {
				if (node1.fitnessScore > node2.fitnessScore) {
					return 1;
				}
				else if (node1.fitnessScore < node2.fitnessScore) {
					return -1;
				}
				else {
					return 0;
				}
			}
		}

		
	};

	Node.accumScoreSort = function( node1, node2 ) {
		// console.log("Node.sort");
		if (node1.accumScore > node2.accumScore ) {
			return 1;
		}
		else if (node1.accumScore < node2.accumScore) {
			return -1;
		}
		else {
			return 0;
		}
	};

	// constructor
	p.initialize = function() {
		// console.log("Node.initialize()");
		this.ruleMutators = [];
		this.nodeMutators = [];
		this.originalRules = [];
		this.rules = [];
		this.id = enodes.length;
		this.maxNodeRules = 2;
		this.fitness = {};
		this.fitnessScore = 0.0;
		this.valid = -1;
		this.solution = [];
		this.iterations = 0;
		this.noError = -1;

	};

	Node.parse = function(str) {
		// console.log("static Node.parse(), evolver=%o", evolver);
		var n = new Node();
		n.setState(state);
		n.parse(str);
		return n;
	};

	p.parse = function (str) {
		// console.log("Node.parse()");
		var obj = JSON.parse(str);
		var i = 0;

		this.originalRules = obj.originalRules.map(Rule.createFromStr);
		this.rules = obj.rules.map(Rule.createFromStr);

		this.nodeMutators = obj.nodeMutators.map(psai.NodeMutator.createFromStr);
		// console.log("this.nodeMutators=%o", this.nodeMutators);
		// for (i=0; i < this.nodeMutators.length; i++) {
		// 	this.nodeMutators[i].setNode(this.evolver.enodes[nodeMutators[i].enodeIndex]);
		// }

		this.ruleMutators = obj.ruleMutators.map(RuleMutator.createFromStr);
		// console.log("this.ruleMutators=%o", this.ruleMutators);
		// var node = null;
		// for (i=0; i < this.ruleMutators.length; i++) {

		// 	node = this.evolver.enodes[this.ruleMutators[i].enodeIndex];
		// 	this.ruleMutators[i].setNode(node);
		// 	this.ruleMutators[i].setRule(node.rules[this.ruleMutators[i].ruleIndex]);

		// }

		this.id = obj.id;
		this.maxNodeRules = obj.maxNodeRules;
		this.valid = obj.valid;
		this.solution = obj.solution;
		this.iterations = obj.iterations;
		this.noError = obj.noError;

		this.calculateFitness();

		this.parsedString = str;
	};


	p.parseMutators = function() {
		
		if (this.parsedString) {
			//console.log("Node.parseMutators()");

			var obj = JSON.parse(this.parsedString);

			//console.log("this.nodeMutators=%o", this.nodeMutators);
			for (i=0; i < this.nodeMutators.length; i++) {
				//console.log("this=%o, enodeIndex=%s, node=%o", this, this.nodeMutators[i].enodeIndex, this.evolver.enodes[this.nodeMutators[i].enodeIndex]);
				//this.nodeMutators[i].setNode(this.evolver.enodes[this.nodeMutators[i].enodeIndex]);
				this.nodeMutators[i].setNode(this);
			}

			//console.log("this.ruleMutators=%o", this.ruleMutators);
			var node = null;
			for (i=0; i < this.ruleMutators.length; i++) {
				node = this.evolver.enodes[this.ruleMutators[i].enodeIndex];
				this.ruleMutators[i].setNode(this);
				this.ruleMutators[i].setRule(this.rules[this.ruleMutators[i].ruleIndex]);

			}
		}
	};

	// static
	Node.stringify = function(node) {
		return node.stringify();
	};

	p.stringify = function() {
		// console.log("Node.stringify()");

		var obj = {};

		obj.originalRules = this.originalRules.map(psai.Rule.print);
		obj.rules = this.rules.map(psai.Rule.print);
		obj.nodeMutators = this.nodeMutators.map(psai.NodeMutator.stringify);
		obj.ruleMutators = this.ruleMutators.map(psai.RuleMutator.stringify);
		obj.id = this.id;
		obj.maxNodeRules = this.maxNodeRules;
		obj.valid = this.valid;
		obj.solution = this.solution;
		obj.iterations = this.iterations;
		obj.noError = this.noError;

		return JSON.stringify(obj);

	};

	p.stats = function() {
		var j=0;

		console.log("Node Mutators:");
		for (j=0; j < this.nodeMutators.length; j++) {
			console.log("\t%s) %s", j, this.nodeMutators[j].name);
		}
		console.log("Rule Mutators:");
		for (j=0; j < this.ruleMutators.length; j++) {
			console.log("\t%s) %s", j, this.ruleMutators[j].name);
		}
		console.log("Old Rules:");
		for (j=0; j < this.originalRules.length; j++) {
			console.log("\t%s) %s", j, this.originalRules[j].str);
		}
		console.log("New Rules:");
		for (j=0; j < this.rules.length; j++) {
			console.log("\t%s) %s", j, this.rules[j].print());
		}
		console.log("Solution:\n\t[%s]", this.solution.toString());
		console.log("Iterations:\n\t%s", this.iterations);
		console.log("Node Fitness:\n\t%s", this.fitnessScore);
		console.log("Passed:\n\t%s", this.valid);
		console.log("Description:\n\t%s", "<Description>");
	};

	p.setEvolver = function(evolver) {
		this.evolver = evolver;
	};

	p.addRule = function(rule) {
		this.originalRules.push(new psai.Rule(rule.str));
		this.rules.push(rule);
		rule.setNode(this);
		
	};

	// public methods
	p.setState = function(state) {
		this.state = state;
	};

	p.mutate = function() {
		// console.log("Node.mutate()");

		var mutators = NodeMutator.getRandomMutators();
		var mutator = null;
		for (var i=0; i < mutators.length; i++) {
			mutator = mutators[i];
			mutator.setNode(this);
			mutator.mutate();
			this.nodeMutators.push(mutator);
		}

		// mutate rules
		this.mutateRules();
	};

	p.print = function() {
		var str = "Node";
		for (var i=0; i<this.rules.length; i++) {
			str += ("\n\t" + i + ") " + this.rules[i].print());
		}

		return str;
	};

	p.calculateFitness = function() {
		// console.log("Node.calculateFitness()");

		this.fitness = {};
		var i = 0;
		var j = 0;
		var match = null;

		// Fitness 1:  playerInRules
		// Makes sure that at least one rule uses the player.
		this.fitness['playerInRules'] = 0.0;
		for (i=0; i < this.rules.length; i++) {
			match = this.rules[i].print().match(/\s*player\s*/ig);
			if (this.rules[i].print().match(/\s*player\s*/ig)) {
				// if some rule has a player, max fitness.
				this.fitness['playerInRules'] = 1.0;
			}
		}

		// Fitness 2: objectsInRules
		var objects = Object.keys(this.state.objects);
		var object = null;
		var objectSeen = {};
		for (i=0; i< this.rules.length; i++) {
			for (j=0; j < objects.length; j++) {
				object = objects[j];
				if ((object in objectSeen) && objectSeen[object]) {
					continue;
				}
				match = this.rules[i].print().match(new RegExp("\\s*"+object+"\\s*", "ig"));
				if (match) {
					objectSeen[object] = true;
				}
			}
		}
		this.fitness['objectsInRules'] = parseFloat(Object.keys(objectSeen).length) / objects.length;

		// Fitness 3: player in LHS
		this.fitness['playerInLHS'] = 0.0;
		for (i=0; i < this.rules.length; i++) {
			match = this.rules[i].lhs.print().match(/\s*player\s*/ig);
			if (match) {
				this.fitness['playerInLHS'] = 1.0;
			}
		}

		// Fitness 4: player movement somewhere in rules
		this.fitness['playerMovement'] = 0.0;
		for (i=0; i < this.rules.length; i++) {
			match = this.rules[i].print().match(/\s*[<>^v]\s*\s*player\s*/ig);
			if (match) {
				this.fitness['playerMovement'] = 1.0;
			}
		}

		// Fitness 5: unique dirs per rule
		this.fitness['uniqueDirsPerRule'] = 0.0;
		var ruleDirectionsUsed = {};
		var ruleDirectionsCount = [];
		for (i=0; i < this.rules.length; i++){
			ruleDirectionsUsed[i] = {};
			
			match = this.rules[i].lhs.print().match(/[<>^v]/ig);
			if (match) {
				for (j=0; j < match.length; j++) {
					ruleDirectionsUsed[i][match[j]] = true;
				}
			}
			match = this.rules[i].rhs.print().match(/[<>^v]/ig);
			if (match) {
				for (j=0; j < match.length; j++) {
					ruleDirectionsUsed[i][match[j]] = true;
				}
			}

			ruleDirectionsCount.push(Object.keys(ruleDirectionsUsed[i]).length);
		}
		
		var avgRuleDirectionsCount = Math.ceil(ruleDirectionsCount.avg());

		//console.log("ruleDirectionsCount=%o", ruleDirectionsCount);
		//console.log("avgRuleDirectionsCount=%s", avgRuleDirectionsCount);


		if (avgRuleDirectionsCount === 0){
			this.fitness['uniqueDirsPerRule'] = 1.0;
		}
		else {
			this.fitness['uniqueDirsPerRule'] = 1.0/avgRuleDirectionsCount;
		}
		// console.log("(%s),\n\tfitness[uniqueDirsPerRule]=%s\n\t%o\n\t%o", this.print(), this.fitness['uniqueDirsPerRule'], ruleDirectionsUsed, ruleDirectionsCount.toString());

		// Overall Fitness
		var fitnessKeys = Object.keys(this.fitness);
		var fitnessKey = null;
		var fitnessScores = [];
		for (i=0; i < fitnessKeys.length; i++) {
			fitnessKey = fitnessKeys[i];
			fitnessScores.push(this.fitness[fitnessKey]);
		}

		this.fitnessScore = fitnessScores.avg();

	};

	p.mutateRules = function() {
		// console.log("Node.mutateRules()");
		var rule  = null;
		var ruleMutators = null;
		var mutator = null;
		for (var r=0; r < this.rules.length; r++) {
			rule = this.rules[r];
			ruleMutators = RuleMutator.getRandomMutators();
			for (var m=0; m < ruleMutators.length; m++) {
				mutator = ruleMutators[m];
				mutator.setNode(this);
				mutator.setRule(rule);
				mutator.mutate();
				this.ruleMutators.push(mutator);
			}
			
		}
	};

	p.validate = function() {
		//console.log("Node.validate(%o):%s", this, this.print());
		var valid = true;
		for (var i=0; i < this.rules.length; i++){
			valid = valid && this.rules[i].validate();
		}
		//console.log("\t\tvalid=%o", valid ? valid : "FAILED!");
		return valid;
	};

	// static
	Node.createCopy = function(node) {
		var copy = new psai.Node();
		copy.setState(state);
		copy.setEvolver(node.evolver);
		for (var i=0; i<node.rules.length; i++) {
			copy.addRule(new Rule(node.rules[i].print()));
		}

		return copy;
	};


// Class: Rule
// ------------------------------
var Rule = function(str) {
	if (str){
		this.initialize(str);
	}
};
p = Rule.prototype;
	
	Rule.DIRECTION_UP = "up";
	Rule.DIRECTION_DOWN = "down";
	Rule.DIRECTION_RIGHT = "right";
	Rule.DIRECTION_LEFT = "left";

	Rule.RELDIRECTION_UP = "^";
	Rule.RELDIRECTION_DOWN = "v";
	Rule.RELDIRECTION_RIGHT = ">";
	Rule.RELDIRECTION_LEFT = "<";

	Rule.PREFIX_LATE = "late";

	Rule.OBJECTRULE_MOVING = "moving";
	Rule.OBJECTRULE_STATIONARY = "stationary";
	Rule.OBJECTRULE_PERPENDICULAR = "perpendicular";
	Rule.OBJECTRULE_NO = "no";

	Rule.DIRECTIONS = [
		Rule.DIRECTION_UP,
		Rule.DIRECTION_DOWN,
		Rule.DIRECTION_RIGHT,
		Rule.DIRECTION_LEFT
	];

	Rule.RELDIRECTIONS = [
		Rule.RELDIRECTION_UP,
		Rule.RELDIRECTION_DOWN,
		Rule.RELDIRECTION_RIGHT,
		Rule.RELDIRECTION_LEFT,
	];

	Rule.ALLDIRECTIONS = Rule.DIRECTIONS.concat(Rule.RELDIRECTIONS);

	// public fields;
	p.str = null;
	p.match = null;
	p.lhs = null;
	p.rhs = null;
	p.lineNumber = null;

	// constructor
	p.initialize = function(str) {
		this.str = str;
		this.match = str.match(new RegExp(/(.+)\s*->\s*(.+)/));
		this.lhs = new RuleHS(this.match[1]);
		this.rhs = new RuleHS(this.match[2]);

		this.validate();
	};

	//
	Rule.print = function(rule) {
		return rule.print();
	};

	p.setNode = function(enode) {
		this.enode = enode;
	};

	p.setLineNumber = function(lineNumber) {
		this.lineNumber = lineNumber;
	};

	p.validate = function() {
		
		if (this.rhs.blocks.length != this.lhs.blocks.length) {
			//console.warn("\trule=%o, this.rhs.blocks.length != this.lhs.blocks.length", this);
			return false;
		}

		for (var i=0; i < this.rhs.blocks.length; i++) {
			var lhsBlock = this.lhs.blocks[i];
			var rhsBlock = this.rhs.blocks[i];

			if (lhsBlock.elements.length != rhsBlock.elements.length) {
				//console.warn("\trule=%o, block=%s this.rhs.blocks.length != this.lhs.blocks.length", this, i);
				return false;
			}
		}

		return true;
	};

	p.print = function() {
		return this.lhs.print() + " -> " + this.rhs.print();
	};

	// static
	Rule.isRelDirection = function(token) {
		return Rule.RELDIRECTIONS.indexOf(token.toLowerCase()) != -1;
	};

	// static
	Rule.createNull = function() {
		return new Rule("[ ] -> [ ]");
	};

	// static
	Rule.createFromStr = function(str) {
		return new Rule(str);
	};



	// public methods


// Class: RuleHS
// ------------------------------
var RuleHS = function(str) {
	this.initialize(str);
};
p = RuleHS.prototype;

	// public fields;
	p.str = null;
	p.blocks = null;

	// static
	RuleHS.print = function(rulehs) {
		return rulehs.print();
	};

	// constructor
	p.initialize = function(str) {
		this.str = str;
		this.split = str.split(new RegExp(( /\s*\[(\s{0}|.[^\[\]]+)\]/ )));
		this.match = str.match(new RegExp(( /\s*\[(\s*|.[^\[\]]+)\]/g)));
		this.prefix = this.split[0].trim();
		this.suffix = this.split[this.split.length-1].trim();

		this.blocks = []; // a block is stuff enclosed within square brakets.

		var blockStr = null;

		for (var i=0; i < this.match.length; i++) {
			blockStr = this.match[i].trim();
			this.blocks.push(new psai.RuleHSBlock(blockStr));
		}
		// console.log("RuleHS.initialize(%s)\n\tsplit=%o", this.str, this.split);
	};

	// public methods
	p.print = function() {
		var str = this.blocks.map(RuleHSBlock.print);
		return str.join(" ");
	};

// Class: RuleHSBlock
// ------------------------------
var RuleHSBlock = function(str) {
	this.initialize(str);
};
p = RuleHSBlock.prototype;

	// public fields;
	p.str = null;
	p.elements = null;

	// static
	RuleHSBlock.print = function(block) {
		return block.print();
	};

	// constructor
	p.initialize = function (str) {
		this.str = str;
		this.elements = [];

		var blockElementsArray = this.str.replace("[","").replace("]","").split('|');
		for (var j=0; j < blockElementsArray.length; j++) {
			var blockElement = new RuleHSBlockElement(blockElementsArray[j].trim());
			this.elements.push(blockElement);
		}
	};

	p.print = function() {
		var blockStr = this.elements.map(psai.RuleHSBlockElement.print).join(" | ");
		return "[ " + blockStr + " ]";
	};

// Class: RuleHSBlockElement
// ------------------------------
var RuleHSBlockElement = function(str) {
	this.initialize(str);
};
p = RuleHSBlockElement.prototype;

	// public fields;
	p.str = null;
	p.tokens = null;

	// static 
	RuleHSBlockElement.print = function (element) {
		return element.print();
	};

	// constructor
	p.initialize = function (str) {
		this.str = str;
		this.tokens = str.match(new RegExp(/(\S)+/g));
		if (!this.tokens) {
			this.tokens = [];
		}

	};

	p.print = function() {
		if (this.tokens){
			return this.tokens.join(" ");
		}
	};

// Class: NodeMutator
var NodeMutator = function() {
};
p = NodeMutator.prototype;
	
	p.enode = null;

	// constructor
	p.initialize = function(name_) {
		this.name = name_;
		this.type = name_;
		// console.log("NodeMutator.initialize()");
	};

	// static
	NodeMutator.stringify = function(mutator) {
		return mutator.stringify();
	};

	p.stringify = function() {
		var obj = {};
		obj.name = this.name;
		obj.type = this.type;
		obj.enodeIndex = this.enodeIndex;

		return JSON.stringify(obj);
	};

	p.setNode = function(enode) {
		// console.log("NodeMutator.setNode()");
		this.enode = enode;
	};

	p.mutate = function() {
		// console.log("NodeMutator.mutate()");
		this.enodeIndex = this.enode.evolver.enodes.indexOf(this.enode);
	};

	// static
	NodeMutator.getRandomMutators = function() {
		var mutators = [];

		if (Math.random() < Evolver.nodeMutationProbability) {
			mutators.push(new NodeRuleSizeMutator());
		}

		return mutators;
	};

	NodeMutator.createFromStr = function(str) {
		
		var obj = JSON.parse(str);
		var mutator = null;

		if (obj.type === "NodeRuleSizeMutator") {
			mutator = new NodeRuleSizeMutator();
		}

		if (mutator) {
			mutator.name = obj.name;
			mutator.type = obj.type;
			mutator.enodeIndex = obj.enodeIndex;
		}

		return mutator;
	};

// Class: NodeRuleSizeMutator
// ------------------------------
var NodeRuleSizeMutator = function() {
	this.initialize("NodeRuleSizeMutator");
};
p = NodeRuleSizeMutator.prototype = new NodeMutator();

	// static
	NodeRuleSizeMutator.mutationProbability = 0.1;
	NodeRuleSizeMutator.mutationIncrementProbability = 0.5;

	// constructor
	p.NodeMutator_initialize = p.initialize;
	p.initialize = function(name_) {
		this.name = name_;
		// console.log("NodeRuleSizeMutator.initialize()");
		this.NodeMutator_initialize(name_);
	};

	p.NodeMutator_mutate = p.mutate;
	p.mutate = function() {
		// console.log("NodeRuleSizeMutator.mutate(), %o", this.enode);
		// get the current rule size of the node.
		this.maxNodeRules = this.enode.maxNodeRules;
		this.ruleSizeOriginal = this.enode.rules.length;
		this.ruleSize = this.enode.rules.length;
		if (Math.random() < NodeRuleSizeMutator.mutationProbability) {
			if (this.ruleSize > 1) {
				this.ruleSize = Math.random() < NodeRuleSizeMutator.mutationIncrementProbability ? this.ruleSize+1 : this.ruleSize-1;
			}
			else {
				this.ruleSize = Math.random() < NodeRuleSizeMutator.mutationIncrementProbability ? this.ruleSize+1 : this.ruleSize;
			}
		}
		this.ruleSizeDiff = this.ruleSize - this.ruleSizeOriginal;

		this.name += (" (oldsize=" + this.ruleSizeOriginal + ",newsize=" + this.ruleSize + ")");

		if (this.ruleSizeDiff > 0 ) {
			// increment number of rules
			this.newRule = Rule.createNull();
			this.ruleIndex = parseInt(Math.random()*this.enode.rules.length, 10);
			this.enode.rules.splice(this.ruleIndex, 0, this.newRule);

		}
		else if (this.ruleSizeDiff < 0) {
			// decrement number of rules
			this.ruleIndex = parseInt(Math.random()*this.enode.rules.length, 10);
			this.enode.rules.splice(this.ruleIndex, 1);
		}

		// super
		this.NodeMutator_mutate();
	};


// Class: RuleMutator
// ------------------------------
var RuleMutator = function() {
};
p = RuleMutator.prototype;
	
	p.enode = null;

	// constructor
	p.initialize = function(name_) {
		this.name = name_;
		this.type = name_;
		// console.log("RuleMutator.initialize()");
	};

	// static
	RuleMutator.stringify = function(mutator) {
		return mutator.stringify();
	};

	p.setNode = function(enode) {
		// console.log("RuleMutator.setNode(), enode=%o", enode);
		this.enode = enode;
	};

	p.setRule = function(rule) {
		this.rule = rule;
	};

	p.mutate = function() {
		// console.log("RuleMutator.mutate()");
		this.enodeIndex = this.enode.evolver.enodes.indexOf(this.enode);
		this.ruleIndex = this.enode.rules.indexOf(this.rule);
	};

	p.stringify = function() {
		// console.log("RuleMutator.stringify(), enode=%o", this.enode);
		var obj = {};
		obj.name = this.name;
		obj.type = this.type;
		obj.enode = this.enode.id;
		obj.ruleIndex = this.ruleIndex;
		obj.enodeIndex = this.enodeIndex;

		return JSON.stringify(obj);
	};

	p.mutateHS = function() {
		// Mutate Options:
		// 1) Prefixes (e.g., Late, Horizontal, Vertical, etc.)
		// 2) Operators (e.g., <, >, ^, v).
		// 3) Objects.
		// 4) #Objects (e.g., [Object1 | Object2], [Object1 | ... | Object2])
		// 5) #Patterns (e.g., [> Object] [> Object2] -> ...)
	};

	// static
	RuleMutator.createFromStr = function(str) {
		var obj = JSON.parse(str);
		var mutator = null;

		if (obj.type === "RuleObjectMutator") {
			mutator = new RuleObjectMutator();
		}
		else if (obj.type === "RuleDirectionMutator") {
			mutator = new RuleDirectionMutator();
		}
		else if (obj.type === "RuleBlockSizeMutator") {
			mutator = new RuleBlockSizeMutator();
		}
		else if (obj.type === "RuleSwapHSMutator") {
			mutator = new RuleSwapHSMutator();
		}

		// console.log("RuleMutator.createFromStr(), str=%s", str);
		// console.log("obj=%o", obj);
		// console.log("mutator=%o", mutator);

		if (mutator) {
			mutator.name = obj.name;
			mutator.type = obj.type;
			mutator.ruleIndex = obj.ruleIndex;
			mutator.enodeIndex = obj.enodeIndex;
		}

		return mutator;
	};

	// static
	RuleMutator.getRandomMutator = function() {
		return new RuleObjectMutator();
	};

	// static
	RuleMutator.getRandomMutators = function() {
		var mutators = [];

		if (Math.random() < Evolver.ruleMutationProbability) {
			mutators.push(new RuleObjectMutator());
		}

		if (Math.random() < Evolver.ruleMutationProbability) {
			mutators.push(new RuleDirectionMutator());
		}

		if (Math.random() < Evolver.ruleMutationProbability) {
			mutators.push(new RuleBlockSizeMutator());
		}

		if (Math.random() < Evolver.ruleMutationProbability) {
			mutators.push(new RuleSwapHSMutator());
		}
		

		return mutators;
	};

// Class: RuleObjectMutator
var RuleBlockSizeMutator = function() {
	this.initialize("RuleBlockSizeMutator");
};
p = RuleBlockSizeMutator.prototype = new RuleMutator();
	
	p.RuleMutator_initialize = p.initialize;
	p.initialize = function(name) {
		//console.log("RuleBlockSizeMutator.initialize()");
		this.RuleMutator_initialize(name);
	};

	p.RuleMutator_mutate = p.mutate;
	p.mutate = function() {
		//console.log("RuleBlockSizeMutator.mutate()");

		// console.log("this.rule=%o", this.rule);

		// which block are we modifying?
		this.blockIndex = parseInt(this.rule.lhs.blocks.length*Math.random(),10);

		// what block size do we desire now?
		this.blockSize = this.rule.lhs.blocks[this.blockIndex].elements.length;
		this.blockSize = Math.max(0,Math.random() < 0.5 ? this.blockSize-1 : this.blockSize+1);
		this.blockSize = Math.max(1, this.blockSize);

		this.name += " (oldsize=" + this.rule.lhs.blocks[this.blockIndex].elements.length + ", newsize=" + this.blockSize + ")";

		this.mutateHS(this.rule.lhs);
		this.mutateHS(this.rule.rhs);

		this.RuleMutator_mutate();
	};

	p.mutateHS = function(hs) {
		//console.log("RuleBlockSizeMutator.mutateHS()");

		//console.log("hs.blocks=%o", hs.blocks);
		
		var block = hs.blocks[this.blockIndex];
		var currentSize = block.elements.length;
		var sizeDiff = this.blockSize - currentSize;

		var candidatePrefixes = psai.Rule.RELDIRECTIONS.slice(0);
		var candidateObjects = Object.keys(this.enode.state.objects);

		candidatePrefixes.push("");
		candidateObjects.push("");

		// console.log("candidatePrefixes=%o\ncandidateObjects=%o", candidatePrefixes, candidateObjects);

		if (sizeDiff > 0) {
			
			var newElementObject = candidateObjects.rand();
			var newElementPrefix = newElementObject ? candidatePrefixes.rand(): "";
			var newElement = new psai.RuleHSBlockElement(newElementPrefix + " " + newElementObject);
			block.elements.push(newElement);
		}
		else if (sizeDiff < 0) {

			var elementIndex = parseInt(Math.random()*block.elements.length,10);
			block.elements.splice(elementIndex, 1);
		}

	};

// Class: RuleObjectMutator
var RuleObjectMutator = function() {
	this.initialize("RuleObjectMutator");
};

p = RuleObjectMutator.prototype = new RuleMutator();

	RuleObjectMutator.elementMutationProbability = 0.1;
	
	p.RuleMutator_initialize = p.initialize;
	p.initialize = function(name) {
		//console.log("RuleObjectMutator.initialize()");
		this.RuleMutator_initialize(name);
	};

	p.RuleMutator_mutate = p.mutate;
	p.mutate = function() {
		//console.log("RuleObjectMutator.mutate()");'

		// which block are we modifying?
		this.blockIndex = parseInt(this.rule.lhs.blocks.length*Math.random(),10);
		
		this.mutateHS(this.rule.lhs);
		this.mutateHS(this.rule.rhs);

		this.RuleMutator_mutate();
	};

	p.mutateHS = function(hs) {

		var block = hs.blocks[this.blockIndex];
		var candidatePrefixes = psai.Rule.RELDIRECTIONS.slice(0);
		var candidateObjects = Object.keys(this.enode.state.objects);

		candidateObjects.push("");
		candidatePrefixes.push("");

		for (var i=0; i < block.elements.length; i++)
		{
			if (Math.random() < RuleObjectMutator.elementMutationProbability) {
				var newElementObject = candidateObjects.rand();
				var newElementPrefix = newElementObject ? candidatePrefixes.rand(): "";
				var newElement = new psai.RuleHSBlockElement(newElementPrefix + " " + newElementObject);
				block.elements[i] = newElement;
			}
		}

	};

// Class: RuleDirectionMutator
var RuleDirectionMutator = function() {
	this.initialize("RuleDirectionMutator");
};

p = RuleDirectionMutator.prototype = new RuleMutator();
	
	p.RuleMutator_initialize = p.initialize;
	p.initialize = function(name) {
		// console.log("RuleDirectionMutator.initialize()");
		this.RuleMutator_initialize(name);
	};

	p.RuleMutator_mutate = p.mutate;
	p.mutate = function() {
		// console.log("RuleDirectionMutator.mutate()");
		if (this.rule) {
			this.mutateHS(this.rule.lhs);
			this.mutateHS(this.rule.rhs);
		}

		this.RuleMutator_mutate();
		
	};

	p.mutateHS = function(hs) {
		
		var block = null;
		var element = null;
		var token = null;

		for (var i=0; i < hs.blocks.length; i++) {
			block = hs.blocks[i];
			for (var j=0; j < block.elements.length; j++) {
				element = block.elements[j];
				for (var k=0; k < element.tokens.length; k++) {
					token = element.tokens[k];
					if (Rule.isRelDirection(token)) {
						var candidatePrefixes = psai.Rule.RELDIRECTIONS.slice(0);
						candidatePrefixes.push("");
						element.tokens[k] = candidatePrefixes.rand();
					}

				}
			}
		}
	};

// Class: RuleSwapHSMutator
var RuleSwapHSMutator = function() {
	this.initialize("RuleSwapHSMutator");
};

p = RuleSwapHSMutator.prototype = new RuleMutator();
	
	p.RuleMutator_initialize = p.initialize;
	p.initialize = function(name) {
		this.RuleMutator_initialize(name);
	};

	p.RuleMutator_mutate = p.mutate;
	p.mutate = function() {
		// console.log("RuleDirectionMutator.mutate()");
		if (this.rule) {
			var lhs = this.rule.lhs.print();
			var rhs = this.rule.rhs.print();

			this.rule.lhs = new RuleHS(rhs);
			this.rule.rhs = new RuleHS(lhs);
		}

		this.RuleMutator_mutate();
		
	};

	

// Class declarations.
// ------------------------------
psai.Evolver = Evolver;

psai.Node = Node;
psai.Rule = Rule;
psai.RuleHS = RuleHS;
psai.RuleHSBlock = RuleHSBlock;
psai.RuleHSBlockElement = RuleHSBlockElement;

psai.NodeMutator = NodeMutator;
psai.NodeRuleSizeMutator = NodeRuleSizeMutator;

psai.RuleMutator = RuleMutator;
psai.RuleObjectMutator = RuleObjectMutator;
psai.RuleDirectionMutator = RuleDirectionMutator;
psai.RuleSwapHSMutator = RuleSwapHSMutator;
// ------------------------------
}());


// Main
// ------------------------------
var enode;
var nodeHistory = [];
var inputHistoryBackup = [];
var iterationsBackup = [];
	
	// Some debug stuff.
	var hsregex = new RegExp(( /\s*\[(.[^\[\]]+)\]/ ));
	rule0 = new psai.Rule("[ >  Player | Crate ] -> [  >  Player | > Crate  ]");
	rule1 = new psai.Rule("[ stationary Robot ] -> [randomDir Robot]");
	rule2 = new psai.Rule("[ Spawner no Obstacle ] -> [ Spawner random Robot ]");
	rule3 = new psai.Rule("Horizontal [ > Player | No Obstacle ] -> [ PlayerBodyH  | PlayerHead1 ] sfx2");
	rule4 = new psai.Rule("[ Whale | ... | Perpendicular Beam ] -> [ Perpendicular Whale | ... | Perpendicular Beam ]");
	rule5 = new psai.Rule("[ temp ] -> []");
	rule6 = new psai.Rule("[ UP Cat ]  [ Bird ] -> [ UP Cat ] []");
	rule7 = new psai.Rule("[ MOVING Player | STATIONARY Crate ] -> [ MOVING Player | MOVING Crate ]");
	rule8 = new psai.Rule("late [ Crate | Crate | Crate ] -> [ | | ]");
	// End debug stuff

var evolver = null;
var enodes = [];
var solution = [];
var iterations = -1;

insertBlankLine = function(lineNumber) {
	editor.setLine(lineNumber-1, "\n"+editor.getLine(lineNumber-1));
};

evolver_start = function() {
	console.log(">>>> evolver_start()");
	evolver = new psai.Evolver();
	restart();
	simulate_action();
	evolver_default();
	setTimeout(function(e) {simulate_action();}, 1000);
};

evolver_default = function() {
	console.log(">>>> evolver.default()");
	psai.Evolver.nodeMutationProbability = 0.5;
	psai.Evolver.ruleMutationProbability = 0.5;
	psai.RuleObjectMutator.elementMutationProbability = 0.5;
	psai.NodeRuleSizeMutator.mutationProbability = 0.5;
	psai.NodeRuleSizeMutator.mutationIncrementProbability = 0.5;

};

evolver_force = function() {
	console.log(">>>> evolver.force()");
	psai.Evolver.nodeMutationProbability = 1.0;
	psai.Evolver.ruleMutationProbability = 1.0;
	psai.RuleObjectMutator.elementMutationProbability = 1.0;
	psai.NodeRuleSizeMutator.mutationProbability = 1.0;
	psai.NodeRuleSizeMutator.mutationIncrementProbability = 0.1;
};

evolver_populate = function() {
	
	// create nodes
	var n = null;
	var i = null;
	for (i=0; i < 50; i++) {
		n = new psai.Node();
		n.setState(state);
		n.addRule(psai.Rule.createNull());
		evolver.addNode(n);
	}
	
	evolver_force();

	evolver.mutate();
	evolver.calculateFitness();
	evolver.sortNodes(true);
	evolver.stats(true);

	evolver_default();
};

evolver_load_node = function(n) {
	
	evolver_clear_rules();

	var ruleLineStart = editor.getCursor().line+1;
	var lineIndex = ruleLineStart-1;
	var newLine = null;

	for (j=0; j < n.rules.length; j++) {
		lineIndex = ruleLineStart+j-1;
		newLine =  n.rules[j].print();
		
		if (j < n.rules.length-1) {
			newLine += "\n";
		}
		editor.setLine(lineIndex, newLine);
	}

	rebuild();
	DoRestart();
};

evolver_simulate_node = function(n) {


	// check for error
	simulate_move_down();
	DoRestart();
	simulate_move_up();
	DoRestart();
	simulate_move_left();
	DoRestart();
	simulate_move_right();
	DoRestart();

	if (errorCount > 0) {
		inputHistory = [];
		iterations = 0;

	}
	else {
		var solution_obj = bestfs(level.dat);
		inputHistory = solution_obj[0];
		iterations = solution_obj[1];
	}

	inputHistoryBackup.push(inputHistory.slice(0));
	iterationsBackup.push(iterations);

	n.solution = inputHistory.slice(0);
	n.iterations = iterations;
	n.valid = inputHistory.length > 1 ? 1 : 0;
	n.noError = errorCount > 0 ? 0 : 1;
};

evolver_simulate = function() {

	var n = null;
	for (var i=0; i<evolver.enodes.length; i++) {
		console.log("\t\t\t >>>> evolver.simulate(%s) <<<<", i);
		n = evolver.enodes[i];

		evolver_load_node(n);
		evolver_simulate_node(n);
		n.stats();
	}

	evolver.sortNodes(true);
	evolver.stats(true);

};

main1 = function() {

	rebuild();
	
	if (titleScreen || textMode) {
		simulate_action();
	}

	if (enode) {
		nodeHistory.push(enode);
	}

	enode = new psai.Node();
	enode.setState(state);

	evolver.addNode(enode);
};

evolve1 = function() {

	console.log("Evolving...");

	enode.mutate();

	var j;

	// clear the old rules first.
	//var ruleLineNumbers = Object.keys(enode.ruleLineNumbers);
	//for (j=0; j < ruleLineNumbers.length; j++) {
	//	editor.setLine(parseInt(ruleLineNumbers[j],10), "");
	//}
	evolver_clear_rules();

	var ruleLineStart = editor.getCursor().line+1;
	var lineIndex = ruleLineStart-1;
	var newLine = null;
	console.log("ruleLinStart=%s", ruleLineStart);
	for (j=0; j < enode.rules.length; j++) {
		lineIndex = ruleLineStart+j-1;
		newLine =  enode.rules[j].print();
		
		if (j < enode.rules.length-1) {
			newLine += "\n";
		}
		editor.setLine(lineIndex, newLine);
	}
	// insert new node rules.
	//for (j=0; j < enode.rules.length; j++) {
	//	editor.setLine(enode.rules[j].lineNumber-1, enode.rules[j].print());
	//}

	rebuild();
};

simulate1 = function() {
	solution = bestfs(level.dat);

	inputHistory = solution[0];
	inputHistoryBackup.push(inputHistory.slice(0));
	iterations = solution[1];

	if (inputHistory.length > 0) {
		makeGIF(0, true);
	}

	console.log("------- Evolution Results -------");
	console.log("Node Mutators:");
	for (j=0; j < enode.nodeMutators.length; j++) {
		console.log("\t%s) %s", j, enode.nodeMutators[j].name);
	}
	console.log("Rule Mutators:");
	for (j=0; j < enode.ruleMutators.length; j++) {
		console.log("\t%s) %s", j, enode.ruleMutators[j].name);
	}
	console.log("Old Rules:");
	for (j=0; j < enode.originalRules.length; j++) {
		console.log("\t%s: %s", enode.originalRules[j].lineNumber, enode.originalRules[j].str);
	}
	console.log("New Rules:");
	for (j=0; j < enode.rules.length; j++) {
		console.log("\t%s: %s", enode.rules[j].lineNumber, enode.rules[j].print());
	}
	console.log("Solution:\n\t[%s]", solution[0].toString());
	console.log("Iterations:\n\t%s", iterations);
	console.log("Description:\n\t%s", "<Description>");

	console.log("------- END -------");
};

fitness1 = function() {
	enode.calculateFitness();
};



evolver_next = function() {
	console.log(">>>> evolver_next() (start), generation (%s)->(%s)", evolver.generation, evolver.generation+1);
	evolver.saveHistory();
	var nextNodes = evolver.evolve();
	evolver.next();
	evolver.enodes = nextNodes;
	evolver.calculateFitness();
	var validate = evolver.validate();
	evolver.sortNodes(true);
	evolver.stats(true);
	console.log(">>>> evolver_next() (end), generation (%s), validate=%s, nodes=%s!", evolver.generation, validate, evolver.enodes.length);
};

evolver_clear_rules = function () {
	console.log(">>>> evolver_clear_rules(), state.ruleLineNumbers=%s", state.ruleLineNumbers.toString());
	var lineNumbers = state.ruleLineNumbers;
	var minLine = lineNumbers.min()-1;
	var maxLine = lineNumbers.max()-1;

	editor.setCursor({line:minLine-1, ch:0});
	editor.setSelection({line:minLine, ch:0}, {line:maxLine, ch:999});
	editor.replaceSelection("");
};

stats = function() {
	console.log("------- Evolution Results -------");
	enode.stats();
	// console.log("Node Mutators:");
	// for (j=0; j < enode.nodeMutators.length; j++) {
	// 	console.log("\t%s) %s", j, enode.nodeMutators[j].name);
	// }
	// console.log("Rule Mutators:");
	// for (j=0; j < enode.ruleMutators.length; j++) {
	// 	console.log("\t%s) %s", j, enode.ruleMutators[j].name);
	// }
	// console.log("Old Rules:");
	// for (j=0; j < enode.originalRules.length; j++) {
	// 	console.log("\t%s: %s", enode.originalRules[j].lineNumber, enode.originalRules[j].str);
	// }
	// console.log("New Rules:");
	// for (j=0; j < enode.rules.length; j++) {
	// 	console.log("\t%s: %s", enode.rules[j].lineNumber, enode.rules[j].print());
	// }
	// console.log("Solution:\n\t[%s]", solution.length === 0 ? solution : solution[0].toString());
	// console.log("Iterations:\n\t%s", iterations);
	// console.log("Description:\n\t%s", "<Description>");
	// console.log("Node Fitness:\n\t%s", enode.fitnessScore);

	console.log("------- END -------");
};

evolver_next_simulate_save = function(n, evolutionName) {
	for (var i=0; i < n; i++) {
		evolver_next();
		evolver_simulate();
		evolver.save(evolutionName);
	}
};

evolver_start();



