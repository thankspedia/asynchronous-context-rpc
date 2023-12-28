import { AsyncContext }           from 'asynchronous-context' ;
import { set_typesafe_tags }      from 'runtime-typesafety' ;
import {  METHOD_POST }           from 'asynchronous-context-rpc/http-middleware' ;

import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

class Hello extends AsyncContext {
  hello = p({
    world : p({
      foo : p({
        bar : p({
          baz : p(async (...args)=>{
            this.send_ws_message({
              message : [ 'okay', ...args ],
            });
          }),
        }),
      }),
    }),
  });
}

Hello.defineMethod(
  async function how_are_you(a,b,c) {
    /*
     * See `ws-backend-respapi.js`.
     * (Fri, 16 Jun 2023 14:01:43 +0900)
     */

    this.logger.output( 'yes, how_are_you', this.frontend );

    await this.frontend.fine_thank_you( a+1, b+1, c+1 );

    return 'called how_are_you()';
  },
  METHOD_POST,
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);


const state = {
  contexts : [],
}

Hello.defineMethod(
  async function on_open(nargs) {
    console.log( `Event Handler 'Hello.on_open' was called` );
    const {websocket,event_name} = nargs;
    this.__websocket = websocket;
    state.contexts.push( this );

    console.log('Hello.on_open Event Handler', { 'self':this, event_name, state } );
  },
  'WEBSOCKET_METHOD',
  'WEBSOCKET_EVENT_HANDLER',
  {
    unprotected_input : true,
    unprotected_output : true,
  }
);

Hello.defineMethod(
  async function on_close(nargs) {
    console.log( `Event Handler 'Hello.on_close' was called` );
    const { websocket, event_name } = nargs;
    state.contexts = state.contexts.filter(e=> e !== this );
    console.log( 'Hello.on_close Event Handler', { 'self':this, event_name, state } );
  },
  'WEBSOCKET_METHOD',
  'WEBSOCKET_EVENT_HANDLER',
  {
    unprotected_input : true,
    unprotected_output : true,
  }
);



function createContext() {
  return Hello.create();
}

let flg_readline_created = false;

if ( ! flg_readline_created ) {
  flg_readline_created = true;
  (async()=>{
    const rl = readline.createInterface({ input, output });
    for(;;) {
      const answer = await rl.question('Input a message or "quit".');
      if ( answer.trim().toLowerCase() === 'quit' ) {
        return;
      }

      state.contexts.map( (context)=>{
        console.log( 'context.frontend', context.frontend );
        /*await*/ context.frontend.poke( {message: answer, info:'foo'}, 'foo' );
      });

    }
  })();
}

export { createContext };

