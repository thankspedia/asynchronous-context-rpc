const STDOUT_LOG_ID = '[ws-callapi-test.mjs] stdout ';

// require( 'dotenv' ).config();
// MODIFIED (Wed, 27 Sep 2023 13:28:23 +0900)
import   assert       from   'node:assert/strict'  ;
import { test, describe, it, before, after }     from   'node:test'  ;
import { spawn }     from   'node:child_process'  ;

import { createContext as __createContext }    from   'asynchronous-context-rpc/ws-frontend-callapi-context-factory.mjs'  ;
import { filenameOfSettings } from 'asynchronous-context/settings';
import { dotenvFromSettings } from 'asynchronous-context/env' ;
import "./common.mjs";

filenameOfSettings( './ws-callapi-test-context-factory.settings.json' );
dotenvFromSettings( );


async function createContext() {
  return await __createContext({ websocket: 'ws://localhost:3954/foo'});
}

const sleep = (t)=>(new Promise((resolve,reject)=>{
  setTimeout(resolve,t);
}));

let service = null;


describe( async ()=>{
  await before( async ()=>{
    console.warn('BEFORE');
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
    const p = new Promise( async (resolve,reject)=>{
      const {context} = await createContext();
      const websocket = (await context.websocket() );

      await sleep( 1000 );

      const close = ()=>websocket.close();

      console.log( "83hdlOFdSNwNhqEkcu2jAiH7/B3Hsisrw4RYSzszS0M=", websocket );

      websocket.addEventListener( 'message', ( message )=>{
        console.log( "0v0EPQ8KcLcoCZwD+q24kWxmI6fAMYR9TGSwLHfunyQ=", message.data );
        const v = JSON.parse( message.data.toString() );
        if ( v === 'Okay, your request was received.' ) {
          resolve(v);
        } else {
          reject(v);
        }
        close();
      });

      setTimeout( ()=>{
        reject('timeout')
        close();
      }, 5000 );

      await context.say_hello();
    });

    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
    return await p;
  });

  await it('as test2', async()=>{
    const p = new Promise( async (resolve,reject)=>{
      const { context } = await createContext();
      const websocket = (await context.websocket() );
      const close = ()=>websocket.close();

      websocket.addEventListener( 'message', ( message )=>{
        console.log( "0v0EPQ8KcLcoCZwD+q24kWxmI6fAMYR9TGSwLHfunyQ=", message.data );
        const v = JSON.parse( message.data.toString() );
        console.log( 'hJGqsnbq5A4', v );
        if ( v.message.join(',') === 'okay,hello,world,foo' ) {
          resolve(v);
        } else {
          reject(v);
        }
        close();
      });

      setTimeout( ()=>{
        reject('timeout')
        close();
      }, 1000 );

      await (context.hello.world.foo.bar.baz( 'hello','world','foo' ));
    });

    //assert.equal( await ( context.hello_world( 'hello world !!' ) ) , 'hello world !!' );
    return await p;
  });


  // it('as test3', async()=>{
  //   await assert.rejects((async()=>{
  //     try {
  //       const context = await createContext();
  //       await (context.hello2.world.foo.bar.baz({hello:'hello world'}));
  //     } catch ( e ) {
  //       console.log( 'expected exception', e );
  //       throw new Error( 'error', { cause : e } );
  //     }

  //   }));
  // });

  // it('as test4', async()=>{
  //   await assert.doesNotReject( async()=>{
  //     try {
  //       const context = await createContext();
  //       const result = await context.multiple(1,2,3,4);
  //       assert.deepEqual( result, [1,2,3,4]);
  //     } catch ( e ) {
  //       console.error( 'unexpected exception', e );
  //       throw new Error( 'error', { cause : e } );
  //     }
  //   });
  // });
});

