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
    console.error( 'parse_request_body : *** ERROR ***',  err, text_request_body );
    throw new Error( 'JSON error',  { cause : err } );
  }
}

function parse_query_parameter( query ) {
  const p = new URLSearchParams( query );
  p.sort();
  return [ Object.fromEntries( p.entries() ) ];
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

      session_info.http_pathname              = urlobj.pathname;
      session_info.http_query_parameter       = { ...urlobj.query };
      session_info.http_request_method        = req.method;
      session_info.target_method              = null;
      session_info.target_method_args         = null;

      try {

        // 1) Check if the current path is the root path.
        // This should not be executed since the number of the set of elements
        // will never lower than two.

        if ( callapi_method_path.length === 0 ) {
          res.status(404).json({status:'error', reason : 'not found' } ).end();


          // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
          // (async()=>{
          //   console.log(LOG_PREFIX,'http result:', 404 );
          // })().catch(err=>console.error(MSG_UNCAUGHT_ERROR,err) );
          // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

          done = true;

          // Abort the process.
          return;
        }


        /*
         * Preparing the Arguments
         */
        const target_method_args        = ( req.method === 'GET' || req.method === 'HEAD' ) ? parse_query_parameter( urlobj.query ) : parse_request_body( req.body );
        session_info.target_method_args = target_method_args;

        if ( ! Array.isArray( target_method_args ) ) {
          context.logger.output({
            type  : 'error_occured_before_method_invocation',
            reason : 'the specified argument is not an array',
            value : target_method_args,
          });

          // 8) Send the generated response.
          res.status(400).json( createErroneous( new Error('found malformed formatted data in body' ))).end();

          done = true;
          // Abort the process.
          return;
        }

        const callapi_method_args = target_method_args;

        /*
         * Create a context object.
         */
        context = await contextFactory({});

        /*
         * The procedure to execute before invocation of the method.
         */
        // VASTLY MODIFIED ON (Mon, 05 Jun 2023 20:07:53 +0900)
        async function on_before_execution( resolved_callapi_method, callapi_method_args ) {
          const context  =  resolved_callapi_method.callapi_target;

          // The following two lines came from on_execution().
          // (Tue, 02 Jul 2024 15:46:31 +0900)
          const target_method = resolved_callapi_method.value;
          session_info.target_method = target_method;

          context.logger.output({
            type : 'begin_of_method_invocation',
            info : {
              ...session_info,
            }
          });

          // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
          // (async()=>{
          //   console.log( 'sZc3Uifcwh0',  resolved_callapi_method );
          // })();
          // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

          // 4) get the current authentication token.
          if ( 'set_user_identity' in context ) {
            const authentication_token = get_authentication_token( req );

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
        }

        // (Mon, 05 Jun 2023 20:07:53 +0900)
        // context.contextInitializers.unshift( );


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


            /* on_execution */
            {
              on_before_execution

              // async on_execution( resolved_callapi_method, callapi_method_args ) {
              //   const target_method = resolved_callapi_method.value;
              //   /*
              //    * Invoking the Resolved Method
              //    */
              //   return await (context.executeTransaction( target_method, ... callapi_method_args ));
              // },
            }
          );


        if ( respapi_result.status !== 'found' ) {
          /*
           * Process errors from callapi.js
           */
          context.logger.output({ type  : 'detected_callapi_error' });

          let result = null;
          let status_code = 100;

          // The method to respond when the result object is a pure JavaScript
          // object.
          const respond_as_json = (res)=>{
            res.status( status_code ).json( result ).end();
          };

          // The method to respond when the result object is a Buffer object.
          const respond_as_send = (res)=>{
            res.status( status_code ).send( result ).end();
          };
          // The default method is respond_as_json(); treat the result object
          // as a JSON object.
          let respond = respond_as_json;

          // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
          // (async ()=>{
          //   console.log( '0aCa8xD0oY0', respapi_result );
          // })()
          // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

          if ( false ) {
            // dummy
          } else if ( respapi_result.status === 'succeeded' ) {
            // 6) Set the flag `is_successful`
            is_successful = true;
            status_code = 200;

            // Check if the result object is a Buffer.
            if ( Buffer.isBuffer( respapi_result.value ) ) {
              // If so, treat it as Buffer; this effectively enables users to
              // send binary data to the client.
              result = respapi_result.value;
              respond = respond_as_send;
            } else {
              // Otherwise let it treat as the default does.
              result =
                createSuccessful( respapi_result.value );
            }
          } else if ( respapi_result.status === 'error' ) {
            status_code = 200;
            result = createErroneous( respapi_result.value );

          } else if ( respapi_result.status === 'not_found' ) {
            status_code = 404;
            result = {
              status:'error',
              value:{
                status_code,
                reason : 'Not Found',
                ...session_info,
                ...respapi_result,
              },
            };
          } else if ( respapi_result.status === 'forbidden' ) {
            status_code = 403;
            result = {
              status:'error',
              value:{
                status_code,
                reason : 'Forbidden',
                ...session_info,
                ...respapi_result,
              },
            };
          } else {
            status_code = 500,
            result = {
              status:'error',
              value:{
                status_code,
                reason : 'Internal Server Error',
                ...session_info,
                ...respapi_result,
              },
            };
          }

          // 7) Send the generated response.

          // The Logging Series No.1

          // >>> MODIFIED (Mon, 31 Jul 2023 17:27:12 +0900)
          // res.status( status_code ).json( result ).end();
          respond( res );
          // <<< MODIFIED (Mon, 31 Jul 2023 17:27:12 +0900)
          done = true;


          // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900
          // // The Logging Series No.2
          // context.logger.output({ type  : 'the_result_of_method_invocation', ...result, });
          // // The Logging Series No.3
          // (async()=>{
          //   console.log( LOG_PREFIX, 'http result:', result );
          // })().catch(err=>console.error(MSG_UNCAUGHT_ERROR,err) );
          // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900

          // Abort the process.
          return;
        }

      } catch ( err ) {
        /*
         * Processing an Unexpected Error
         */
        console.error( 'http-middleware detected an error', '6qbDKEbt6Y', err );

        try {
          // 8) Send the generated response.
          res.status(500).json( createErroneous( err ) ).end();

          done = true;
          // Abort the process.
          return;
        } catch (err) {
          console.error( 'http-middleware detected an internal error', 'pCzB87JiGgo', err );
        }

      } finally {
        try {
          if ( ! done ) {
            console.error( 'http-middleware detected an unexpected internal server error', 'v83dIlsq4' );
            if ( context ) {
              context.logger.output(
                {
                  type  : 'double_unexpected_error',
                  value : null,
                }
              );
            }
            res.status(500).json({
              status : 'error',
              value : {
                status_code : 500,
                reason : 'Unexpected Internal Server Error',
              },
            }).end();
            done=true;
          }
        } catch ( err ) {
          try {
            console.error( 'http-middleware detected a double unexpected internal server error', 'v83dIlsq4', err );
            if ( context ) {
              context.logger.output(
                {
                  type  : 'double_unexpected_error',
                  value : createErroneous( err ),
                }
              );
            }
          } catch (err) {
            console.error( 'http-middleware detected a triple unexpected internal server error', 'v83dIlsq4', err );
          }
        }

        // 9) close the indentation of the nested log.
        try {
          if ( context ) {
            context.logger.output({
              type: 'end_of_method_invocation',
              ...session_info,
            });
          }
        } catch ( err ) {
          console.error( 'http-middleware detected an unexpected internal server error', 'v83dIlsq4', err );
        }

        // 10) Output the log of the execution.
        try {
          if ( context != null ) {
            context.logger.reportResult( is_successful ?? false )
              // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
              // .then( err=>{console.log('logging finished');console.error('logging2',err)} )
              // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900
              .catch(err=>{console.error(MSG_UNCAUGHT_ERROR);console.error(err)});
          }
        } catch ( err ) {
          console.error( 'http-middleware detected an unexpected internal server error', 'v83dIlsq4', err );
        }

        try {
          if ( ! done ) {
            next();
          }
        } catch (err) {
          console.error( 'http-middleware detected a final error', err );
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
    res.status(404).json({status:'error', reason : 'not found' } ).end();
  });
  return router;
}

export { create_middleware as create };
export { create_middleware  };

