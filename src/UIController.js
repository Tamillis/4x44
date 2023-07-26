export default class UIController {

    update(entities) {
        //clear old UI
        let ui = document.getElementById("actions");
        while(ui.firstChild) {
            ui.removeChild(ui.firstChild);
        }

        //make appropriate UI for the actions of each entity
        entities.forEach(e => {
            this.makeEntityHeader(e.type);
            e.actions.forEach( a => {
                this.makeButton(a);
            });
        });
    }

    makeEntityHeader(name) {
        let label = document.createElement("h4");
        let labelText = document.createTextNode(name);
        label.appendChild(labelText);
        document.getElementById("actions").appendChild(label);
    }

    makeButton(action) {
        let btn = document.createElement("button");
        let label = document.createTextNode(action);
        btn.appendChild(label);
        btn.onclick = () => alert(`Boo! ${action}'ed...`);
        btn.classList.add("btn");

        document.getElementById("actions").appendChild(btn);
    }
}