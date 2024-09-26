


function create_callapi_overrider( args ) {
  return function created_overrider( args_to_override ) {
    const overriden_args = {
      ...args,
    };

    // Don't let them override fields other than 'http_method'.
    if ( args_to_override.http_method ) {
      if ( typeof args_to_override.http_method === 'string' ) {
        overriden_args.http_method = args_to_override.http_method;
      } else {
        throw new Error( `the named argument 'http_method' must be a string` );
      }
    } else {
      throw new Error( `the named argument 'http_method' must be a string` );
    }

    return create_callapi( overriden_args );
  };
}

export function create_callapi( __nargs ) {
  // duplicate the object that contains the named arguments:
  const nargs = {
    ... __nargs,
  };

  // check the specified named arguments:
  if ( ! ( 'callapi_handler' in nargs ) ) {
    throw new Error( 'callapi_handler is not specified' );
  }
  if ( ! ( 'method_path' in nargs  ) ) {
    nargs.method_path = [];
  }


  // // console.log( nargs );
  // const {
  //   callapi_handler           = http_callapi_handler,
  //   method_path               = [],
  //   http_method               = 'POST',
  //   http_server_url           = (()=>{throw new Error( 'http_server_url must be specified' )})(),
  //   http_authentication_token = (()=>{throw new Error( 'http_authentication_token must be specified' )})(),
  // } = nargs;

  return new Proxy( function delegating_proxy(){}, {
    async apply( target, thisArg, args ) {

      const result = await (nargs.callapi_handler({
        ...nargs,
        method_path : [ ...nargs.method_path ],
        method_args : [ ... args             ],
      }));

      if ( 'status' in result ) {
        if ( result.status === 'error' ) {
          throw new Error( 'error', { cause : result.value } );
        } else if ( result.status === 'succeeded' ) {
          return result.value;
        } else {
          // go to the following code
        }
      } else {
        // go to the following code
      }

      console.error( 'unexpected value', { cause : result } );
      throw new Error( 'unexpected value', { cause : result } );
    },

    get(target, prop, receiver) {
      if ( prop === 'OVERRIDE' ) {
        return create_callapi_overrider({
          ...nargs,
          method_path : [ ...(nargs.method_path) ],
        });
      } else {
        return create_callapi({
          ...nargs,
          method_path : [ ...(nargs.method_path), prop ],
        });
      }
    }
  });
}



