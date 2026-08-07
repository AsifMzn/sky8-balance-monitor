const fs = require("fs");

const FILE = "state.json";

function loadState() {

    if (!fs.existsSync(FILE)) {

        return {
            P1:false,
            R1:false
        };
    }

    return JSON.parse(
        fs.readFileSync(FILE)
    );
}

function saveState(state){

    fs.writeFileSync(
        FILE,
        JSON.stringify(state,null,4)
    );
}

module.exports = {
    loadState,
    saveState
};