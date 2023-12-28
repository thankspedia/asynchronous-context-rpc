
// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
import { filenameOfSettings } from 'asynchronous-context/settings' );
import { dotenvFromSettings } from 'asynchronous-context/env';

import assert from  'node:assert/strict' ;
import  { test, describe, it, before, after }  from 'node:test' ;
import  { spawn } from 'node:child_process' ;
import  { AsyncContext } from 'asynchronous-context' ;
import  { METHOD_POST  } from 'asynchronous-context-rpc' ;

import  { create_callapi } from 'asynchronous-context-rpc/callapi.js' ;
import  { websocket_callapi_handler } from 'asynchronous-context-rpc/ws-callapi' ;
import  { create_websocket, await_websocket, await_sleep } from 'asynchronous-context-rpc/ws-utils' ;
import  { set_typesafe_tags } from 'runtime-typesafety' ;

import  {
 t_handle_message,
 t_respapi_message,
 handle_on_message_of_ws_frontend,
 on_init_websocket_of_ws_frontend_respapi,
} from 'asynchronous-context-rpc/ws-frontend-respapi.js' ;


filenameOfSettings( './ws-frontend-respapi-test.settings.json' );
dotenvFromSettings();

// Object.assign( require('util').inspect.defaultOptions, {
//   depth  : null,
//   colors : false,
//   showHidden : false,
//   maxStringLength : Infinity,
//   // compact: false,
//   // breakLength: 1000,
// });
//
const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));

let service = null;

function p(o) {
  return set_typesafe_tags( o, 'WEBSOCKET_METHOD' );
}

describe( async ()=>{

  await before( async ()=>{
    console.warn('BEFORE');
    try {
      service = spawn( 'start-ws-service', {
        // detached:true,
        shell:false,
        env: Object.assign({},process.env,{})
      });
      service.stdout.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, 'stdout >> ' ) );
      });
      service.stderr.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, 'stderr >> ' ) );
      });
    } catch (e) {
      console.error(e);
    }

    await sleep( 1000 );
    console.error( 'BEFORE', service != null );
    await sleep( 1000 );
  });

  await after(  async ()=>{
    console.warn('AFTER');
    try{
      service.kill();
      service.unref();
      console.error( 'DISCONNECTED', service.pid );
    } catch(e){
      console.error(e);
    }
    await sleep( 1000 );
  });

  await it('as test1', async()=>{
    let flag_succeded = false;

    class Hello extends AsyncContext {
      constructor(event_handlers){
        super();
        this.event_handlers = event_handlers;
      }
    }

    Hello.defineMethod(
      async function fine_thank_you(...args) {
        console.log( 'hooray!' , ...args );
        flag_succeded = true;
        websocket.close();
        // test_state.__service.shutdown();
        // await this.backend.how_are_you(...args);
      },
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );

    Hello.defineMethod(
      async function start() {
        await this.backend.how_are_you(1,2,3);
      },
      'WEBSOCKET_METHOD',
      {
        unprotected_output : true,
      }
    );

    const websocket = create_websocket( 'ws://localhost:3632/foo' );

    const context = Hello.create();
    context.backend = create_callapi({
      callapi_handler : websocket_callapi_handler,
      websocket,
    });

    on_init_websocket_of_ws_frontend_respapi( websocket, context );
    await await_websocket( websocket );

    await context.start();
    await await_sleep( 1000 );

    assert.ok( flag_succeded, 'failed' );

    console.log( 'websocket.close()');

    try {
      console.log( 'shutdown1' );
      websocket.close();
    } catch ( e) {
      console.log(e);
    }

    try {
      console.log( 'shutdown2' );
      // test_state.__service.shutdown();
    } catch ( e) {
      console.log(e);
    }

  });


//  it('as test2', async()=>{
//    const p = new Promise( async (resolve,reject)=>{
//      const { context } = await on_init_websocket_of_ws_frontend_respapi();
//      const websocket = (await context.websocket() );
//      const close = ()=>websocket.close();
//
//      websocket.on( 'message', ( data )=>{
//        const v = JSON.parse( data.toString() );
//        console.log( 'hJGqsnbq5A4', v );
//        if ( v.message.join(',') === 'okay,hello,world,foo' ) {
//          resolve(v);
//        } else {
//          reject(v);
//        }
//        close();
//      });
//
//      setTimeout( ()=>{
//        reject('timeout')
//        close();
//      }, 1000 );
//
//      await (context.hello.world.foo.bar.baz( 'hello','world','foo' ));
//    });
//
//    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
//    return await p;
//  });

});
