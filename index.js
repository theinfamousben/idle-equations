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
        
        // critical failures 
        if (check[0] == 0) {
            l('productionLine').style.borderColor = "var(--red-accent-color)";
            // invalid chars
            if (check[1] == 0) {
                plw.innerHTML = "‎";
            }
            // too many uses of operation
            else if (check[1] == 1) {
                plw.style.color = "var(--red-accent-color)";
                plw.innerHTML = Game.transl(check[3] ? "productionLineWarning.TooManyUsesOfX" : "productionLineWarning.XNotUnlocked", Game.transl("operation." + check[2]));
            }
            // too many uses of number
            else if (check[1] == 2) {
                plw.style.color = "var(--red-accent-color)";
                plw.innerHTML = Game.transl("productionLineWarning.TooManyUsesOfNumberX", check[2]);
            }
        }
        // valid
        else if (check[0] == 1) {
            l('productionLine').style.borderColor = "var(--black-accent-color)";
            plw.innerHTML = "‎";
        }
        // non critical failures
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

    // --- Research / Tech Tree ---
    // Simple research system: nodes have id, name, description, cost (Decimal), unlocked, prerequisites and an effect
    Game.research = {
        nodes: {
            unlock_multiplication: {
                id: 'unlock_multiplication',
                name: 'Multiplication',
                description: 'Unlock the multiplication operator (*) so you can use it in production equations.',
                cost: new Decimal(10),
                unlocked: false,
                prerequisites: [],
                pos: { x: 200, y: 120 },
                effect: { type: 'unlockIncrementor', target: 'multiplication', amount: 1 }
            },
            unlock_exponentiation: {
                id: 'unlock_exponentiation',
                name: 'Exponentiation',
                description: 'Unlock exponentiation (^) to build more powerful equations.',
                cost: new Decimal(100),
                unlocked: false,
                prerequisites: ['unlock_multiplication'],
                pos: { x: 420, y: 120 },
                effect: { type: 'unlockIncrementor', target: 'exponentiation', amount: 1 }
            },
            increase_cap_small: {
                id: 'increase_cap_small',
                name: 'Increase MPS Cap I',
                description: 'Increase the maximum allowed value for your equation output (mps cap) by 10.',
                cost: new Decimal(25),
                unlocked: false,
                prerequisites: [],
                pos: { x: 200, y: 300 },
                effect: { type: 'increaseCap', amount: new Decimal(10) }
            },
            increase_cap_large: {
                id: 'increase_cap_large',
                name: 'Increase MPS Cap II',
                description: 'Increase the mps cap by 100.',
                cost: new Decimal(250),
                unlocked: false,
                prerequisites: ['increase_cap_small'],
                pos: { x: 420, y: 300 },
                effect: { type: 'increaseCap', amount: new Decimal(100) }
            }
        }
    }

    Game.applyResearchEffect = function(node) {
        if (!node || !node.effect) return;
        const e = node.effect;
        if (e.type === 'unlockIncrementor') {
            if (Game.incrementors[e.target]) {
                Game.incrementors[e.target].maxUses = (Game.incrementors[e.target].maxUses || 0) + (e.amount || 1);
            }
        } else if (e.type === 'increaseCap') {
            try {
                Game.mpsCap = Game.mpsCap.plus(e.amount);
            } catch (err) {
                // fallback if amount isn't Decimal
                Game.mpsCap = Game.mpsCap.plus(new Decimal(e.amount));
            }
        }
    }

    // returns {canBuy: bool, reason: string|null}
    Game.canBuyResearch = function(node) {
        if (!node) return { canBuy: false, reason: 'missing' };
        if (node.unlocked) return { canBuy: false, reason: 'already_unlocked' };
        // prerequisites
        if (node.prerequisites && node.prerequisites.length > 0) {
            const missing = node.prerequisites.filter(pr => {
                const pn = Game.research.nodes[pr];
                return !pn || !pn.unlocked;
            });
            if (missing.length > 0) return { canBuy: false, reason: 'prerequisites', missing };
        }
        // money check
        try {
            if (!Game.money || Game.money.lt(node.cost)) return { canBuy: false, reason: 'money' };
        } catch (e) {
            return { canBuy: false, reason: 'money' };
        }
        return { canBuy: true, reason: null };
    }

    Game.renderResearch = function() {
        const container = document.getElementById('researchContainer');
        if (!container) return;
        // clear
        container.innerHTML = '';

        // ensure the map element exists
        const map = document.getElementById('researchMap');
        if (map) {
            // set a large virtual map size (can be dynamic)
            map.style.width = '1200px';
            map.style.height = '800px';
            map.style.position = 'relative';
            map.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(45deg, rgba(255,255,255,0.02) 1px, transparent 1px)';
            map.style.backgroundSize = '40px 40px';
        }

        for (const key in Game.research.nodes) {
            const node = Game.research.nodes[key];

            const card = document.createElement('div');
            card.className = 'research-card';
            card.style.border = '1px solid var(--black-accent-color)';
            card.style.padding = '8px';
            card.style.margin = '0';
            card.style.borderRadius = '6px';
            card.style.background = 'var(--panel-bg-color, #222)';
            card.style.width = '180px';
            card.style.position = 'absolute';
            // default position if not provided
            const x = (node.pos && node.pos.x) ? node.pos.x : 50;
            const y = (node.pos && node.pos.y) ? node.pos.y : 50;
            card.style.left = x + 'px';
            card.style.top = y + 'px';

            const title = document.createElement('h3');
            title.innerText = node.name;
            title.style.margin = '0 0 6px 0';
            card.appendChild(title);

            const desc = document.createElement('p');
            desc.innerText = node.description;
            desc.style.margin = '0 0 6px 0';
            card.appendChild(desc);

            const cost = document.createElement('p');
            cost.innerText = 'Cost: ' + notation.biNotation(node.cost, 2);
            cost.style.margin = '0 0 6px 0';
            card.appendChild(cost);

            const status = document.createElement('p');
            status.style.fontWeight = '600';
            status.style.margin = '0 0 6px 0';
            // determine availability
            const avail = Game.canBuyResearch(node);
            if (node.unlocked) {
                status.innerText = 'Unlocked';
            } else if (avail.reason === 'prerequisites') {
                const missing = avail.missing.map(id => (Game.research.nodes[id] ? Game.research.nodes[id].name : id));
                status.innerText = 'Locked — requires: ' + missing.join(', ');
            } else if (avail.reason === 'money') {
                status.innerText = 'Locked — insufficient funds';
            } else {
                status.innerText = 'Available';
            }
            card.appendChild(status);

            const btn = document.createElement('button');
            btn.innerText = node.unlocked ? 'Researched' : 'Research';
            btn.style.padding = '6px 10px';
            btn.style.cursor = node.unlocked ? 'default' : 'pointer';
            btn.style.marginTop = '6px';

            if (!node.unlocked) {
                if (!avail.canBuy) {
                    btn.disabled = true;
                    if (avail.reason === 'money') btn.title = 'Not enough money';
                    else if (avail.reason === 'prerequisites') btn.title = 'Requires: ' + avail.missing.join(', ');
                }
            } else {
                btn.disabled = true;
            }

            btn.addEventListener('click', function() { Game.buyResearch(node.id); });
            card.appendChild(btn);

            container.appendChild(card);
        }
    }

    Game.buyResearch = function(id) {
        const node = Game.research.nodes[id];
        if (!node) return;
        if (node.unlocked) return;
        // check prerequisites and money
        const avail = Game.canBuyResearch(node);
        if (!avail.canBuy) return;
        try {
            Game.money = Game.money.minus(node.cost);
        } catch (e) {
            return;
        }
        node.unlocked = true;
        Game.applyResearchEffect(node);
        Game.renderResearch();
        Game.updateVisuals();
    }






    Game.init = function() {
        Game.loadTheme(Game.settings.theme.value);
        Game.money = new Decimal(0);
        Game.mpsCap = new Decimal(1);
        Game.timers['GameLoop'] = Game.addTimer(Game.settings.framerate.value, Game.loop);
        // render research UI
        Game.renderResearch();
        // setup panning for research map
        (function setupPanning() {
            const viewport = document.getElementById('researchViewport');
            const map = document.getElementById('researchMap');
            if (!viewport || !map) return;

            // current translation
            let trans = { x: 0, y: 0 };
            let dragging = false;
            let last = { x: 0, y: 0 };

            // apply transform
            function applyTransform() {
                map.style.transform = `translate(${trans.x}px, ${trans.y}px)`;
            }

            // mouse events
            viewport.addEventListener('mousedown', function(e) {
                dragging = true;
                last.x = e.clientX;
                last.y = e.clientY;
                viewport.style.cursor = 'grabbing';
            });
            window.addEventListener('mouseup', function() { dragging = false; viewport.style.cursor = 'grab'; });
            window.addEventListener('mousemove', function(e) {
                if (!dragging) return;
                const dx = e.clientX - last.x;
                const dy = e.clientY - last.y;
                last.x = e.clientX; last.y = e.clientY;
                trans.x += dx; trans.y += dy;
                applyTransform();
            });

            // touch events
            viewport.addEventListener('touchstart', function(e) {
                dragging = true;
                const t = e.touches[0];
                last.x = t.clientX; last.y = t.clientY;
            }, { passive: true });
            window.addEventListener('touchend', function() { dragging = false; });
            window.addEventListener('touchmove', function(e) {
                if (!dragging) return;
                const t = e.touches[0];
                const dx = t.clientX - last.x;
                const dy = t.clientY - last.y;
                last.x = t.clientX; last.y = t.clientY;
                trans.x += dx; trans.y += dy;
                applyTransform();
            }, { passive: false });

            // initial cursor
            viewport.style.cursor = 'grab';
            // ensure overflow hidden on viewport
            viewport.style.overflow = 'hidden';
            viewport.style.position = 'relative';
        })();
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    Game.init();
});