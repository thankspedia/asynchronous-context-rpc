const STDOUT_LOG_ID = '[http-callapi] stdout >> ';

// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)

import { filenameOfSettings } from 'asynchronous-context/settings';
import { dotenvFromSettings } from 'asynchronous-context/env';
import "./common.mjs" ;



import assert                                    from 'node:assert/strict';
import { test, describe, it, before, after }     from 'node:test';
import { spawn }                                 from 'node:child_process';
import { createContext as createContextCallapi } from 'asynchronous-context-rpc/http-callapi-context-factory.mjs';

filenameOfSettings( './http-callapi-test.settings.json' );
dotenvFromSettings();

const is_remote = true;

function createContext() {
  return createContextCallapi({
    http_server_url           : 'http://localhost:2004/api/',
    http_authentication_token : 'hello_authentication_token',
  });
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

await describe( 'http-callapi test',{only:true,skip:false}, async ()=>{
  await before( async ()=>{
    console.warn('BEFORE');
    try {
      service = spawn( 'start-http-middleware-service', {
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
        console.log( 'expected exception', e );
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
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });


  await it( 'SUC:as override test 01', {only:false,skip:true}, async()=>{
    await assert.doesNotReject( async()=>{
      try {
        const context = createContext();
        const result = await context.OVERRIDE({http_method:'GET'}).hello_request_method_get();
        assert.deepEqual( result, "THIS IS A RESULT OF REQUEST_METHOD GET" );
      } catch ( e ) {
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });

  await it( 'ERR:as override test 02 unmatched request method causes an error', {only:false,skip:false}, async()=>{
    await assert.rejects( async()=>{
      try {
        const context = createContext();
        const result = await context.OVERRIDE({http_method:'POST'}).hello_request_method_get();
        assert.deepEqual( result, "THIS IS A RESULT OF REQUEST_METHOD GET" );
      } catch ( e ) {
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });

  await it( 'ERR:as override test 03 unmatched request method causes an error; the default method is POST.', {only:false, skip:false}, async()=>{
    await assert.rejects( async()=>{
      try {
        const context = createContext();
        const result = await context.hello_request_method_get(1,2,3,4);
        assert.deepEqual( result, "THIS IS A RESULT OF REQUEST_METHOD GET" );
      } catch ( e ) {
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });

  await it( 'SUC:as override test 04 with arguments ', {only:false, skip:false}, async()=>{
    await assert.doesNotReject( async()=>{
      try {
        const context = createContext();
        const result = await context.OVERRIDE({http_method:'GET'}).hello_request_method_get(1,2,3,4);
        assert.deepEqual( result, "THIS IS A RESULT OF REQUEST_METHOD GET" );
      } catch ( e ) {
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });

  await it( 'SUC: serialize arguments in request method get : 1 ', {only:true, skip:false}, async()=>{
    await assert.doesNotReject( async()=>{
      try {
        const context = createContext();
        const args = [
          {
            a:[ 'foo','bar',],
            b:{ foo:'hello', bar:'world' }
          },
          1,
          2,
          3,
        ];

        const result = await context.OVERRIDE({http_method:'GET'}).return_args_with_request_method_get(...args);
        assert.deepEqual( result, args );
      } catch ( e ) {
        console.error( 'unexpected exception', e );
        throw new Error( 'error', { cause : e } );
      }
    });
  });


}).then((e)=>console.log(e,'foo')).catch( (e)=>{console.log(e) });





