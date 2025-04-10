const LOG_ID = `[start-test.mjs]`;
const STDOUT_LOG_ID = '[start-test.mjs] stdout >> ';

// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)

import { createSimpleSemaphore }             from  'asynchronous-context-rpc/simple-semaphore.mjs' ;
import   assert                              from   'node:assert/strict'  ;
import { test, describe, it, before, after } from   'node:test'  ;
import { spawn }                             from   'node:child_process'  ;
import { WebSocket }                         from   'ws'  ;

import { filenameOfSettings } from 'asynchronous-context/settings';
import { dotenvFromSettings } from 'asynchronous-context/env' ;
import "./common.mjs";
import { createContext as createContextCallapi } from 'asynchronous-context-rpc/http-callapi-context-factory.mjs';
filenameOfSettings('./start-test.settings.json' );
dotenvFromSettings();


const is_remote = true;
function createContext() {
  return createContextCallapi({
    http_server_url           : 'http://localhost:2012/api/',
    http_authentication_token : 'hello_authentication_token',
  });

//  if ( is_remote ) {
//    return require( 'asynchronous-context-rpc/http-callapi-context-factory.mjs' ).createContext({
//      http_server_url           : 'http://localhost:2012/api/',
//      http_authentication_token : 'hello_authentication_token',
//    });
//  } else {
//    return require( 'asynchronous-context-rpc/http-middleware-test-context-factory' ).createContext();
//  }
}


/*
 * `process.kill()` does not work properly.
 * ------------------------------------------
 * Workaround :
 *   - <https://stackoverflow.com/questions/56016550/node-js-cannot-kill-process-executed-with-child-process-exec>
 *   - <https://www.geeksforgeeks.org/node-js-process-kill-method/>
 *
 *  process.pid() is always away +1 +2 from the real value
 * -------------------------------------------------------------
 * This article tells you that spawn() does not have this issue.
 * <https://github.com/nodejs/help/issues/3274>
 *
 * Confirmed. The state above is CORRECT. How would I have known that.
 *
 */

const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));

let service = null;

describe( 'it as', async ()=>{

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

  await it('as test1',{skip:false}, async()=>{
    const context = createContext();
    assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
  });

  await it('as test2',{skip:false}, async()=>{
    const context = createContext();
    await (context.hello.world.foo.bar.baz('hello world'));
  });

  await it('as test3', {skip:false}, async()=>{
    await assert.rejects((async()=>{
      try {
        const context = createContext();
        await (context.hello2.world.foo.bar.baz({hello:'hello world'}));
      } catch ( e ) {
        console.log( LOG_ID,  'expected exception', e );
        throw new Error( 'error', { cause : e } );
      }

    }));
  });

  await it('as test4', {skip:false}, async()=>{
    await assert.doesNotReject( async()=>{
      try {
        const context = createContext();
        const result = await context.multiple(1,2,3,4);
        assert.deepEqual( result, [1,2,3,4]);
      } catch ( e ) {
        console.error( LOG_ID,  'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });

  await it( 'as WebSocket no.1' , async()=>{
    let resolve = createSimpleSemaphore();
    let reject  = createSimpleSemaphore();

    const ws = new WebSocket( 'ws://localhost:3959/foo' );

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
        console.log( LOG_ID, 'okay,sir' );
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



}).then((e)=>console.log(e,'foo')).catch( (e)=>{console.log(e) });

