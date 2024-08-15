const DEBUG = false;

import { shutdownDatabaseContext } from 'database-postgresql-context' ;
import { filenameOfSettings, asyncReadSettings } from 'asynchronous-context/settings' ;
import { dotenvFromSettings } from 'asynchronous-context/env';

import { startService  }                         from './service-utils.mjs';
import { loadContextFactory  }                   from './context-factory-loader.mjs' ;
import repl from 'node:repl';

dotenvFromSettings();



async function execute ( createContext, filename ) {

  async function tbc(fn) {
    console.log( `execute a specified file ${filename}` );
    const context = await createContext();
    await context.executeTransaction(fn);
    await context.logger.reportResult(true);
  }

  function initializeContext(context) {
    context.tbc = tbc;
    context.createContext = createContext;
  }


  if ( ! filename ) {
    const replInstance = repl.start('> ')
    initializeContext( replInstance.context );
    replInstance.on( 'reset', initializeContext );

  } else {
    try {
      try {
        let full_filename = (await import('path')).join( (await import( 'process' )).cwd() , filename );
        full_filename = await import.meta.resolve( full_filename );
        filename = full_filename;
      } catch (e){
        // filename = require('path').join( require( 'process' ).cwd() , filename );
      }
      await tbc( ( await import( filename ) ).default );
    } catch (e) {
      console.error(e);
    } finally {
      shutdownDatabaseContext();
    }
  }
}


/*
 *   loadService()
 * =============================================================================
 * loadService : function(
 *   input: array(
 *     serviceSettings : object(
 *     ),
 *   )
 *   output : array_of(
 *     object(
 *       start : function(),
 *       stop  : function(),
 *     ),
 *   ),
 * )
 */
const loadService = ( argv, serviceSettings )=>{
  let {
    context_factory     = (()=>{throw new Error('context_factory is not defined')})(),
  } = serviceSettings;

  console.log( `Starting a middleware service with context_factory=${context_factory}` );

  const createContext = loadContextFactory( context_factory );

  const server_list =[];
  return [
    {
      start: async ()=>{
        execute( createContext, argv.shift() );
      },
      stop : ()=>{
        shutdownDatabaseContext();
      },
    }
  ];
};

export { loadService };

const startCliService = ()=>{
  const createService =
    async ()=>{
      const settings         = await asyncReadSettings();
      const serviceSettings  = settings?.async_context_backend ?? {};
      return loadService( [], serviceSettings );
    };

  startService( createService );
};

export { startCliService as startService };


