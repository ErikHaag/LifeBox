const stateInput = document.getElementById("states");
const reflectInput = document.getElementById("reflections");
const neighborhoodInput = document.getElementById("neighborhoods");
const ruleInput = document.getElementById("rules");
const compileButton = document.getElementById("compile");
const horizontalConnection = document.getElementById("horizontal");
const verticalConnection = document.getElementById("vertical");
const board = document.getElementById("board");
const modeSelect = document.getElementById("mode");
const controlPanel = document.getElementById("controls");
const stepButton = document.getElementById("step");
let boardSelect = document.querySelectorAll("td>select");

let w = 15;
let h = 15;
let states = new Map();
let reflect = new Map();
let neighborhood = new Map();
let rules = new Map();
let field = [];
let stateNames = [];
let timer;

let mode = "edit";

stateInput.addEventListener("input", () => {resizeTextArea(stateInput);});
reflectInput.addEventListener("input", () => {resizeTextArea(reflectInput);});
neighborhoodInput.addEventListener("input", () => {resizeTextArea(neighborhoodInput);});
ruleInput.addEventListener("input", () => {resizeTextArea(ruleInput);});

compileButton.addEventListener("click", () => {
    compile();
    reset();
    modeSelect.value = "edit";
    mode = "edit";
    controlPanel.hidden = true;
    updateBoard();
});

modeSelect.addEventListener("change", () => {
    mode = modeSelect.value;
    updateBoard();
    if (mode == "edit") {
        controlPanel.hidden = true;
    } else if (mode = "run") {
        controlPanel.hidden = false;
    }
});

stepButton.addEventListener("click", () => {
    if (mode == "run") {
        step();
        updateBoard();
    }
})

function editUpdate(e) {
    let coords = e.target.className.split(",");
    let x = Number.parseInt(coords[0]);
    let y = Number.parseInt(coords[1]);
    field[y][x] = e.target.value;
    updateBoard();
}

function reset() {
    field = [];
    for (let i = 0; i < w; i++) {
        let row = [];
        for (let j = 0; j < w; j++) {
            row.push("empty");
        }
        field.push(row);
    }
}

function compile() {
    //states
    states = new Map();
    reflect = new Map();
    stateNames = [];
    let s = stateInput.value.split("\n");
    for (let i = 0; i < s.length; i++) {
        let c = s[i].split(" ");
        stateNames.push(c[0]);
        reflect.set(c[0], [c[0], c[0]]);
        switch (c.length) {
            case 2:
                states.set(c[0], { bg: "#" + c[1], char: " ", col: "#000000" });
                break;
            case 4:
                states.set(c[0], { bg: "#" + c[1], char: c[2], col: "#" + c[3] });
                break;
            default:
                // todo: error handling
                break;
        }
    }
    // reflections
    let ref = reflectInput.value.split("\n");
    for (let i = 0; i < ref.length; i++) {
        let c = ref[i].split(" ");
        let oa = reflect.get(c[0]);
        let ob = reflect.get(c[2]);
        switch (c[1]) {
            case "|":
                reflect.set(c[0], oa.toSpliced(0, 1, c[2]));
                reflect.set(c[2], ob.toSpliced(0, 1, c[0]));
                break;
            case "-":
                reflect.set(c[0], oa.toSpliced(1, 1, c[2]));
                reflect.set(c[2], ob.toSpliced(1, 1, c[0]));
                break;
            default:
                //todo: error handling
                break;
        }
    }
    // neighbors
    neighborhood = new Map();
    let n = neighborhoodInput.value.split("\n");
    for (let i = 0; i < n.length; i++) {
        let c = n[i].split(" ");
        let name = c.shift();
        let coords = [];
        for (let j = 0; j < c.length; j++) {
            coords = coords.concat(c[j].split(","));
        }
        neighborhood.set(name, coords);
    }
    // rules
    rules = new Map();
    let r = ruleInput.value.split("\n");
    for (let i = 0; i < r.length; i++) {
        let c = r[i].split(" ");
        let name = c.shift();
        let convert = c.pop();
        if (c.pop() != "->") {
            // todo error handling
            return;
        }
        let R = [c.join(" "), convert];
        let v = [];
        if (rules.has(name)) {
            v = rules.get(name);
        }
        v.push(R);
        rules.set(name, v);
    }
}

function updateBoard() {
    let table = "";
    for (let i = h - 1; i >= 0; i--) {
        table += "<tr>\n";
        for (let j = 0; j < w; j++) {
            let cell = states.get(field[i][j]);
            if (mode == "edit") {
                table += "<td><div class=\"cell\" title=\"" + j + ", " + i + ": " + field[i][j] + "\" style=\"background-color: " + cell.bg + "; color: " + cell.col + ";\" >" + cell.char + "</div><select class=\"" + j + "," + i + "\">\n";
                for (let s of stateNames) {
                    table += "<option " + (field[i][j] == s ? "selected " : " ") + "value=\"" + s + "\">" + s + "</option>\n";
                }
                table += "</select></td>\n"
                if (mode == "edit") {
                    timer = setTimeout(() => {
                        boardSelect = document.querySelectorAll("td>select");
                        for (let sel of boardSelect) {
                            sel.addEventListener("change", editUpdate);
                        }
                        clearTimeout(timer);
                    }, 10);
                }
            } else if (mode == "run") {
                table += "<td><div class=\"cell\" title=\"" + j + ", " + i + ": " + field[i][j] + "\" style=\"background-color: " + cell.bg + "; color: " + cell.col + ";\" >" + cell.char + "</div></td>\n";
            }
        }
        table += "</tr>\n"
    }
    board.innerHTML = table;
}

function move(x, y, dx, dy) {
    if (0 <= x + dx && x + dx < w && 0 <= y + dy && y + dy < h) {
        return field[y + dy][x + dx];
    } else {
        let fx = false;
        let fy = false;
        x += dx;
        while (x < 0 || x >= w) {
            switch (horizontalConnection.value) {
                case "connect":
                    if (x < 0) {
                        x += w;
                    } else if (x >= w) {
                        x -= w;
                    }
                    break;
                case "flip":
                    if (x < 0) {
                        x += w;
                        y = h - y;
                        dy *= -1;
                        fy = !fy;
                    } else if (x >= w) {
                        x -= w;
                        y = h - 1 - y;
                        dy *= -1;
                        fy = !fy;
                    }
                    break;
                case "unconnect":
                default:
                    if (x < 0 || x >= w) return "empty";
            }
        }
        y += dy;
        while (y < 0 || y >= h) {
            switch (verticalConnection.value) {
                case "connect":
                    if (y < 0) {
                        y += h;
                    } else if (y >= h) {
                        y -= h;
                    }
                    break;
                case "flip":
                    if (y < 0) {
                        y += h;
                        x = w - 1 - x;
                        fx = !fx;
                    } else if (y >= h) {
                        y -= h;
                        x = w - 1 - x;
                        fx = !fx;
                    }
                    break;
                case "unconnect":
                default:
                    if (y < 0 || y >= h) return "empty";
            }
        }
        let o = field[y][x];
        if (fy) o = reflect.get(o)[1];
        if (fx) o = reflect.get(o)[0];
        return o;
    }
}

function getNeighborhoodCounts(x, y, n) {
    let N = neighborhood.get(n);
    let counts = new Map();
    for (s of states.keys()) {
        counts.set(s, 0);
    }
    for (let i = 0; 2 * i < N.length; i++) {
        let v = move(x, y, Number.parseInt(N[2 * i]), Number.parseInt(N[2 * i + 1]));
        counts.set(v, counts.get(v) + 1);
    }
    return counts;
}

function step() {
    let newField = [];
    for (let i = 0; i < h; i++) {
        let row = []
        for (let j = 0; j < w; j++) {
            let s = field[i][j];
            let transitions = rules.get(s);
            let newState = s;
            for (var k = 0; k < transitions.length; k++) {
                if (testRule(j, i, transitions[k][0])) {
                    newState = transitions[k][1];
                    break;
                }
            }
            row.push(newState);
        }
        newField.push(row);
    }
    field = newField;
}

function testRule(x, y, r) {
    if (r.length == 0) return true;
    let subrules = r.split(" AND ");
    for (let i = 0; i < subrules.length; i++) {
        let subrule = subrules[i].split(" ");
        switch (subrule[0]) {
            case "count":
                if (subrule[1] == "==") {
                    if (getNeighborhoodCounts(x, y, subrule[4]).get(subrule[3]) != Number.parseInt(subrule[2])) return false;
                } else if (subrule[1] == ">=") {
                    if (getNeighborhoodCounts(x, y, subrule[4]).get(subrule[3]) < Number.parseInt(subrule[2])) return false;
                } else if (subrule[1] == "<=") {
                    if (getNeighborhoodCounts(x, y, subrule[4]).get(subrule[3]) > Number.parseInt(subrule[2])) return false;
                }
                break;
            case "where":
                if (move(x, y, Number.parseInt(subrule[1]), Number.parseInt(subrule[2])) != subrule[3]) return false;
                break;
            case "NOT":
                switch (subrule[1]) {
                    case "count":
                        if (subrule[2] == "==") {
                            if (getNeighborhoodCounts(x, y, subrule[5]).get(subrule[4]) == Number.parseInt(subrule[3])) return false;
                        } else if (subrule[2] == ">=") {
                            if (getNeighborhoodCounts(x, y, subrule[5]).get(subrule[4]) >= Number.parseInt(subrule[3])) return false;
                        } else if (subrule[2] == "<=") {
                            if (getNeighborhoodCounts(x, y, subrule[5]).get(subrule[4]) <= Number.parseInt(subrule[3])) return false;
                        }
                        break;
                    case "where":
                        if (move(x, y, Number.parseInt(subrule[2]), Number.parseInt(subrule[3])) == subrule[4]) return false;
                        break;
                    default:
                        break;
                }
                break;
            default:
                return false;
        }
    }
    return true;
}

function resizeTextArea(element) {
    let lines = element.value.split("\n");
    let height = Math.max(lines.length + 1, 2);
    let width = Math.max(Math.max(...lines.map((x) => x.length)) + 5, 10);
    element.style.width = width + "ch";
    element.style.height = height + "lh";
}

resizeTextArea(stateInput);
resizeTextArea(reflectInput);
resizeTextArea(neighborhoodInput);
resizeTextArea(ruleInput);