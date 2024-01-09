import React from "react";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Hello } from './ws.js';

import { useWebSocketTether } from 'ws-tether/hook';
import { createContext } from 'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;
import {
  handle_event_of_ws_frontend,
  handle_on_message_of_ws_frontend_respapi
} from "asynchronous-context-rpc/ws-frontend-respapi";

function App() {
  const [count, setCount] = React.useState(0);

  const contexts = useWebSocketTether({
    url : 'ws://schizostylis.local:3632/foo',
    interval : 3000,
    on_initialization : function() {
      console.log( 'App', 'on_initialization' );
      this.frontendContext = Hello.create();
    },
    on_finalization : function() {
      console.log( 'App', 'on_finalization' );
    },
    on_open : async function () {
      console.log( 'App', 'on_open' );
      try {
        console.log( 'WebSocket', 'opened' );

        const { context:backendContext } =  await createContext({
          websocket : this.websocket,
          logger    : this.frontendContext.logger,
        });

        console.log( '[ws-reconnector] proc 2' , backendContext );

        this.backendContext = backendContext;

        console.log( '[ws-reconnector] proc 3' , this.frontendContext );

        this.frontendContext.backend   = this.backendContext;
        this.frontendContext.websocket = this.websocket;

        try {
          await handle_event_of_ws_frontend({
            event_name         : 'open',
            event_handler_name : 'on_open',
            context            : this.frontendContext,
            websocket          : this.websocket,
          });
        } catch (e) {
          console.error(e);
        }

        // try {
        //   on_init_websocket_of_ws_frontend_respapi( websocket, this.frontendContext );
        // } catch (e) {
        //   console.error(e);
        // }
      } catch ( e ){
        console.error( 'ws-reconnector.proc() error' , e );
      }
    },

    on_close : async function() {
      console.log( 'App', 'on_close' );

      try {
        await handle_event_of_ws_frontend({
          event_name         : 'close',
          event_handler_name : 'on_close',
          context            : this.frontendContext,
          websocket          : this.websocket,
        });
      } catch ( e ) {
        console.error('handle_event_of_ws_frontend on_close threw an error. ignored. ', e);
      }

      // this.websocket = null;
      this.frontendContext.backend = null
      this.frontendContext.websocket = null
    },

    on_message : async function( message ) {
      console.log( 'App', 'on_message' );
      return handle_on_message_of_ws_frontend_respapi({
        context : this.frontendContext,
        websocket : this.websocket,
        message,
      });
    },

    on_error : function (...args) {
      console.log( 'App', 'on_error' );
      console.error( ...args );
    },
  });

  async function handleClick() {
    try {
      alert( 'before' );
      alert( 'how are you' + ':' +  await contexts.backendContext.how_are_you(1,2,3) );
      alert( 'after' );
    } catch (e){
      console.error(e);
      alert('error');
      alert(e);
    }
  }

  return (
    <>
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={ handleClick }>Start</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
