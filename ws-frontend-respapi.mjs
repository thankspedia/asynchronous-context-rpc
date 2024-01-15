
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

  const respapi_result  =
    await respapi(
      /* callapi_target */
      context,

      /* callapi_method_path */
      message_data.command_value.method_path,

      /* http-method as TAGS */
      'WEBSOCKET_METHOD',

      /* on_execution */
      async ( resolved_callapi_method )=>{

        // (Mon, 05 Jun 2023 20:07:53 +0900)
        // await context_initializer.call( context, resolved_callapi_method );

        /*
         * Invoking the Resolved Method
         */
        const target_method      = resolved_callapi_method.value
        const target_method_args = message_data.command_value.method_args;
        return await (context.executeTransaction( target_method, ... target_method_args ));
      },
    );

  console.log( 'received No.1: %s', message?.data );
  console.log( 'respapi_result', respapi_result );
  // console.log( 'context.hello_world', await context.hello_world() );

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



export const ws_frontend_respapi_handlers = {
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
};


/*
 * See :
 * ```
 *    const { on_init_websocket_of_ws_backend } = require( './ws-middleware' );
 * ```
 */

function on_init_websocket_of_ws_frontend_respapi( websocket, context ) {
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
  },
  on_finalization : function() {
    console.log( 'App', 'on_finalization' );
  },
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

    // this.websocket = null;
    this.frontend_context.backend = null
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

  on_error : function (...args) {
    console.log( 'App', 'on_error' );
    console.error( ...args );
  },
};

export function create_tether_configs_of_ws_frontend_respapi(arg_configs) {
  return Object.assign({}, tether_default_configs_of_ws_frontend_respapi, arg_configs );
}

