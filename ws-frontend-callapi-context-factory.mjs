
import { create_callapi                     } from './callapi.mjs' ;
import { websocket_callapi_handler          } from './ws-callapi.mjs' ;
import { await_websocket, create_websocket, } from 'ws-tether/ws-utils.mjs' ;
import { createContext as createCallapiContext } from './ws-callapi-context-factory.mjs' ;

export async function createContext( nargs ) {
  const websocket = create_websocket( nargs.websocket );
  const context   = createCallapiContext({
    ...nargs,
    websocket,
  });
  await await_websocket( websocket );
  return { context };
}

