const STDOUT_LOG_ID = '[ws-backend-respapi-test.mjs] stdout >> ';
// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)

import   assert      from   'node:assert/strict'  ;
import { test, describe, it, before, after }      from   'node:test'  ;
import { spawn }     from   'node:child_process'  ;
import { WebSocket }     from   'ws'  ;

import { createSimpleSemaphore }     from  'asynchronous-context-rpc/simple-semaphore.mjs' ;
import { filenameOfSettings } from 'asynchronous-context/settings';
import { dotenvFromSettings } from 'asynchronous-context/env' ;
import "./common.mjs" ;

filenameOfSettings( 'ws-backend-respapi-test-context-factory.settings.json' );
dotenvFromSettings();

const LOG_ID = `[backend-respapi.test.mjs]`;

let testService = null;

const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));

let service = null;

const host_object = {
  foo: {
    bar : {
      hello : function( a,b ) {
      },
    },
  },
};

const filter = (v, allowed_fields =[ 'reason','status_code'])=>({
  ...v,
  value :
    Object.fromEntries(
      Object
        .entries(v.value)
        .filter( ([k,v])=>allowed_fields.includes(k)))
});

describe( 'http-middleware-test', async ()=>{
  await before( async ()=>{
    console.warn( LOG_ID, 'BEFORE');
    try {
      service = spawn( 'start-service', {
        // detached:true,
        shell:false,
        env: Object.assign({},process.env,{})
      });
      service.stdout.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, STDOUT_LOG_ID ) );
      });
      service.stderr.on('data', (data)=>{
        console.log( data.toString().trim().replaceAll( /^/gm, STDOUT_LOG_ID ) );
      });
    } catch (e) {
      console.error( LOG_ID, e);
    }

    await sleep( 1000 );
    console.error( LOG_ID,  'BEFORE', service != null );
    await sleep( 1000 );
  });

  await after(  async ()=>{
    console.warn( LOG_ID, 'AFTER');
    try{
      service.kill();
      service.unref();
      console.error( LOG_ID,  'DISCONNECTED', service.pid );
    } catch(e){
      console.error( LOG_ID, e);
    }
    await sleep( 1000 );
  });

  await it( 'as no.1' , async()=>{
    let resolve = createSimpleSemaphore();
    let reject  = createSimpleSemaphore();

    const ws = new WebSocket( 'ws://localhost:3953/foo' );

    ws.on('error', (...args)=>{
      console.error( LOG_ID, 'error!', ...args );
      reject('foo');
    });

    ws.on('open', function open() {
      setTimeout(()=>{
        ws.send( JSON.stringify({
          command_type : "invoke",
          command_value : {
            method_path : [ 'ws_hello_world', ],
            method_args : [ 1, 2, 3 ],
          },
        }));
      },5000);
    });

    ws.on( 'message', function message(__data) {
      const data = JSON.parse( __data.toString() );
      console.log( LOG_ID,  'received a message', data );

      if ( data.message === 'shutdown immediately' ) {
        console.log( LOG_ID, data );
        console.log( LOG_ID, 'okay,sir'  );
        ws.close();
        resolve( 'okay,sir' );
      }
    });

    console.log( LOG_ID,
      await new Promise((__resolve,__reject)=>{
        resolve.set( __resolve );
        reject .set( __reject  );
      })
    );
  });
});

