
import { AsyncContext   } from 'asynchronous-context' ;
import { createContext  } from 'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;
import { set_typesafe_tags } from 'runtime-typesafety' ;

// class AsyncContext {
// }

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}


export class Hello  extends AsyncContext {
  constructor(event_handlers){
    super();
    this.event_handlers = event_handlers;
    this.flag_succeded = false;
  }
}

Hello.prototype.fine_thank_you = p(
  async function fine_thank_you(...args) {
    alert('fine_thank_you');
    console.log( 'hooray!' , ...args );
    this.flag_succeded = true;
    // this.websocket.close();
    // test_state.__service.shutdown();
    // await this.backend.how_are_you(...args);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);


Hello.prototype.poke = p(
  async function poke(nargs,info) {
    console.log( 'poke!' , nargs );
    alert(nargs.message);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);

Hello.prototype.start = p(
  async function start() {
    await this.backend.how_are_you(1,2,3);
  },
  'WEBSOCKET_METHOD',
  {
    unprotected_output : true,
  }
);


