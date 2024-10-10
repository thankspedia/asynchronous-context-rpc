import express         from 'express' ;
import bodyParser      from 'body-parser';
import url             from 'url';
import { respapi }     from 'asynchronous-context-rpc/respapi.mjs';
import { set_default_context_options } from "./respapi-utils.mjs";

export const METHOD_GET      = 'GET';
export const METHOD_HEAD     = 'HEAD';
export const METHOD_POST     = 'POST';
export const METHOD_PUT      = 'PUT';
export const METHOD_DELETE   = 'DELETE';
export const METHOD_CONNECT  = 'CONNECT';
export const METHOD_OPTIONS  = 'OPTIONS';
export const METHOD_TRACE    = 'TRACE';
export const METHOD_PATCH    = 'PATCH';

export const MSG_SUCCEEDED   = 'succeeded';
export const MSG_ERROR       = 'error';

export const SYM_RESPONSE_OVERRIDER = Symbol.for( 'SYM_RESPONSE_OVERRIDER' );

export const create_console_options = ()=>({
  ignoreErrors : true,
  colorMode   : 'auto',
  groupIndentation : 2,
  inspectOptions : {
    showHidden : false,
    depth : null,
    // colors : true,
    customInspect : true,
    showProxy : false,
    maxArrayLength : null,
    maxStringLengtha : null,
    breakLength : 400,
    compact : true,
    sorted : false,
    getters:  false,
    numericSeparator : false,
  },
});

export const create_logger_console = (stdout,stderr)=>{
  const Console = console.Console;
  return new Console({
    stdout,
    stderr,
    ...(create_console_options()),
  });
};

const http_middleware_console = create_logger_console( process.stdout, process.stderr );

const date_string = (d = new Date() )=>{
  return d.toISOString();
};

const output_log = (status,code, value = {} )=>{
  http_middleware_console.error({
    status,
    code,
    ...value,
  });
};

const output_error = (status,code, value ={} )=>{
  http_middleware_console.error({
    status,
    code,
    ...value,
  });
};



function createSuccessful(value) {
  const status = MSG_SUCCEEDED;
  return {
    status,
    value,
  };
}

function createErroneous(value) {
  const status = MSG_ERROR;
  value = filterErrorToJSON( value );
  return {
    status,
    value,
  };
}


const filterErrorToJSON = (()=>{

  function filterErrorToJSON( input ) {
    const output =  __filterErrorToJSON( input, 0 );
    // console.log( 'filterErrorToJSON - Object.keys( input )', Object.keys( input ) );
    // console.log( 'filterErrorToJSON', 'input', input , 'output', output );
    return output;
  }

  function getStackFromError(o) {
    if ( o == null ) {
      return o;
    } else if ( typeof o === 'object' ) {
      if ( 'stack' in o ) {
        if ( Array.isArray( o.stack ) ) {
          return o.stack;
        } else {
          if ( typeof o.stack === 'string' ) {
            return o.stack.split('\n');
          } else {
            // 1. this could be erroneous value but we ignore it.
            // 2. ensure it to be an array.
            return [ o.stack] ;
          }
        }
      } else {
        // ensure the result is an array.
        return [];
      }
    } else {
      // cannot retrieve stack; but we have to ensure it to be an array.
      return [];
    }
  }

  const inspect_custom_symbol = Symbol.for('nodejs.util.inspect.custom');

  function __filterErrorToJSON(o, depth ) {
    if ( o instanceof Error ) {
      const REPLACING_PROPERTIES = ['message', 'stack', 'cause'];
      return Object.assign(
        {},
        { message : ((typeof o === 'object') && ('messageObject' in o ) ) ? __filterErrorToJSON( o.messageObject, depth+1 ) : o.message },
        { stack   : getStackFromError( o ) },
        { cause   : __filterErrorToJSON( o.cause, depth+1 )},
        ... Object.keys(o).filter( e=>! REPLACING_PROPERTIES.includes(e)).map(
          k=>({
            [k] :__filterErrorToJSON(o[k],depth+1)
          })),
      );
    } else if ( o === null ) {
      return null;
    } else if ( o === undefined ) {
      return undefined;
    } else if ( (typeof o === 'object') && (inspect_custom_symbol in o ) && ( typeof o[inspect_custom_symbol] === 'function' ) ) {
      // return o[inspect_custom_symbol]( depth, {}, inspect  );
      console.warn( 'a reference to `util` was ignored' );
      return null;
    } else if ( typeof o === 'object' ) {
      return Object.assign( Array.isArray( o ) ? [] : {}, ... Object.keys(o).map(k=>({[k]:__filterErrorToJSON(o[k], depth+1)})));
    } else {
      return o;
    }
  }

  return filterErrorToJSON;
})();


/**
 *  > var u = url.parse( 'http://localhost:3000/hello/world' );
 *  undefined
 *  > u
 *  Url {
 *    protocol: 'http:',
 *    slashes: true,
 *    auth: null,
 *    host: 'localhost:3000',
 *    port: '3000',
 *    hostname: 'localhost',
 *    hash: null,
 *    search: null,
 *    query: null,
 *    pathname: '/hello/world',
 *    path: '/hello/world',
 *    href: 'http://localhost:3000/hello/world'
 *  }
 *  > const path = require( 'path' );
 *
 *  > var u = url.parse( 'http://localhost:3000/' );
 *  undefined
 *  > u
 *  Url {
 *    protocol: 'http:',
 *    slashes: true,
 *    auth: null,
 *    host: 'localhost:3000',
 *    port: '3000',
 *    hostname: 'localhost',
 *    hash: null,
 *    search: null,
 *    query: null,
 *    pathname: '/',
 *    path: '/',
 *    href: 'http://localhost:3000/'
 *  }
 *  >
 *
 * > var u = url.parse( 'http://localhost:3000' )
 * undefined
 * > u
 * Url {
 *   protocol: 'http:',
 *   slashes: true,
 *   auth: null,
 *   host: 'localhost:3000',
 *   port: '3000',
 *   hostname: 'localhost',
 *   hash: null,
 *   search: null,
 *   query: null,
 *   pathname: '/',
 *   path: '/',
 *   href: 'http://localhost:3000/'
 * }
 *
 *  See : https://developer.mozilla.org/en-US/docs/Web/API/URL/pathname
 *  > URLs such as https and http URLs that have hierarchical schemes (which
 *  > the URL standard calls "special schemes") always have at least one
 *  > (invisible) path segment: the empty string. Thus the pathname value for
 *  > such "special scheme" URLs can never be the empty string, but will
 *  > instead always have a least one / character.
 *
 *  > For example, the URL https: //developer.mozilla.org has just one path
 *  > segment: the empty string, so its pathname value is constructed by
 *  > prefixing a / character to the empty string.
 */

function split_pathname_to_callapi_method_path( urlobj ) {
  const method_path = urlobj.pathname.split( '/' );
  // See the comment above.
  if ( method_path[0] === '' ) {
    method_path.shift();
  }
  return method_path;
}

const LOG_PREFIX = 'middleware-context' ;

const MSG_UNCAUGHT_ERROR = '********************* an uncaught error was detected ***************************\n';



function filter_property_name( name ) {
  name = name.replace( /-/g, '_' );
  if ( name === '' ) {
    name = '__index';
  }
  return name;
}

function parse_request_body( text_request_body ) {
  if ( ! text_request_body ) {
    return [];
  }
  text_request_body = text_request_body.trim();
  if ( text_request_body ==='' ) {
    return [];
  }

  try {
    return JSON.parse( text_request_body );
  } catch ( err ) {
    output_error( 'INV', 'SCODE98', { message : 'parse_request_body : *** ERROR ***',  err, text_request_body } );
    throw new Error( 'JSON error',  { cause : err } );
  }
}

//
// this doesn't seem to work properly; this is probably not tested.
// Wed, 03 Jul 2024 16:34:04 +0900
//

/*
 * Now http-callapi send all arguments as JSON string; now http-middleware have
 * responsibility to parse the arguments which are encoded as JSON strings.
 *
 * Thu, 26 Sep 2024 18:50:10 +0900
 */

/*
 * Now http-callapi must send all arguments as an array-like object.
 * See method_args_to_entries() in `http-callapi.mjs`.
 *
 * Thu, 26 Sep 2024 19:03:33 +0900
 */
function parse_query_parameter( query ) {
  const p = new URLSearchParams( query );
  p.sort();
  // return [ Object.fromEntries( p.entries() ) ];
  return (
    Array.from(
      Object.fromEntries(
        p.entries().map(e=>{
          return (
            [
              ( e[0] ),
              JSON.parse( e[1] ),
            ]
          );
        })
      )
    )
  );
}


const get_authentication_token = (req)=>{
  let auth = req.get('Authentication');
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


/*
 * The procedure to execute before invocation of the method.
 */

// VASTLY MODIFIED ON (Mon, 05 Jun 2023 20:07:53 +0900)

const create_on_before_execution = ( session_info, request )=>{
  return (
    async function on_before_execution( resolved_callapi_method, callapi_method_args ) {
      const context  =  resolved_callapi_method.callapi_target;

      // See `resolved_callapi_method : t_resolved_callapi_method()`
      context.setOptions({ logger_output_filename_postfix : resolved_callapi_method.callapi_method_path_string });

      // The following two lines came from on_execution().
      // (Tue, 02 Jul 2024 15:46:31 +0900)
      const target_method = resolved_callapi_method.value;

      context.logger.output({
        type : 'begin_of_method_invocation',
        resolved_callapi_method,
      });

      // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
      // (async()=>{
      //   console.log( 'sZc3Uifcwh0',  resolved_callapi_method );
      // })();
      // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

      // 4) get the current authentication token.
      if ( 'set_user_identity' in context ) {
        const authentication_token = get_authentication_token( request );

        // (Wed, 07 Sep 2022 20:13:01 +0900)
        await context.set_user_identity( authentication_token );
      }

      set_default_context_options(
        context,
        resolved_callapi_method,
        {
          // Specify `autoConnect` === true explicitly. (Wed, 17 Jan 2024 13:47:51 +0900)
          // Rather specify `autoCommit` === true explicitly. (Wed, 15 May 2024 16:51:00 +0900)
          autoCommit : true,
        }
      );
      /*
       * Note that http-middleware is the only module which specifies autoCommit === true as default.
       */

      context?.logger?.reset();
    }
  )
}



function __create_middleware( contextFactory ) {
  // the arguments are already validated in `create_middleware` function.

  return (
    async function (req, res, next) {
      let done    = false;
      let context = null;
      let is_successful = false;
      let session_info = {};

      const urlobj              =
        url.parse( req.url, true );

      const callapi_method_path =
        split_pathname_to_callapi_method_path( urlobj ).map( filter_property_name );


      session_info.http_client_ip                = req.ip;
      session_info.http_request_pathname         = urlobj.pathname;
      session_info.http_request_query_parameter  = { ...urlobj.query };
      session_info.http_request_method           = req.method;

      session_info.target_method                 = null;
      session_info.target_method_args            = null;

      // console.log( session_info );

      const logging = {
        log  : null,
        path : req.url,
      };

      try {

        // 1) Check if the current path is the root path.
        // This should not be executed since the number of the set of elements
        // will never lower than two.

        if ( callapi_method_path.length === 0 ) {
          output_log('ERR', 'SCODE00' );
          res.status(404).json({status:'error', reason : 'not found' } ).end();

          // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
          // (async()=>{
          //   console.log(LOG_PREFIX,'http result:', 404 );
          // })().catch(err=>output_error(MSG_UNCAUGHT_ERROR,err) );
          // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

          // Abort the process.
          done = true;
          return;
        }

        /*
         * Preparing the Arguments
         */
        const target_method_args        = ( req.method === 'GET' || req.method === 'HEAD' ) ? parse_query_parameter( urlobj.query ) : parse_request_body( req.body );
        session_info.target_method_args = target_method_args;

        if ( ! Array.isArray( target_method_args ) ) {
          // 8) Send the generated response.
          res.status(400).json( createErroneous( new Error('found malformed formatted data in body' ))).end();

          // Abort the process.
          done = true;
          return;
        }

        const callapi_method_args = target_method_args;

        /*
         * Create a context object.
         */
        context = await contextFactory({});

        const invoke_logger_output = ()=>{
        };

        /*
         * Resolving Method
         */
        let respapi_result =null;

        // 5) Execute the method.
        respapi_result  =
          await respapi(

            /* callapi_target */
            context,

            /* callapi_method_path */
            callapi_method_path,

            /* callapi_method_args */
            callapi_method_args,

            /* http-method as TAGS */
            req.method,

            /* event_handlers */
            {
              on_before_execution : create_on_before_execution( session_info, req ),
            }
          );

        switch ( respapi_result.status ) {
          case 'found' :
          case 'succeeded' :
            context?.logger?.reportResult( true );
            break;
          default :
            context?.logger?.reportResult( false );
            break;
        }

        /*
         * Set the filename of the logger to the logging object which is
         * eventually be shown in console.
         */
        logging.log = context.getOptions().logger_output_filename;

        switch ( respapi_result.status ) {
          case 'found' :
            // TODO check the specification of respapi; what if it returns 'found'.
            output_log( 'SUC', 'SCODE01', {...logging});
            res.status( 200 ).json( createSuccessful( respapi_result.value ) ).end();
            done = true;
            return;
          case 'succeeded' :
            // Check if the result object is a Buffer.
            if ( Buffer.isBuffer( respapi_result.value ) ) {
              // If so, treat it as Buffer; this effectively enables users to
              // send binary data to the client.
              output_log( 'SUC', 'SCODE02', {...logging} );
              res.status( 200 ).send( respapi_result.value ).end();
              done = true;
            } else {
              // Otherwise let it treat as the default does.
              output_log( 'SUC', 'SCODE03', {...logging} );

              /*
               * TODO DOCUMENT THIS!!!
               *
               * if the symbol SYM_RESPONSE_OVERRIDER is set to the result
               * object, take that value as a function to override response
               * properties of Express object.
               *
               * (Thu, 10 Oct 2024 17:24:29 +0900)
               */
              if ( SYM_RESPONSE_OVERRIDER in respapi_result.value ) {
                const overrider = respapi_result.value[SYM_RESPONSE_OVERRIDER];
                if ( typeof overrider === 'function'  ) {
                  try {
                    overrider( res );
                  } catch ( e ) {
                    console.warn( 'overrider threw an error' ) ;
                  }
                } else {
                  console.warn( 'overrider was not a function' ) ;
                }
              }

              res.status( 200 ).json( createSuccessful( respapi_result.value ) ).end();

              done = true;
            }
            return;
          case 'error' :
            output_log( 'ERR', 'SCODE04' , {...logging});
            res.status( 200 ).json( createErroneous( respapi_result.value ) ).end();
            done = true;
            return;
          case 'not_found' :
            output_log( 'INV', 'SCODE05', {...logging} );
            res.status( 404 ).json({
              status:'error',
              value:{
                status_code : 404,
                reason : 'Not Found',
                // ...session_info,
                // ...respapi_result,
              },
            }).end();
            done= true;
            return;
          case 'forbidden' :
            output_log( 'INV', 'SCODE06' , {...logging});
            res.status( 403 ).json(
              {
                status:'error',
                value:{
                  status_code : 403,
                  reason : 'Forbidden',
                  // ...session_info,
                  // ...respapi_result,
                },
              }
            ).end();
            done = true;
            return;

          default:
            output_log( 'INV', 'SCODE07' , {...logging});
            res.status( 403 ).json(
              {
                status:'error',
                value:{
                  status_code : 403,
                  reason : 'Forbidden',
                  // ...session_info,
                  // ...respapi_result,
                },
              }
            ).end();
            done = true;
            return;
        }
      } catch ( err ) {
        if ( done ) {
          if ( res.writableEnded ) {
            output_error( 'FAI', 'SCODE08', {...logging, message: 'Error(done=true,writable-ended=true)', err } );
          } else {
            output_error( 'FAI', 'SCODE09', {...logging, message: 'Error(done=true,writable-ended=false)', err } );
            res.status(500).json( createErroneous( err ) ).end();
          }
        } else {
          try {
            if ( res.writableEnded ) {
              output_error( 'FAI', 'SCODE10', {...logging, message: 'Error(done=false,writable-ended=true)', err } );
            } else {
              // 8) Send the generated response.
              output_error( 'FAI','SCODE11', {...logging, message: 'Error(done=false,writable-ended=false)', err } );
              res.status(500).json( createErroneous( err ) ).end();
              done = true;
              // Abort the process.
              return;

            }
          } catch (err) {
            output_error( 'FAI', 'SCODE12', {...logging, message:'detected an internal error', err });
          }
        }
      } finally {
        try {
          if ( ! done && res.writableEnded ) {
            next();
          }
        } catch (err) {
          output_error( 'FAI', 'SCODE99', {...logging, message:'http-middleware detected a final error', err } );
        }
      }
    }
  );
}



function create_middleware( contextFactory ) {
  if ( contextFactory === undefined || contextFactory === null ) {
    throw new ReferenceError( 'contextFactory must be specified' );
  }
  if ( typeof contextFactory !== 'function' ) {
    throw new TypeError( 'contextFactory must be a function' );
  }

  const router = express.Router();

  // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
  // router.use((req,res,next)=>{
  //   console.log( LOG_PREFIX, "middleware:", req.url );
  //   next();
  // });
  // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

  // router.use(express.json());
  // router.use(bodyParser.urlencoded({ extended: true }));
  // router.use(bodyParser.text({type:"*/*"}));
  router.use( express.urlencoded({ extended: true }));
  router.use( express.text({type:"*/*", limit: '50mb' }));
  router.all( '/(.*)', __create_middleware( contextFactory ) );
  router.all( '(.*)', function ( req, res, next ) {
    // console.trace('(.*)');
    if ( ! res.writableEnded ) {
      res.status(404).json({status:'error', reason : 'not found' } ).end();
    } else {

    }
  });
  return router;
}

export { create_middleware as create };
export { create_middleware  };

