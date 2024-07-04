const DEBUG = false;

import { WebSocketServer } from 'ws' ;
import { parse } from 'url';
import { trace_validator } from 'vanilla-schema-validator' ;
import { respapi, t_respapi_message } from './respapi.mjs' ;
import { createContext  } from './ws-backend-callapi-context-factory.mjs' ;
import { set_default_context_options } from "./respapi-utils.mjs";

// const AUTO_CONNECT = '__AUTO_CONNECT__';
// const AUTO_COMMIT = '__AUTO_COMMIT__';

/*
 * function on_init_websocket( websocket, req ) {
 *    // ...
 * }
 *
 * websocket : an argument to specify a websocket instance from
 *             websocket/ws module.
 *
 * req       : an optional argument to specify request header object from
 *             the common Request object.
 *
 *             https://developer.mozilla.org/en-US/docs/Web/API/Headers
 */
function create_websocket_upgrader( on_init_websocket ) {
  const wss = new WebSocketServer({ noServer: true });
  wss.on( 'connection', ( websocket, req )=>{
    return on_init_websocket( websocket, req );
  });
  return ( request, socket, head )=>{
    wss.handleUpgrade( request, socket, head, function done(websocket) {
      wss.emit('connection', websocket, request);
    });
  };
}

export { create_websocket_upgrader as create_websocket_upgrader };


const handle_multi_path_upgrade = ( mapper, request, socket, head )=>{
  const { pathname } = parse( request.url );
  if ( DEBUG ) console.log( 'handle_upgrade : ', pathname );
  if ( pathname in mapper ) {
    if ( DEBUG ) console.log( `handle_upgrade on [${pathname}]` );
    mapper[ pathname ]( request, socket, head )
  } else {
    console.warn( `failed to 'handle_upgrade' on [${pathname}]` );
    socket.destroy();
  }
};

export { handle_multi_path_upgrade };


const create_multi_path_upgrade_handler = (mapper)=>(
  function handle_upgrade( request, socket, head ) {
    return handle_multi_path_upgrade( mapper, request, socket, head );
  }
);
export {  create_multi_path_upgrade_handler as create_multi_path_upgrade_handler };


const get_authentication_token = (req)=>{
  let auth = req.get( 'Authentication' );
  if ( auth == null ) {
    return null;
  } else {
    if ( Array.isArray( auth ) ) {
      new Error( 'Invalid Authentication Token' );
    }
    auth = auth.trim();
    let ma = auth.match( /^Bearer +(.*)$/ );
    if ( ma ) {
      return ma[1].trim();
    } else {
      return null;
    }
  }
};

async function handle_event_of_ws_backend( nargs ) {
  const {
    event_name         = ((name)=>{throw new Error(`${name} is not defined`)})('event_name'),
    event_handler_name = ((name)=>{throw new Error(`${name} is not defined`)})('event_handler_name'),
    event_handlers     = {},
    context            = ((name)=>{throw new Error(`${name} is not defined`)})('context'),
    websocket          = ((name)=>{throw new Error(`${name} is not defined`)})('websocket'),
    req                = null,
  } = nargs;

  if ( DEBUG ) console.log('LOG', 'handle_event_of_ws_backend', event_handler_name );

  const target_method_args = [{websocket,event_name}]; // message.command_value.method_args;

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

      /* callapi_method_args */
      target_method_args,

      /* http-method as TAGS */
      'WEBSOCKET_EVENT_HANDLER',

      /* on_execution */
      {
        async on_before_execution( resolved_callapi_method, target_method_args ) {
          const context = resolved_callapi_method.callapi_target;
          // context.logger.reset();
          context.setOptions({ showReport : true, coloredReport:true });
        },
      },
    );

  if ( DEBUG ) console.log( 'handle_event_of_ws_backend : %s', respapi_result );

  /*
   * Call the specified event handler on the event handler object.
   * Note that this mechanism is currently not used.
   */
  if ( event_handler_name in event_handlers ) {
    try {
      event_handlers[event_handler_name]();
    } catch( e ){
      console.error( `WARNING ${event_handler_name} threw an error. ignored. `, e );
    }
  }
};


async function handle_message_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    context         = ((name)=>{throw new Error('${name} is not defined')})('context'),
    websocket       = ((name)=>{throw new Error('${name} is not defined')})('websocket'),
    req             = null,
    data            = ((name)=>{throw new Error('${name} is not defined')})('data'),
  } = nargs;
  const message = JSON.parse( data.toString() );

  const info = trace_validator( t_respapi_message, message );

  if ( ! info.value ) {
    throw new Error( 'invalid message' + info.report() );
  }

  /*
   * The followign code migrated to `on_init_websocket_of_ws_backend`.
   */

  // context.send_ws_message = async function( value ) {
  //   websocket.send( JSON.stringify( value ) );
  // };

  // /*
  //  * This line is tested by `ws-backend-respapi-test.js`
  //  * See ws-frontend-respapi-test-context-factory.js
  //  * (Fri, 16 Jun 2023 14:09:54 +0900)
  //  */
  // context.frontend = createContext({
  //   websocket,
  // });




  // COPIED FROM http-middleware
  /*
   * The procedure to execute before invocation of the method.
   */
  async function on_before_execution( resolved_callapi_method, callapi_method_args ) {
    const context = resolved_callapi_method.callapi_target;
    // context.logger.output({
    //   type : 'begin_of_method_invocation',
    //   info : {
    //     resolved_callapi_method
    //   }
    // });

    if ( DEBUG ) console.log( 'dGNndxPMXh',  resolved_callapi_method );

    set_default_context_options( context, resolved_callapi_method, {} );
  }

  if ( DEBUG ) console.log( 'Y3DKBQkz2P4QfF', 'AAAAAAAAAAA NO2', req.headers );

  const target_method_args = message.command_value.method_args ?? null;
  if ( target_method_args === null || ! Array.isArray( target_method_args ) ) {
    console.error( 'Vm11mTSteJYERqmoG6zy9w==', 'invalid target_method_args ' , target_method_args  );
    throw new Error( 'invalid target_method_args ' + target_method_args );
  }


  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      message.command_value.method_path,

      /* callapi_method_args */
      target_method_args,

      /* http-method as TAGS */
      'WEBSOCKET_METHOD',
      {
        on_before_execution,
      },
    );

  if ( DEBUG ) console.log( 'received No.1: %s', data );
  // console.log( 'respapi_result', respapi_result );
  // console.log( 'context.hello_world', await context.hello_world() );

  return context
}

/*
 * This function is not used anymore.
 * (Thu, 14 Dec 2023 19:17:19 +0900)
 */
async function handle_on_error_of_ws_backend( nargs ) {
  const {
    event_handlers  = {},
    // context         = ((name)=>{throw new Error('${name} is not defined')})('context'),
    // websocket       = ((name)=>{throw new Error('${name} is not defined')})('websocket'),
    // req             = null,
    // data            = ((name)=>{throw new Error('${name} is not defined')})('data'),
  } = nargs;

  if ( 'on_error' in event_handlers ) {
    try {
      event_handlers.on_error( ...args );
    } catch( e ){
      console.error('WARNING on_error handler threw an error. ignored. ', e );
    }
  }
}

async function on_init_websocket_of_ws_backend( nargs ) {
  const {
    create_context = ((name)=>{ throw new Error( `${name} is not defined` ) } )('create_context'),
    event_handlers  = {} ,
    websocket       = ((name)=>{ throw new Error( `${name} is not defined` ) } )('websocket'),
    req             = ((name)=>{ throw new Error( `${name} is not defined` ) } )('websocket'),
  } = nargs;

  websocket[ Symbol.for('nodejs.util.inspect.custom') ] = function() {
    return '[WebSocket]'
  };


  const context = await create_context();

  if ( DEBUG ) console.log( "LOG" , "on_init_websocket_of_ws_backend" );

  /*
   * Initialize the backend context object.
   *   - Set an accessor to the websocket object to the backend context object.
   *   - Set the websocket object on the backend context object.
   *   - Create a frontend context object and set it to the backend context object.
   *
   * This part migrated from the following method.
   */
  context.websocket = websocket;
  context.send_ws_message = async function( value ) {
    websocket.send( JSON.stringify( value ) );
  };
  context.frontend = createContext({
    websocket,
    logger : context.logger,
  });
  if ( DEBUG ) console.log( 'context.frontend' , context.frontend );

  /*
   * The frontend context object above was tested by `ws-backend-respapi-test.js`
   * See test/ws-frontend-respapi-test-context-factory.mjs
   * (Fri, 16 Jun 2023 14:09:54 +0900)
   */


  // websocket.on( 'open', async (data)=>(
  try {
    await handle_event_of_ws_backend(
      {
        event_name         : 'open',
        event_handler_name : 'on_open',
        event_handlers  ,
        context         ,
        websocket       ,
        req             ,
        // data            ,
      }
    )
  } catch (e) {
    console.error( 'handle_event_of_ws_backend', e );
  }
  // ));

  websocket.on( 'close', async (data)=>{
    try {
      if ( DEBUG ) console.log( 'websocket on_close' );
      await handle_event_of_ws_backend(
        {
          event_name         : 'close',
          event_handler_name : 'on_close',
          event_handlers  ,
          context         ,
          websocket       ,
          req             ,
          // data            ,
        }
      )
    } catch (e){
      console.error( 'handle_event_of_ws_backend', e );
    }
  });

  websocket.on( 'error', async ()=>{
    try {
      await handle_event_of_ws_backend(
        {
          event_name         : 'error',
          event_handler_name : 'on_error',
          event_handlers  ,
          context         ,
          websocket       ,
          req             ,
          // data            ,
        }
      )
    } catch (e) {
      console.error( 'handle_event_of_ws_backend', e );
    }
  });

  websocket.on( 'message', async (data)=>{
    try {
      await handle_message_of_ws_backend(
        {
          event_handlers  ,
          context         ,
          websocket       ,
          req             ,
          data            ,
        }
      )
    } catch (e) {
      console.error('handle_message_of_ws_backend ERROR',e);
    }
  });

}

export { on_init_websocket_of_ws_backend as on_init_websocket_of_ws_backend };









