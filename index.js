import {evaluate} from 'https://cdn.jsdelivr.net/npm/mathjs@13.2.0/+esm';
import Decimal from './break_infinity.js';
import * as notation from './notation.js';

function l(what) {
    return document.getElementById(what);
    // yes i stole this from cookie clicker sue me bitch
}

function log(what) {
    console.log(what);
}

var Game = {}; 

(function() {
    Game.timers = {};
    Game.money;
    Game.productionLine;
    Game.mps;
    Game.mpsCap;

    Game.settings = {
        framerate: {
            name: "Framerate",
            name: "Sets the rate at which the game runs ticks <br><em>note that this will not change the money you make per second; on lower end devices, the game might run slower on lower end devices</em>",
            category: "Gameplay",
            value: 24,
            constriction: [1, 30],
            default: 24,
            showInMenu: true,
            editableByUser: true,
        },
        theme: {
            name: "Theme",
            description: "Sets the theme for the game",
            category: "Visuals",
            value: 'defaultLight',
            constriction: ['defaultLight'],
            default: 'defaultLight',
            showInMenu: true,
            editableByUser: true,
        }
    };

    Game.incrementor = function(id, rep, maxUses) {
        this.id = id;
        this.representation = rep;
        this.maxUses = maxUses;
    }

    Game.incrementors = {};

    Game.incrementors.addition = new Game.incrementor(
        'addition',
        '+',
        1
    );

    Game.incrementors.multiplication = new Game.incrementor(
        'multiplication',
        '*',
        0
    );

    Game.incrementors.exponentiation = new Game.incrementor(
        'exponentiation',
        '^',
        0
    );

    Game.updateVisuals = function() {
        l('moneyDisplay').innerHTML = "You have " + notation.biNotation(Game.money, 2) + " money.";
        l('mpsDisplay').innerHTML = "With your equation, you are making " + notation.biNotation(Game.mps, 2) + " money per second.";
        let check = Game.productionLineCheck();
        if (check[0] == 0) {
            l('productionLine').style.borderColor = "var(--red-accent-color)";
            if (check[1] == 0) {
                l('productionLineWarning').style.display = "none";
            }
            else if (check[1] == 1) {
                l('productionLineWarning').style.display = "block";
                l('productionLineWarning').style.color = "var(--red-accent-color)";
                l('productionLineWarning').innerHTML = `${check[2]} is not unlocked yet`;
            }
            else if (check[1] == 2) {
                l('productionLineWarning').style.display = "block";
                l('productionLineWarning').style.color = "var(--red-accent-color)";
                l('productionLineWarning').innerHTML = `Too many uses of number ${check[2]}`;
            }
        }
        else if (check[0] == 1) {
            l('productionLine').style.borderColor = "var(--black-accent-color)";
            l('productionLineWarning').style.display = "none";
        }
        else if (check[0] == 2) {
            l('productionLineWarning').style.display = "block";
            l('productionLineWarning').style.color = "var(--yellow-accent-color)";
            l('productionLineWarning').innerHTML = "Your equation is making more money than your cap ("+ Game.mpsCap + ").";
            l('productionLine').style.borderColor = "var(--yellow-accent-color)";
        }
    }

    Game.init = function() {
        Game.money = new Decimal(0);
        Game.mpsCap = new Decimal(1);
        Game.timers['GameLoop'] = Game.addTimer(Game.settings.framerate.value, Game.loop);
    }

    Game.productionLineCheck = function() {
        let prodLine = l('productionLine').value;
        let occ = {};

        for (let i = 0; i < prodLine.length; i++) {
            if (occ[prodLine[i]]) {
                occ[prodLine[i]]++;
            } else {
                occ[prodLine[i]] = 1;
            }
        }



        try {
            evaluate(prodLine);
        } catch (e) {
            return [0, 0];
        }

        for (let inc in Game.incrementors) {
            if (occ[Game.incrementors[inc].representation] > Game.incrementors[inc].maxUses) {
                return [0, 1, `${inc} (${Game.incrementors[inc].representation})`];
            }
        }

        for (let number in [0,1,2,3,4,5,6,7,8,9]) {
            if (occ[number] > 1) {
                return [0, 2, number];
            }
        }

        if (Game.mpsCap.lt(evaluate(prodLine))) {
            return [2];
        }

        return [1];
    }

    Game.calculateMps = function() {
        if (Game.productionLineCheck()[0] == 0) return;
        let prodLine = l('productionLine').value;
        let q
        try { q = new Decimal(evaluate(prodLine)); } catch(e) {

        }
        if (isNaN(q)) {
            q = 0;
        }
        if (q > Game.mpsCap) {
            q = Game.mpsCap;
        }
        Game.mps = q;
    }

    Game.loop = function() {
        Game.calculateMps();
        Game.money = Game.money.plus(Game.mps.div(Game.settings.framerate.value));
        Game.updateVisuals();
    }

    Game.addTimer = function(fps, callback) {
        return setInterval(callback, 1000 / fps);
    }
})();


document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});