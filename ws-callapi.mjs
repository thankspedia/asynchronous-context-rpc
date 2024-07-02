
/**
 * Note : LIMITATION OF CALLAPI
 *
 * WebSocket Callapi cannot take return values due to WebSocket's limitation.
 * A WebSocket message is always a uni-directional message. Returning values
 * requires bi-directional messages; returning values cannot be implemented
 * due to this limitation.
 *
 * (Wed, 29 Nov 2023 18:13:02 +0900)
 *
 */

function websocket_callapi_handler( nargs ) {
  const {
    websocket                  = ((v)=>{ throw new Error(`${v} is not specified`) })( 'websocket' ),
    method_path                = ((v)=>{ throw new Error(`${v} is not specified`) })( 'method_path' ),
    method_args                = ((v)=>{ throw new Error(`${v} is not specified`) })( 'method_args' ),
    logger                     = null,
  } = nargs;

  /*
   * Special Case 1) if the specified method path is './websocket' return the
   * reference to the current websocket.
   */
  if ( 1<=method_path.length && method_path[0] === 'websocket' ) {
    console.log( 'websocket_callapi_handler','6yvjkMQ7s9Q', { method_path, method_path } );
    if ( method_path.length === 1 ) {
      return ({
        status : 'succeeded',
        value :  websocket,
      });
    } else {
      /*
       * This should be disabled for security reasons.
       * Tue, 26 Dec 2023 11:26:31 +0900
       */
      const method_name = method_path[1] ?? null;
      const result = websocket[method_name]( ...method_args );
      return {
        status : 'succeeded',
        value : result,
      };
    }
  } else if (  1<=method_path.length && method_path[0] === 'toJSON'  ) {
    return '[ws-callapi]';
  } else {

    if ( typeof websocket.send !== 'function' ) {
      throw new Error( `the argument websocket.send is not a function` );
    }

    const value = {
      command_type : 'invoke_method',
      command_value : {
        method_path,
        method_args,
      },
    };

    console.log( 'websocket_callapi_handler','2esIyrlhAi8', value );

    {
      const method_name = 'rpc:' + method_path;
      const proc = ()=>websocket.send( JSON.stringify( value ) );
      const result = {
        status : 'succeeded',
        value : null,
      };

      if ( (typeof logger === 'object' ) && ( logger !== null )) {
        try {
          logger.enter( method_name, method_args );
          proc();
        } catch (e) {
          logger.leave_with_error( method_name, e );
        } finally {
          logger.leave( method_name, result );
        }
      } else {
        proc();
      }
      return result;

    }

  }
}

export { websocket_callapi_handler as websocket_callapi_handler };
