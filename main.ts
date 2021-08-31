import {terminal} from "terminal-kit"
import * as SerialPort  from 'serialport';
import { serialize } from "v8";

let serial:SerialPort;

terminal.on( 'key' , function( name , matches , data ) 
{
    // Detect CTRL-C and exit 'manually'
    if ( name === 'CTRL_X' ) 
    { 
        terminal.fullscreen (false);
        process.exit() ; 
    }
    if ( name === 'CTRL_C' )
        serial.write ('\x03');
    if ( name === 'CTRL_S' )
        serial.write ('\x13');
    if ( name === 'CTRL_T' || name === 'CTRL_F8' || name === 'CTRL_SHIFT_F8' ) // will be CTRL-STOP
        serial.write ('\x14');
    if ( name === 'CTRL_O' || name === 'F8' ) // will be STOP
        serial.write ('\x0f');
    if ( name === 'CTRL_Z' )
        serial.write ('\x1a');
    if ( name === 'ESCAPE' )
        serial.write ('\x1B');
    if ( name === 'TAB' )
        serial.write ('\x09');
    if ( name === 'ENTER' ) 
        serial.write ('\r');
    if (name === 'HOME' )
        serial.write ('\x0B');
    //if (name === 'END' )
    //    serial.write ('\x0E');
    if ( name === 'BACKSPACE' )
    {
        serial.write ('\x08');
        //terminal.move (-1,0);
        //terminal.delete (1);
    }
    if ( name === 'RIGHT' )
        serial.write ('\x1C');
    if ( name === 'LEFT' )
        serial.write ('\x1D');
    if ( name === 'UP' )
    {
        if (positional_mode)
            serial.write ('\x1E');
    }
    if ( name === 'DOWN' )
    {
        if (positional_mode)
            serial.write ('\x1F');                    
    }
    if (name === 'PAGE_UP') 
    {
        positional_mode = true;
        clearScreen ();
    }
    if (name === 'PAGE_DOWN')
    {
        positional_mode = false;
        clearScreen ();
    }
    if (name==='DELETE')
        serial.write ('\x7f');
    if (data.isCharacter)
        serial.write (name);
} ) ;

let charsToSkip:number = 0;
let positional_mode:boolean = false;
let connected:boolean = false;
let escape_signaled:boolean = false;
function openMSXSerial (value: SerialPort.PortInfo, index: number, array: SerialPort.PortInfo[])
{
    if (value.serialNumber!="20210701")
        return;
    
    // we get here when we find the MSXUSB port
    serial = new SerialPort (value.path,(error?:Error)=> {
        if (error)
        {
            connected = false;
            clearScreen();
        }
    });
    serial.on ('open', (data:any) => {
        connected = true;
        clearScreen();
    });
    serial.on ('data', (data:Buffer) => {
        terminal.bgBlue();
        terminal.white();
        data.forEach ((value:number, index:number, array: Uint8Array)=>{
            if (charsToSkip==0)
            {
                if (escape_signaled)
                {
                    switch (array[index])
                    {
                        case 0x59: // set cursor coordinates
                            if (positional_mode)
                                terminal.moveTo (array[index+2]-31,array[index+1]-31+1);
                            charsToSkip = 2;
                            break;
                        case 0x78:
                            switch (array[index+1])
                            {
                                case 0x34: // cursor full size
                                    break;
                                case 0x35: // hide cursor
                                    //terminal.hideCursor (false);
                                    break;
                            }
                            charsToSkip = 1;
                            break;
                        case 0x79:
                            switch (array[index+1])
                            {
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
                else
                {
                    switch (value)
                    {
                        case 0x08: // Backspace
                            terminal.left(1).delete(1);
                            break;
                        case 0x0b: // HOME
                            if (positional_mode)
                                terminal.moveTo (1,2);
                            break;
                        case 0x0c: // CLS
                            clearScreen ();
                            break;
                        case 0x1b: // ESC
                            escape_signaled = true;
                            break;
                        case 0x1c: // right
                            terminal.move (1,0);
                            break;
                        case 0x1d: // left
                            terminal.move (-1,0);
                            break;
                        case 0x1e: // up
                            if (positional_mode)
                                terminal.move (0,-1);
                            break;
                        case 0x1f: // down
                            if (positional_mode)
                                terminal.move (0,1);
                            break;
                        case 0x7f: // DELete
                            terminal.delete(1).left(1);
                            break;
                        case 0x5e: 
                            terminal ("^^");
                            break;
                        default:
                            terminal (String.fromCharCode (value));
                            break;
                    }
                }
            }
            else
                charsToSkip--;
        })
    });
}

function clearScreen ()
{
    terminal.bgBlue();
    terminal.white();
    terminal.clear ();
    terminal.moveTo (1,1).bgWhite.blue ("MSXUSB terminal - press CTRL-X to exit                                          ");
    if (positional_mode)
        terminal.moveTo (63,1).bgWhite.blue ("POS");
    else
        terminal.moveTo (63,1).bgWhite.blue ("REL");
    if (connected)
        terminal.moveTo (67,1).bgWhite.blue ("CONNECTED");
    else
        terminal.moveTo (67,1).bgWhite.blue ("DISCONNECTED");
    terminal.moveTo (1,2);
}

function init ()
{
    terminal.windowTitle ("MSXUSB terminal")
    terminal.fullscreen (true);
    clearScreen ();
    terminal.grabInput(null) ;

    SerialPort.list().then(
        ports => ports.forEach(openMSXSerial),
        err => console.error(err)
      )
}

init ();
