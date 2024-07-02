
import { respapi } from './respapi.mjs' ;
import { schema, trace_validator } from 'vanilla-schema-validator' ;

const t_handle_message = schema.compile`
  object(
    context   : object(),
    websocket : object(),
    message   : object(),
  ),
`();
export { t_handle_message as t_handle_message };

const t_respapi_message = schema.compile`
  object(
    command_type : string(),
    command_value : object(
      method_path : array_of( string() ),
      method_args : array_of( any() ),
    ),
  )
`();
export { t_respapi_message as t_respapi_message };

import { createContext } from 'asynchronous-context-rpc/ws-frontend-callapi-context-factory' ;


async function handle_on_message_of_ws_frontend_respapi( nargs ) {
  console.log( 'handle_on_message_of_ws_frontend_respapi', nargs );
  {
    const info = trace_validator( t_handle_message, nargs );
    if ( ! info.value ) {
      throw new Error( 'invalid args ' + info.report() );
    }
  }

  const {
    context,
    websocket,
    message,
  } = nargs;

  console.log( 'handle_on_message_of_ws_frontend_respapi', nargs );

  const message_data = JSON.parse( message?.data?.toString() ?? '{}' );
  {
    const info = trace_validator( t_respapi_message, message_data );
    if ( ! info.value ) {
      throw new Error( 'invalid message' + info.report() );
    }
  }

  const target_method_args = message_data?.command_value?.method_args ?? null;
  if ( target_method_args === null || ! Array.isArray( target_method_args ) ) {
    console.error( 'qP8UT3b/YCFndTxS0MejSg==', 'invalid target_method_args ' , target_method_args  );
    throw new Error( 'invalid target_method_args ' + target_method_args );
  }

  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      message_data.command_value.method_path,

      /* callapi_method_args */
      target_method_args,

      /* http-method as TAGS */
      'WEBSOCKET_METHOD',

      /* on_execution */
      async ( resolved_callapi_method, target_method_args )=>{

        // (Mon, 05 Jun 2023 20:07:53 +0900)
        // await context_initializer.call( context, resolved_callapi_method );

        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );


  if ( respapi_result.status  === 'error' ) {
    console.error( 'error', respapi_result.value );
    console.error( 'received No.1: %s', message?.data );
    console.error( 'respapi_result', respapi_result );
  } else {
    console.log( 'received No.1: %s', message?.data );
    console.log( 'respapi_result', respapi_result );
  }

  return context
}
export { handle_on_message_of_ws_frontend_respapi as handle_on_message_of_ws_frontend_respapi };


export async function handle_on_event_of_ws_frontend_respapi( nargs ) {
  const {
    event_name         = ((name)=>{throw new Error(`${name} is not defined`)})('event_name'),
    event_handler_name = ((name)=>{throw new Error(`${name} is not defined`)})('event_handler_name'),
    context            = ((name)=>{throw new Error(`${name} is not defined`)})('context'),
    websocket          = ((name)=>{throw new Error(`${name} is not defined`)})('websocket'),
  } = nargs;

  console.log('LOG','handle_on_event_of_ws_frontend_respapi');

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
      async ( resolved_callapi_method, target_method_args )=>{
        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'handle_on_event_of_ws_frontend_respapi : %s', respapi_result );
};



export const create_ws_frontend_respapi_handlers = ( websocket, context )=>({
  on_message : (message)=>{
    return handle_on_message_of_ws_frontend_respapi({
      context,
      websocket,
      message,
    });
  },
  on_error : (...args)=>{
    console.error( ...args );
  },
});


/*
 * See :
 * ```
 *    const { on_init_websocket_of_ws_backend } = require( './ws-middleware' );
 * ```
 */

function on_init_websocket_of_ws_frontend_respapi( websocket, context ) {
  const ws_frontend_respapi_handlers = create_ws_frontend_respapi_handlers( websocket, context );
  websocket.addEventListener( 'message', ws_frontend_respapi_handlers.on_message );
  websocket.addEventListener( 'error',   ws_frontend_respapi_handlers.on_error );
}
export { on_init_websocket_of_ws_frontend_respapi as on_init_websocket_of_ws_frontend_respapi };




/*
 *
 */

////

export const tether_default_configs_of_ws_frontend_respapi = {
  url :  null,
  frontend_context_factory : null,
  interval : 1000,

  on_initialization : function() {
    console.log( 'App', 'on_initialization' );
    this.frontend_context = this.configs.frontend_context_factory.call(this);
    this.frontend_context.is_open = false;
  },

  on_finalization : function() {
    console.log( 'App', 'on_finalization' );
    this.frontend_context.is_open = false;
  },

  /*
   * Note that a session always starts with `on_open()` and ends either
   * `on_error()` event or `on_close()` event.
   *
   * (Wed, 31 Jan 2024 11:40:45 +0900)
   */
  on_open : async function () {
    console.log( 'App', 'on_open' );
    try {
      console.log( 'WebSocket', 'opened' );

      const { context:backend_context } =  await createContext({
        websocket : this.current_websocket,
        logger    : this.frontend_context.logger,
      });

      console.log( '[ws-reconnector] proc 2' , backend_context );

      this.backend_context = backend_context;

      console.log( '[ws-reconnector] proc 3' , this.frontend_context );

      this.frontend_context.backend   = this.backend_context;
      this.frontend_context.websocket = this.current_websocket;
      this.frontend_context.is_open   = true;

      try {
        await handle_on_event_of_ws_frontend_respapi({
          event_name         : 'open',
          event_handler_name : 'on_open',
          context            : this.frontend_context,
          websocket          : this.current_websocket,
        });
      } catch (e) {
        console.error(e);
      }

      // try {
      //   on_init_websocket_of_ws_frontend_respapi( websocket, this.frontend_context );
      // } catch (e) {
      //   console.error(e);
      // }
    } catch ( e ){
      console.error( 'ws-reconnector.proc() error' , e );
    }
  },

  on_close : async function() {
    console.log( 'App', 'on_close' );

    // Set `is_open` property before calling the event handler.
    this.frontend_context.is_open   = false;

    try {
      await handle_on_event_of_ws_frontend_respapi({
        event_name         : 'close',
        event_handler_name : 'on_close',
        context            : this.frontend_context,
        websocket          : this.current_websocket,
      });
    } catch ( e ) {
      console.error('handle_on_event_of_ws_frontend_respapi on_close threw an error. ignored. ', e);
    }

    // Set the other properties after the calling event handler.
    this.frontend_context.backend   = null
    this.frontend_context.websocket = null
  },

  on_error : async function (...args) {
    console.log( 'App', 'on_error' );

    // Set `is_open` property before calling the event handler.
    this.frontend_context.is_open   = false;
    try {
      await handle_on_event_of_ws_frontend_respapi({
        event_name         : 'error',
        event_handler_name : 'on_error',
        context            : this.frontend_context,
        websocket          : this.current_websocket,
      });
    } catch ( e ) {
      console.error('handle_on_event_of_ws_frontend_respapi on_close threw an error. ignored. ', e);
    }

    // Set the other properties after the calling event handler.
    this.frontend_context.backend   = null
    this.frontend_context.websocket = null
  },

  on_message : async function( message ) {
    console.log( 'App', 'on_message' );
    return handle_on_message_of_ws_frontend_respapi({
      context   : this.frontend_context,
      websocket : this.current_websocket,
      message,
    });
  },
};

/**
 *{
 *  url : 'ws://schizostylis.local:3632/foo',      // URL to the WebSocket server
 *  frontend_context_factory : ()=>Hello.create(), // A factory function generates  Context object instances.
 *};
 */
export function create_tether_configs_of_ws_frontend_respapi(arg_configs) {
  return Object.assign({}, tether_default_configs_of_ws_frontend_respapi, arg_configs );
}

