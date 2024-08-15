const DEBUG = false;

import { filenameOfSettings, asyncReadSettings } from 'asynchronous-context/settings' ;
import { dotenvFromSettings } from 'asynchronous-context/env';

import { startService  }                         from './service-utils.mjs';
import { loadContextFactory  }                   from './context-factory-loader.mjs' ;

dotenvFromSettings();


async function tbc(f) {
  console.log( 'tbc(f)', f );
  const context = await createContext();
  await context.executeTransaction(f);
  await context.logger.reportResult(true);
}

function initializeContext(context) {
  context.tbc = tbc;
  context.createContext = createContext;
}

async function execute () {
  const argv =  process.argv.slice(2);
  if ( argv.length == 0 ) {
    const replInstance = repl.start('> ')
    initializeContext( replInstance.context );
    replInstance.on( 'reset', initializeContext );

  } else {
    try {
      let  f = argv[0];
      try {
        let ff = (await import('path')).join( (await import( 'process' )).cwd() , f );
        ff = await import.meta.resolve( ff );
        f = ff;
      } catch (e){
        // f = require('path').join( require( 'process' ).cwd() , f );
      }
      await tbc( ( await import( f ) ).default );
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
const loadService = ( serviceSettings )=>{
  let {
    context_factory     = (()=>{throw new Error('context_factory is not defined')})(),
  } = serviceSettings;

  console.log( `Starting a middleware service with context_factory=${context_factory}` );

  const createContext = loadContextFactory( context_factory );

  const server_list =[];
  return [
    {
      start: async ()=>{
        execute();
      },
      stop : ()=>{
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
      return loadService( serviceSettings );
    };

  startService( createService );
};

export { startCliService as startService };


