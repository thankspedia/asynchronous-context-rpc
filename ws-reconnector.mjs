
import React from 'react';
import  {
 on_init_websocket_of_ws_frontend_respapi,
} from 'asynchronous-context-rpc/ws-frontend-respapi.mjs' ;
import { respapi } from './respapi.mjs';

import { create_websocket, await_websocket, await_sleep } from 'asynchronous-context-rpc/ws-utils' ;

import { createContext } from  'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;





async function handle_on_event_of_ws_frontend_respapi( nargs ) {
  const {
    event_name         = ((name)=>{throw new Error(`${name} is not defined`)})('event_name'),
    event_handler_name = ((name)=>{throw new Error(`${name} is not defined`)})('event_handler_name'),
    context            = ((name)=>{throw new Error(`${name} is not defined`)})('context'),
    websocket          = ((name)=>{throw new Error(`${name} is not defined`)})('websocket'),
  } = nargs;

  console.log('LOG','handle_on_event_of_ws_frontend_respapi');

  /*
   * Call the specified event handler on the context object.
   */
  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      // message.command_value.method_path,
      [event_handler_name],

      /* http-method as TAGS */
      'WEBSOCKET_EVENT_HANDLER',

      /* on_execution */
      async ( resolved_callapi_method )=>{
        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value;
        const target_method_args = [{websocket,event_name}]; // message.command_value.method_args;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'handle_on_event_of_ws_frontend_respapi : %s', respapi_result );

};









// alert( createContext );
// const context = await createContext({ websocket: new WebSocket( 'ws://schizostylis.local:3632/foo' ) })
// alert( context );
// context.hello();
//
// alert( hello);

function createTimer( proc ) {
  function set( proc, interval ){
    return setTimeout(async ()=>{
      try {
        // BE AWARE! : proc could be an async function. (Tue, 26 Dec 2023 15:56:48 +0900)
        await proc();
      } catch (e) {
        console.error( 'createTimer', e);
      }
      if ( __running ) {
        set( proc, interval );
      }
    }, interval );
  }
  function reset( handle ) {
    clearTimeout( handle );
  }
  //------------

  let __running = false;
  let __handle =null;
  return {
    id : Math.trunc( Math.random() * 65536),
    get running() {
      return __running;
    },
    start( interval ) {
      if ( ! __running ) {
        __running = true;
        __handle = set( proc, interval );
      }
    },
    stop() {
      if ( __running ) {
        __running = false;
        reset( __handle );
        __handle = null;
      }
    }
  };
}

export class WebSocketReconnector extends EventTarget {
  id  = Math.trunc( Math.random() * 65536 );

  frontendContext = null;
  backendContext = null;
  interval = null;
  websocket = null;
  initialized = false;

  constructor(
    context = (()=>{throw new Error()})(),
    ws_url= (()=>{throw new Error()})(),
    interval = 3000
  ) {
    super();
    this.ws_url = ws_url;
    this.frontendContext = context;
    this.timer = createTimer( this.proc.bind( this ) );
    this.interval = interval;
  }

  __on_online = function () {
    console.log( 'on_online', this.id );
    this.start();
  }.bind(this);

  __on_offline = function () {
    console.log( 'on_offline', this.id );
    this.stop();
  }.bind(this);

  initialize() {
    if ( ! this.initialized ) {
      this.initialized = true;

      if ( typeof window !== 'undefined' ) {
        window.removeEventListener( 'online',  this.__on_online );
        window.removeEventListener( 'offline', this.__on_offline );
        window.addEventListener( 'online',  this.__on_online );
        window.addEventListener( 'offline', this.__on_offline );
      }

      if ( typeof navigator !== 'undefined' ) {
        if ( navigator.onLine ) {
          this.start();
        }
      } else {
        this.start();
      }
    }
  }

  finalize() {
    if ( typeof window !== 'undefined' ) {
      window.removeEventListener( 'online',  this.__on_online );
      window.removeEventListener( 'offline', this.__on_offline );
    }

    if ( typeof navigator !== 'undefined' ) {
      this.stop();
    } else {
      this.stop();
    }
    this.initialized = false;
  }

  start() {
    if ( ! this.timer.running ) {
      this.timer.start( this.interval );
    }
  }

  stop() {
    if ( this.timer.running ) {
      this.timer.stop();
    }
    if ( this.websocket !== null ) {
      this.websocket.close();
    }
    this.websocket = null;
    this.backendContext  = null;
  }

  async proc(){
    console.log( '[ws-reconnector] proc 0' , 'id ', this.id, 'timer.id' , this?.timer?.id ?? 'null' ,  '__backend', this.backendContext );

    if ( this.websocket === null ) {
      console.log( '[ws-reconnector] proc() initialize' , this.id );

      const websocket = create_websocket( this.ws_url );

      websocket.addEventListener( 'open', async()=>{
        try {
          console.log( 'WebSocket', 'opened' );

          const { context:backendContext } =  await createContext({
            websocket : this.websocket,
            logger    : this.frontendContext.logger,
          });

          console.log( '[ws-reconnector] proc 2' , backendContext );

          this.backendContext = backendContext;

          console.log( '[ws-reconnector] proc 3' , this.frontendContext );

          this.frontendContext.backend   = backendContext;
          this.frontendContext.websocket = websocket;

          try {
            await handle_on_event_of_ws_frontend_respapi({
              event_name         : 'open',
              event_handler_name : 'on_open',
              context            : this.frontendContext,
              websocket          : this.websocket,
            });
          } catch (e) {
            console.error(e);
          }

          try {
            on_init_websocket_of_ws_frontend_respapi( websocket, this.frontendContext );
          } catch (e) {
            console.error(e);
          }
        } catch ( e ){
          console.error( 'ws-reconnector.proc() error' , e );
        }
      });

      websocket.addEventListener( 'close', async ()=>{
        console.log( 'WebSocket', 'closed' );

        try {
          await handle_on_event_of_ws_frontend_respapi({
            event_name         : 'close',
            event_handler_name : 'on_close',
            context            : this.frontendContext,
            websocket          : this.websocket,
          });
        } catch ( e ) {
          console.error('handle_on_event_of_ws_frontend_respapi on_close threw an error. ignored. ', e);
        }

        this.websocket = null;
        this.frontendContext.backend = null
        this.frontendContext.websocket = null

      });

      this.websocket = websocket;
      this.dispatchEvent( new Event( 'connect', {} ) );

      await await_websocket( websocket );
    }
  }
}


export function useWebSocketContext( create_context, ws_url , interval=3000 ) {
  const ref = React.useRef( new WebSocketReconnector( create_context() , ws_url, interval ) );

  React.useEffect(()=>{
    console.log( '***** MOUNTED ******', ref.current.id );
    ref.current.initialize();
    return ()=>{
      console.log( '***** UMOUNTED ******', ref.current.id );
      ref.current.finalize();
    };
  });
  return ref.current;
}

