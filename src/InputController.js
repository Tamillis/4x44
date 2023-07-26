export default class InputController {
    constructor(screen, board, engine, keyMap = null) {
        this.screen = screen;
        this.engine = engine;
        this.board = board;
        this.debug = false;

        if (keyMap == null) {
            this.movementKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "RMB"];
            this.zoomInKey = "+";
            this.zoomOutKey = "-";
            this.selectKey = "LMB";
            this.resetKey = "r";
            this.discoverAllKey = "f";
        }
        else {
            //map keys from an externally provided JSON, for future key customisation
            //reference https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#device_keys for key codes additionally with LMB MMB RMB 4MB 5MB
            Object.keys(keyMap).forEach(k => {
                this[k] = keyMap[k];
            });
        }
    }

    doInput(keyCode, mx = null, my = null) {
        //movement & zoom input
        if (this.movementKeys.includes(keyCode)) this.screen.input(keyCode);
        if (keyCode == this.zoomInKey || keyCode == this.zoomOutKey) this.screen.input(keyCode);
        
        //engine input
        if (this.selectKey == keyCode) {
            let { x, y } = this.screen.pxToBoardCoords(mx, my);
            this.engine.select(this.board.grid, x, y);
        }
        else if (this.discoverAllKey == keyCode && this.debug) {
            this.board.discoverAll();
        }

        this.screen.rerender(this.board.grid, this.engine.entities);
    }

    getKeyCode(input, isMouse) {
        //a simple mapper turning keys and mouse clicks into string results I can use uniformly.
        if (isMouse) {
            switch (input) {
                case 0:
                    return "LMB";
                case 1:
                    return "MMB";
                case 2:
                    return "RMB";
                case 3:
                    return "4MB";
                case 4:
                    return "5MB";
                default:
                    return "NotKey";
            }
        }
        else return input;
    }

    handleInput(input, isMouse = false, mx = null, my = null) {
        let keyCode = this.getKeyCode(input, isMouse);
        if (keyCode == "NotKey") console.error("Mouse button not found.");
        else this.doInput(keyCode, mx, my);
    }
}