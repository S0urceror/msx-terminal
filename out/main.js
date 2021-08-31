"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var terminal_kit_1 = require("terminal-kit");
var SerialPort = require("serialport");
var serial;
terminal_kit_1.terminal.on('key', function (name, matches, data) {
    // Detect CTRL-C and exit 'manually'
    if (name === 'CTRL_X') {
        terminal_kit_1.terminal.fullscreen(false);
        process.exit();
    }
    if (name === 'CTRL_C')
        serial.write('\x03');
    if (name === 'CTRL_S')
        serial.write('\x13');
    if (name === 'CTRL_T' || name === 'CTRL_F8' || name === 'CTRL_SHIFT_F8') // will be CTRL-STOP
        serial.write('\x14');
    if (name === 'CTRL_O' || name === 'F8') // will be STOP
        serial.write('\x0f');
    if (name === 'CTRL_Z')
        serial.write('\x1a');
    if (name === 'ESCAPE')
        serial.write('\x1B');
    if (name === 'TAB')
        serial.write('\x09');
    if (name === 'ENTER')
        serial.write('\r');
    if (name === 'HOME')
        serial.write('\x0B');
    //if (name === 'END' )
    //    serial.write ('\x0E');
    if (name === 'BACKSPACE') {
        serial.write('\x08');
        //terminal.move (-1,0);
        //terminal.delete (1);
    }
    if (name === 'RIGHT')
        serial.write('\x1C');
    if (name === 'LEFT')
        serial.write('\x1D');
    if (name === 'UP') {
        if (positional_mode)
            serial.write('\x1E');
    }
    if (name === 'DOWN') {
        if (positional_mode)
            serial.write('\x1F');
    }
    if (name === 'PAGE_UP') {
        positional_mode = true;
        clearScreen();
    }
    if (name === 'PAGE_DOWN') {
        positional_mode = false;
        clearScreen();
    }
    if (name === 'DELETE')
        serial.write('\x7f');
    if (data.isCharacter)
        serial.write(name);
});
var charsToSkip = 0;
var positional_mode = false;
var connected = false;
var escape_signaled = false;
function openMSXSerial(value, index, array) {
    if (value.serialNumber != "20210701")
        return;
    // we get here when we find the MSXUSB port
    serial = new SerialPort(value.path, function (error) {
        if (error) {
            connected = false;
            clearScreen();
        }
    });
    serial.on('open', function (data) {
        connected = true;
        clearScreen();
    });
    serial.on('data', function (data) {
        terminal_kit_1.terminal.bgBlue();
        terminal_kit_1.terminal.white();
        data.forEach(function (value, index, array) {
            if (charsToSkip == 0) {
                if (escape_signaled) {
                    switch (array[index]) {
                        case 0x59: // set cursor coordinates
                            if (positional_mode)
                                terminal_kit_1.terminal.moveTo(array[index + 2] - 31, array[index + 1] - 31 + 1);
                            charsToSkip = 2;
                            break;
                        case 0x78:
                            switch (array[index + 1]) {
                                case 0x34: // cursor full size
                                    break;
                                case 0x35: // hide cursor
                                    //terminal.hideCursor (false);
                                    break;
                            }
                            charsToSkip = 1;
                            break;
                        case 0x79:
                            switch (array[index + 1]) {
                                case 0x34: // cursor half size
                                    break;
                                case 0x35: // show cursor
                                    //terminal.hideCursor(true);
                                    break;
                            }
                            charsToSkip = 1;
                            break;
                        default:
                            break;
                    }
                    escape_signaled = false;
                }
                else {
                    switch (value) {
                        case 0x08: // Backspace
                            terminal_kit_1.terminal.left(1).delete(1);
                            break;
                        case 0x0b: // HOME
                            if (positional_mode)
                                terminal_kit_1.terminal.moveTo(1, 2);
                            break;
                        case 0x0c: // CLS
                            clearScreen();
                            break;
                        case 0x1b: // ESC
                            escape_signaled = true;
                            break;
                        case 0x1c: // right
                            terminal_kit_1.terminal.move(1, 0);
                            break;
                        case 0x1d: // left
                            terminal_kit_1.terminal.move(-1, 0);
                            break;
                        case 0x1e: // up
                            if (positional_mode)
                                terminal_kit_1.terminal.move(0, -1);
                            break;
                        case 0x1f: // down
                            if (positional_mode)
                                terminal_kit_1.terminal.move(0, 1);
                            break;
                        case 0x7f: // DELete
                            terminal_kit_1.terminal.delete(1).left(1);
                            break;
                        case 0x5e:
                            terminal_kit_1.terminal("^^");
                            break;
                        default:
                            terminal_kit_1.terminal(String.fromCharCode(value));
                            break;
                    }
                }
            }
            else
                charsToSkip--;
        });
    });
}
function clearScreen() {
    terminal_kit_1.terminal.bgBlue();
    terminal_kit_1.terminal.white();
    terminal_kit_1.terminal.clear();
    terminal_kit_1.terminal.moveTo(1, 1).bgWhite.blue("MSXUSB terminal - press CTRL-X to exit                                          ");
    if (positional_mode)
        terminal_kit_1.terminal.moveTo(63, 1).bgWhite.blue("POS");
    else
        terminal_kit_1.terminal.moveTo(63, 1).bgWhite.blue("REL");
    if (connected)
        terminal_kit_1.terminal.moveTo(67, 1).bgWhite.blue("CONNECTED");
    else
        terminal_kit_1.terminal.moveTo(67, 1).bgWhite.blue("DISCONNECTED");
    terminal_kit_1.terminal.moveTo(1, 2);
}
function init() {
    terminal_kit_1.terminal.windowTitle("MSXUSB terminal");
    terminal_kit_1.terminal.fullscreen(true);
    clearScreen();
    terminal_kit_1.terminal.grabInput(null);
    SerialPort.list().then(function (ports) { return ports.forEach(openMSXSerial); }, function (err) { return console.error(err); });
}
init();
//# sourceMappingURL=main.js.map