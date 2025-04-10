import {evaluate} from 'https://cdn.jsdelivr.net/npm/mathjs@13.2.0/+esm';
import Decimal from './break_infinity.js';
import * as notation from './notation.js';

import en_us from "./lang/en_us.js";
import de_de from "./lang/de_de.js";

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
            description: "Sets the rate at which the game runs ticks <br><em>note that this will not change the money you make per second; higher framerates might run slower on lower end devices</em>",
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
            value: 'defaultDark',
            constriction: ['defaultLight', 'defaultDark'],
            default: 'defaultDark',
            showInMenu: true,
            editableByUser: true,
        },
        language: {
            name: "Language",
            desctiption: "The Language the Game is in",
            category: "Gameplay",
            value: "de_de",
            constriction: ["en_us", "de_de"],
            default: "en_us",
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
        let plw = l('productionLineWarning');
        l('moneyDisplay').innerHTML = Game.transl("YouHaveXMoney");
        l('mpsDisplay').innerHTML = Game.transl("WithYourEquation");
        let check = Game.productionLineCheck();
        if (check[0] == 0) {
            l('productionLine').style.borderColor = "var(--red-accent-color)";
            if (check[1] == 0) {
                plw.innerHTML = "‎";
            }
            else if (check[1] == 1) {
                plw.style.color = "var(--red-accent-color)";
                plw.innerHTML = Game.transl(check[3] ? "productionLineWarning.TooManyUsesOfX" : "productionLineWarning.XNotUnlocked", Game.transl("operation." + check[2]));
            }
            else if (check[1] == 2) {
                plw.style.color = "var(--red-accent-color)";
                plw.innerHTML = Game.transl("productionLineWarning.TooManyUsesOfNumberX", check[2]);
            }
        }
        else if (check[0] == 1) {
            l('productionLine').style.borderColor = "var(--black-accent-color)";
            plw.innerHTML = "‎";
        }
        else if (check[0] == 2) {
            plw.style.color = "var(--yellow-accent-color)";
            plw.innerHTML = Game.transl("productionLineWarning.HigherThanCap");
            l('productionLine').style.borderColor = "var(--yellow-accent-color)";
        }
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
                return [0, 1, Game.incrementors[inc].id, Game.incrementors[inc].maxUses > 0];
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
        if (Game.productionLineCheck()[0] == 0) {
            Game.mps = new Decimal(0);
            return;
        }
        let q;
        let prodLine = l('productionLine').value;
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
        if (Game.timers["GameLoop"][1] != Game.settings.framerate.value) {
            clearInterval(Game.timers["GameLoop"][0]);
            Game.timers["GameLoop"] = Game.addTimer(Game.settings.framerate.value, Game.loop);
        }
        Game.calculateMps();
        Game.money = Game.money.plus(Game.mps.div(Game.settings.framerate.value));
        Game.updateVisuals();
    }

    Game.addTimer = function(fps, callback) {
        return [setInterval(callback, 1000 / fps), fps];
    }

    Game.changelog = `
        <h2>Version 0.1</h2>
        <p></p>
        <ul>
            <li>Initial Release</li>
        <ul>
    `;
    
    Game.tooltip = function(parent, title) {
        this.parent = l(parent);
        this.title = title;

        this.element = createElement("div");
        this.element.appendChild("p").innerHTML = this.title;
        this.element.setAttribute("id", this.parent.id+"_tooltip");
        
        this.create = function() {
            this.parent.appendChild(this.element);
            this.element.style.display = "none";

            this.element.addEventListener("mouseover", this.mouseOver);
            this.element.addEventListener("mouseout", this.mouseOut);
        }

        this.mouseOver = function() {
            this.element.style.display = "block";
        }

        this.mouseOut = function() {
            this.element.style.display = "none";
        }
    }

    Game.tooltips = {};

    Game.transl = function(what, cusVar) {
        const lang = Game.settings.language.value;
        let exit = eval(lang + ".words[\"" + what + "\"]") ?? eval(lang + ".words[\"missing\"]") ?? "missing";

        if (cusVar) {
            exit = exit.replace("&&cusVar&&", cusVar);
        }

        exit = exit.replace("&&test&&", "test")
            .replace("&&ttext&&", what)
            .replace("&&money&&", notation.biNotation(Game.money, 2))
            .replace("&&mps&&", notation.biNotation(Game.mps, 2))
            .replace("&&mpsCap&&", Game.mpsCap);
        ;
        return exit;
    }

    Game.loadTheme = function(theme) {
        l('theme').href = "./themes/" + theme + ".css"
    }






    Game.init = function() {
        Game.loadTheme(Game.settings.theme.value);
        Game.money = new Decimal(0);
        Game.mpsCap = new Decimal(1);
        Game.timers['GameLoop'] = Game.addTimer(Game.settings.framerate.value, Game.loop);
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});