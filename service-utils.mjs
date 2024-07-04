const DEBUG = false;

import process    from 'process' ;
import { readSettings } from 'asynchronous-context/settings' ;
import { filenameOfSettings } from 'asynchronous-context/settings' ;

import { schema } from 'vanilla-schema-validator' ;
import { typesafe_function } from 'runtime-typesafety' ;
import { preventUndefined } from 'prevent-undefined' ;
import { startFileSytemWatchdog } from './fs-watchdog.mjs' ;

// (await import( './schema.mjs' )).init( schema );
// (await import ( 'authentication-context/schema.js' )).init( schema );


/*
 *   startService()
 * =========================================================================
 *
 * `startService()` function is a utility to start ``servers'' as a service.
 * In this context, a service is an object which can be shut down or restarted.
 *
 * The purpose of this utility is to restart the given servers whenever any
 * file updates were occurred in the file system. If you do not need restarting
 * the servers in order to follow any file updates, it is sufficient to call
 * the `createService()` function to start the service.
 *
 * startService : function(
 *   input : array(
 *     createService : function(
 *       input : array(),
 *       output: array_of(
 *         object(
 *           start : function(),
 *           stop : function(),
 *         ),
 *       ),
 *     ),
 *   ),
 *   output : object(
 *     shutdown: function(),
 *     restart : function(),
 *   ),
 * )
 */
function startService( __createService ) {
  const createService = typesafe_function( __createService, {
    typesafe_input : schema.compile`array()`,
    typesafe_output : schema.compile`array_of(
      object(
        start : function(),
        stop : function(),
      ),
    )`,
  });

  /*
   * THIS is very important. Don't forget to set this; otherwise you'll get
   * unexpected shutdown of the node instance that you started.
   *
   * See : https://www.google.com/search?gl=us&q=unhandledRejection
   */
  if ( DEBUG ) console.info( '[asynchronous-context-rpc] unhandled rejection handler is configured' );
  process.on( 'unhandledRejection', (reason, p) =>{
    console.error( '***Unhandled Rejection at Promise***','reason:', reason, 'promise:', p );
  });

  if ( DEBUG ) console.info( '[asynchronous-context-rpc] uncaught exception handler is configured' );
  process.on( 'uncaughtException', (err, origin) =>{
    console.error( '***Unhandled Exception***',
      `Caught exception: ${err}\n` +
      `Exception origin: ${origin}` );
  });

  let serverList = [];

  const asyncRestartServices = async ()=>{
    console.log( '[asynchronous-context-rpc] a watchdog detected updating file... restarting the server.' );
    serverList.forEach( e=>e.stop() );
    serverList.length = 0;
    serverList.push( ...(await createService()) );
    serverList.forEach( e=>e.start() );
  };

  const asyncShutdownServices = async ()=>{
    console.log( '[asynchronous-context-rpc] stop the service.' );
    serverList.forEach( e=>e.stop() );
    serverList.length = 0;
  };

  const watchdog =
    startFileSytemWatchdog( asyncRestartServices, './' );

  return {
    shutdown : ()=>{
      try{
        asyncShutdownServices();
      } catch (e){
        console.error(e);
      }
      try{
        watchdog.shutdown();
      } catch (e){
        console.error(e);
      }
    },
    restart  : asyncRestartServices,
  };
}
export { startService };


/*
 * createLoadServiceAfterReadSettings()
 * =====================================================================================
 *
 * Wrap the given loadService() function with a function that automatically
 * loads the current settings file and pass it to the `loadService()` function.
 */
const createLoadServiceAfterReadSettings = (loadService)=>{
  function loadServiceAfterReadSettings() {
    return loadService( readSettings() );
  };
  return loadServiceAfterReadSettings;
};
export { createLoadServiceAfterReadSettings };


/*
 * validateSettings()
 * ==================================================================================
 * This function is not used anymore.
 */
const validateSettings = (settings) =>{
  return  preventUndefined( settings ,  schema.t_async_context_service_settings() );
};


