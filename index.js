import {evaluate} from 'https://cdn.jsdelivr.net/npm/mathjs@13.2.0/+esm';
import Decimal from './js/helpers/break_infinity.js';
import * as notation from './js/helpers/notation.js';
import inc from './js/incrementors/index.js'

import en_us from "./lang/en_us.js";
import de_de from "./lang/de_de.js";

// TO FUTURE ME:
// DO NOT REMOVE THE ABOVE IMPORTS FOR LANGUAGES
// THEY *ARE* NEEDED, IT JUST DOESN'T SHOW BECAUSE THEY'RE NOT USED DIRECTLY
// EVAL() IS A SHIT FUNCTION
// ALSO ADD THESE MODULES WHEN MAKING NEW LANGUAGES
// AGAIN, FUCK EVAL

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
            description: "The Language the Game is in",
            category: "Gameplay",
            value: "en_us",
            constriction: ["en_us", "de_de"],
            default: "en_us",
            showInMenu: true,
            editableByUser: true,
        }
    };

    Game.incrementors = inc;


    Game.number = function(id, rep, maxUses, prodTime) {
        this.id = id;
        this.representation = rep;
        this.maxUses = maxUses;
        this.productionTime = new Decimal(prodTime); // production time in ms
    }

    Game.numbers = {}

    Game.numbers['1'] = new Game.number(
        '1',
        '1',
        1,
        1000
    );

    Game.numbers['2'] = new Game.number(
        '2',
        '2',
        0
    )

    Game.numbers['3'] = new Game.number(
        '3',
        '3',
        0
    );

    Game.numbers['4'] = new Game.number(
        '4',
        '4',
        0
    );

    Game.numbers['5'] = new Game.number(
        '5',
        '5',
        0
    );

    Game.numbers['6'] = new Game.number(
        '6',
        '6',
        0
    );

    Game.numbers['7'] = new Game.number(
        '7',
        '7',
        0
    );

    Game.numbers['8'] = new Game.number(
        '8',
        '8',
        0
    );

    Game.numbers['9'] = new Game.number(
        '9',
        '9',
        0
    );

    Game.updateVisuals = function() {
        Game.showPage(Game.currentPage);
        let plw = l('productionLineWarning');
        l('moneyDisplay').innerHTML = Game.transl("YouHaveXMoney");
        l('menuMoneyDisplay').innerHTML = Game.transl("currencyShort");
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
            if (Array.isArray(cusVar)) {
                for (let i in cusVar) {
                    exit = exit.replace("&&cusVar" + i + "&&", cusVar[i])
                }

            }
            else exit = exit.replace("&&cusVar&&", cusVar);
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

    Game.showPage = function(page) {
        const pages =  document.getElementsByClassName("page")

        for (let i = 0; i < pages.length; i++) {
            
            pages[i].style.display = "none";
        }
        document.getElementById(page).style.display = "flex";
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
                icon: '×', // placeholder text icon
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
                icon: '^', // placeholder text icon
                effect: { type: 'unlockIncrementor', target: 'exponentiation', amount: 1 }
            },
            increase_cap_small: {
                id: 'increase_cap_small',
                name: 'Increase MPS Cap I',
                description: 'Increase the maximum allowed value for your equation output (mps cap) by 10.',
                cost: new Decimal(10),
                unlocked: false,
                prerequisites: [],
                pos: { x: 200, y: 300 },
                icon: '↑', // placeholder text icon
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
                icon: '↑↑', // placeholder text icon
                effect: { type: 'increaseCap', amount: new Decimal(100) }
            },
            sample1: {
                id: 'sample1',
                name: 'Sample Research 1',
                description: 'This is a sample research node with no effect.',
                cost: new Decimal(50),
                unlocked: false,
                prerequisites: ['unlock_exponentiation'],
                pos: { x: 550, y: 100 },
                icon: 'S1', // placeholder text icon
                effect: null
            },
            sample2: {
                id: 'sample2',
                name: 'Sample Research 2',
                description: 'Another sample research node with no effect.',
                cost: new Decimal(500),
                unlocked: false,
                prerequisites: ['unlock_exponentiation', 'increase_cap_large'],
                pos: { x: 550, y: 220 },
                icon: 'S2', // placeholder text icon
                effect: null
            },
            unlock_number_1: {
                id: 'unlock_number_1',
                name: 'Unlock Number 1',
                description: 'Unlock the number 1 for use in your production equations.',
                cost: new Decimal(0),
                unlocked: true,
                prerequisites: [],
                pos: { x: 200, y: 420},
                icon: '1',
                effect: null
            },
            unlock_number_2: {
                id: 'unlock_number_2',
                name: 'Unlock Number 2',
                description: 'Unlock the number 2 for use in your production equations.',
                cost: new Decimal(20),
                unlocked: false,
                prerequisites: ['unlock_number_1'],
                pos: { x: 320, y: 420},
                icon: '2',
                effect: { type: 'unlockNumber', target: '2', amount: 1 }
            },
            unlock_number_3: {
                id: 'unlock_number_3',
                name: 'Unlock Number 3',
                description: 'Unlock the number 3 for use in your production equations.',
                cost: new Decimal(50),
                unlocked: false,
                prerequisites: ['unlock_number_2'],
                pos: { x: 440, y: 420},
                icon: '3',
                effect: { type: 'unlockNumber', target: '3', amount: 1 }
            },
            unlock_number_4: {
                id: 'unlock_number_4',
                name: 'Unlock Number 4',
                description: 'Unlock the number 4 for use in your production equations.',
                cost: new Decimal(150),
                unlocked: false,
                prerequisites: ['unlock_number_3'],
                pos: { x: 560, y: 420},
                icon: '4',
                effect: { type: 'unlockNumber', target: '4', amount: 1 }
            },
            unlock_number_5: {
                id: 'unlock_number_5',
                name: 'Unlock Number 5',
                description: 'Unlock the number 5 for use in your production equations.',
                cost: new Decimal(400),
                unlocked: false,
                prerequisites: ['unlock_number_4'],
                pos: { x: 680, y: 420},
                icon: '5',
                effect: { type: 'unlockNumber', target: '5', amount: 1 }
            },
            unlock_number_6: {
                id: 'unlock_number_6',
                name: 'Unlock Number 6',
                description: 'Unlock the number 6 for use in your production equations.',
                cost: new Decimal(1200),
                unlocked: false,
                prerequisites: ['unlock_number_5'],
                pos: { x: 800, y: 420},
                icon: '6',
                effect: { type: 'unlockNumber', target: '6', amount: 1 }
            },
            unlock_number_7: {
                id: 'unlock_number_7',
                name: 'Unlock Number 7',
                description: 'Unlock the number 7 for use in your production equations.',
                cost: new Decimal(3500),
                unlocked: false,
                prerequisites: ['unlock_number_6'],
                pos: { x: 920, y: 420},
                icon: '7',
                effect: { type: 'unlockNumber', target: '7', amount: 1 }
            },
            unlock_number_8: {
                id: 'unlock_number_8',
                name: 'Unlock Number 8',
                description: 'Unlock the number 8 for use in your production equations.',
                cost: new Decimal(10000),
                unlocked: false,
                prerequisites: ['unlock_number_7'],
                pos: { x: 1040, y: 420},
                icon: '8',
                effect: { type: 'unlockNumber', target: '8', amount: 1 }
            },
            unlock_number_9: {
                id: 'unlock_number_9',
                name: 'Unlock Number 9',
                description: 'Unlock the number 9 for use in your production equations.',
                cost: new Decimal(50000),
                unlocked: false,
                prerequisites: ['unlock_number_8'],
                pos: { x: 1160, y: 420},
                icon: '9',
                effect: { type: 'unlockNumber', target: '9', amount: 1 }
            }
        },
        selectedNode: null // track which node detail panel is showing
    }

    Game.applyResearchEffect = function(node) {
        if (!node || !node.effect) return;
        const e = node.effect;
        switch (e.type) {
            case 'unlockIncrementor':
                if (Game.incrementors[e.target]) {
                    Game.incrementors[e.target].maxUses = (Game.incrementors[e.target].maxUses || 0) + (e.amount || 1);
                }
                break;
            case 'unlockNumber':
                if (Game.numbers[e.target]) {
                    Game.numbers[e.target].maxUses = (Game.numbers[e.target].maxUses || 0) + (e.amount || 1);
                }
                break;
            case 'increaseCap':
                try {
                    Game.mpsCap = Game.mpsCap.plus(e.amount);
                } catch (err) {
                    // fallback if amount isn't Decimal
                    Game.mpsCap = Game.mpsCap.plus(new Decimal(e.amount));
                }
                break;
            default:
                return; // unknown effect type
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

        // create SVG layer for connectors
        let svg = document.getElementById('researchConnectors');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'researchConnectors';
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '1200px';
            svg.style.height = '800px';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '0';
            container.parentElement.insertBefore(svg, container);
        }
        svg.innerHTML = ''; // clear connectors

        // draw connectors between nodes and their prerequisites
        // Connectors should end at the left anchor (left edge center) of the target node
        for (const key in Game.research.nodes) {
            const node = Game.research.nodes[key];
            if (!node.prerequisites || node.prerequisites.length === 0) continue;
            const nodeSize = 96;

            // target anchor: left edge, vertically centered
            const targetX = (node.pos?.x || 50);
            const targetY = (node.pos?.y || 50) + nodeSize / 2;

            node.prerequisites.forEach(preId => {
                const preNode = Game.research.nodes[preId];
                if (!preNode) return;

                // source anchor: right edge, vertically centered (origin of the arrow)
                const sourceX = (preNode.pos?.x || 50) + nodeSize + 5; // right edge
                const sourceY = (preNode.pos?.y || 50) + nodeSize / 2;

                // draw line from source center to target left-anchor
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', sourceX);
                line.setAttribute('y1', sourceY);
                line.setAttribute('x2', targetX);
                line.setAttribute('y2', targetY);
                line.setAttribute('stroke', 'rgba(255,255,255,0.2)');
                line.setAttribute('stroke-width', '2');
                svg.appendChild(line);

                // draw arrowhead with tip at the target anchor
                const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
                const arrowSize = 8;
                const tipX = targetX;
                const tipY = targetY;
                const points = [
                    [tipX, tipY],
                    [tipX - arrowSize * Math.cos(angle - Math.PI / 6), tipY - arrowSize * Math.sin(angle - Math.PI / 6)],
                    [tipX - arrowSize * Math.cos(angle + Math.PI / 6), tipY - arrowSize * Math.sin(angle + Math.PI / 6)]
                ];
                arrow.setAttribute('points', points.map(p => p.join(',')).join(' '));
                arrow.setAttribute('fill', 'rgba(255,255,255,0.2)');
                svg.appendChild(arrow);
            });
        }

        // render nodes as icon boxes
        for (const key in Game.research.nodes) {
            const node = Game.research.nodes[key];

            const box = document.createElement('div');
            box.className = 'research-node';
            box.style.position = 'absolute';
            box.style.width = '96px';
            box.style.height = '96px';
            box.style.left = (node.pos?.x || 50) + 'px';
            box.style.top = (node.pos?.y || 50) + 'px';
            box.style.border = '3px solid';
            box.style.borderRadius = '12px';
            box.style.display = 'flex';
            box.style.alignItems = 'center';
            box.style.justifyContent = 'center';
            box.style.fontSize = '48px';
            box.style.fontWeight = 'bold';
            box.style.cursor = 'pointer';
            box.style.transition = 'all 0.2s';
            box.style.zIndex = '1';
            box.style.userSelect = 'none';

            // determine state and colors
            const avail = Game.canBuyResearch(node);
            if (node.unlocked) {
                box.style.background = 'linear-gradient(135deg, rgba(100,200,100,0.3), rgba(50,150,50,0.3))';
                box.style.borderColor = 'rgba(100,255,100,0.8)';
                box.style.color = 'rgba(200,255,200,0.9)';
            } else if (avail.canBuy) {
                box.style.background = 'linear-gradient(135deg, rgba(100,150,255,0.3), rgba(50,100,200,0.3))';
                box.style.borderColor = 'rgba(100,150,255,0.8)';
                box.style.color = 'rgba(200,220,255,0.9)';
            } else {
                box.style.background = 'linear-gradient(135deg, rgba(80,80,80,0.3), rgba(40,40,40,0.3))';
                box.style.borderColor = 'rgba(100,100,100,0.5)';
                box.style.color = 'rgba(120,120,120,0.6)';
            }


            // icon (text placeholder or future SVG)
            box.innerText = Game.isResearchNodeHidden(node)
                ? "?"
                : node.icon || '??';

            // click to show detail panel
            box.addEventListener('click', function() {
                Game.research.selectedNode = node.id;
                Game.renderResearchDetail();
            });

            // hover effect
            box.addEventListener('mouseenter', function() {
                if (!node.unlocked) box.style.transform = 'scale(1.05)';
            });
            box.addEventListener('mouseleave', function() {
                box.style.transform = 'scale(1)';
            });

            container.appendChild(box);
        }

        // render detail panel if a node is selected
        Game.renderResearchDetail();
    }

    Game.isResearchNodeHidden = function(node) {
        let q = false;
        for (let pre of node.prerequisites) {
            const pnode = Game.research.nodes[pre];
            if (!pnode || !pnode.unlocked) {
                q = true;
            }
        }

        return q;
    }

    Game.renderResearchDetail = function() {
        let panel = document.getElementById('researchDetailPanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'researchDetailPanel';
            panel.style.position = 'fixed';
            panel.style.right = '20px';
            panel.style.top = '20px';
            panel.style.width = '280px';
            // constant height matching viewport height minus margins
            const viewportHeight = window.innerHeight; // matches #researchViewport height from CSS
            const topMargin = 20; // top position
            const bottomMargin = 40; // space from bottom
            panel.style.height = `${viewportHeight - bottomMargin}px`;
            panel.style.padding = '16px';
            panel.style.background = 'var(--panel-bg-color, #222)';
            panel.style.border = '2px solid var(--black-accent-color)';
            panel.style.borderRadius = '8px';
            panel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
            panel.style.zIndex = '1000';
            panel.style.display = 'none';
            panel.style.overflowY = 'auto';
            panel.style.boxSizing = 'border-box';
            document.body.appendChild(panel);
        }

        if (!Game.research.selectedNode) {
            panel.style.display = 'none';
            return;
        }

        const node = Game.research.nodes[Game.research.selectedNode];
        if (!node) {
            panel.style.display = 'none';
            return;
        }

        panel.style.display = 'block';
        panel.innerHTML = '';

        // close button
        const closeBtn = document.createElement('button');
        closeBtn.innerText = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '8px';
        closeBtn.style.right = '8px';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'var(--text-color)';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.addEventListener('click', function() {
            Game.research.selectedNode = null;
            Game.renderResearchDetail();
        });
        panel.appendChild(closeBtn);
        
        const isHidden = Game.isResearchNodeHidden(node);


        const title = document.createElement('h3');
        title.innerText = isHidden ? "Unknown" : node.name;
        title.style.margin = '0 0 12px 0';
        panel.appendChild(title);

        const desc = document.createElement('p');
        desc.innerText = isHidden ? "Research the prior node to unlock details" : node.description;
        desc.style.margin = '0 0 12px 0';
        desc.style.fontSize = '0.9em';
        panel.appendChild(desc);

        const cost = document.createElement('p');
        cost.innerText = isHidden ? "" : 'Cost: ' + notation.biNotation(node.cost, 2);
        cost.style.margin = '0 0 12px 0';
        cost.style.fontWeight = '600';
        panel.appendChild(cost);

        const avail = Game.canBuyResearch(node);
        if (node.unlocked) {
            const status = document.createElement('p');
            status.innerText = '✓ Unlocked';
            status.style.color = 'rgba(100,255,100,0.9)';
            status.style.fontWeight = '600';
            panel.appendChild(status);
        } else {
            if (avail.reason === 'prerequisites') {
                const missing = avail.missing.map(id => (Game.research.nodes[id] 
                    ? Game.isResearchNodeHidden(Game.research.nodes[id]) 
                        ? "Unknown"
                        : Game.research.nodes[id].name
                    : id));
                const status = document.createElement('p');
                status.innerText = 'Requires: ' + missing.join(', ');
                status.style.color = 'rgba(255,200,100,0.9)';
                status.style.fontSize = '0.85em';
                panel.appendChild(status);
            }

            const btn = document.createElement('button');
            btn.innerText = 'Purchase';
            btn.style.width = '100%';
            btn.style.padding = '10px';
            btn.style.marginTop = '8px';
            btn.style.fontSize = '1em';
            btn.style.fontWeight = '600';
            btn.style.cursor = avail.canBuy ? 'pointer' : 'not-allowed';
            btn.disabled = !avail.canBuy;
            if (avail.canBuy) {
                btn.style.background = 'linear-gradient(135deg, rgba(100,150,255,0.6), rgba(50,100,200,0.6))';
                btn.style.color = 'white';
            }
            btn.addEventListener('click', function() {
                Game.buyResearch(node.id);
            });
            panel.appendChild(btn);
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
        Game.renderResearchDetail();
        Game.updateVisuals();
    }

    Game.init = function() {
        Game.loadTheme(Game.settings.theme.value);
        Game.money = new Decimal(1);
        Game.mpsCap = new Decimal(1);
        Game.timers['GameLoop'] = Game.addTimer(Game.settings.framerate.value, Game.loop);
        Game.currentPage = "home";

        for (let btn of document.getElementsByClassName("menuButton")) {
            btn.addEventListener("click", function() {
                Game.currentPage = this.id.replace("Button", "");
            });
        }


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