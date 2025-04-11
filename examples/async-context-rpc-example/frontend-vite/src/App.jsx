import React from "react";
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Hello } from './ws.js';
import { WebSocketReconnector } from 'ws-tether/ws-reconnector';
// import {hello} from './hello.mjs';


function App() {
  const [count, setCount] = React.useState(0)

  const ref = React.useRef( new WebSocketReconnector( Hello.create(), 'ws://schizostylis.local:3632/foo', 3000 ) );
  async function handleClick() {
    try {
      alert( 'before' );
      alert( 'ref.current', ref.current );
      alert( 'how are you' + ':' +  await ref.current.backendContext.how_are_you(1,2,3) );
      alert( 'after' );
    } catch (e){
      console.error(e);
      alert( 'error' );
      alert( e );
    }
  }

  React.useEffect(()=>{
    console.log( '***** MOUNTED ******', ref.current.id );
    ref.current.initialize();
    return ()=>{
      console.log( '***** UMOUNTED ******', ref.current.id );
      ref.current.finalize();
    };
  });

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
