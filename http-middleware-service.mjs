
import { filenameOfSettings, asyncReadSettings } from 'asynchronous-context/settings' ;
import { dotenvFromSettings } from 'asynchronous-context/env';

import express    from 'express';
import cors       from 'cors' ;
import { startService  }                         from './service-utils.mjs';
import { loadContextFactory  }                   from './context-factory-loader.mjs' ;
import { create }                                from './http-middleware.mjs' ;

dotenvFromSettings();

/*
 *   default_cors_origins
 * ===========================================================================
 * This function is applied as the default function of the `cors` fiels in the
 * settings file.
 *
 */
function default_cors_origins( origin, callback ) {
  callback( null, /.*/ )
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
    ports               = [],
    cors_origins        = 'ALLOW_ALL',
    context_factory     = (()=>{throw new Error('context_factory is not defined')})(),
  } = serviceSettings;

  console.log( `Starting a middleware service with context_factory=${context_factory}` );


  if ( cors_origins === 'ALLOW_ALL' ) {
    console.error( 'WARNING : CORS SETTING WAS SPECIFIED "ALLOW_ALL". THIS CAUSES ALLOWING FOR ALL DOMAINS.' );
    cors_origins = default_cors_origins;
  }

  if ( ( ports.length ?? 0 ) < 1 ) {
    console.error( `WARNING field 'ports' is missing in the setting file '${filenameOfSettings()}' the default values are applied.` );
    ports = [ 2000 ];
  }


  const contextFactory = loadContextFactory( context_factory );

  const createApp = ()=>{
    // Initializing the app.
    const app = express();

    // app.use(require('morgan')('dev'));
    // << DISABLED Mon, 01 Jul 2024 18:33:57 +0900
    // app.use( (req,res,next)=>{
    //   console.log( 'req.path', req.path );
    //   next();
    // });
    // >> DISABLED Mon, 01 Jul 2024 18:33:57 +0900

    app.use(           cors( { origin : cors_origins } ) );
    app.use( '/api',   create( contextFactory )    );
    app.use( '/blank', (req,res,next)=>{
      res.json({status:'succeeded', value:'blank' }).end();
    });

    return app;
  };

  const server_list =[];
  return [
    {
      start: async ()=>{
        if ( server_list.length === 0 ) {
          for ( let i of ports ) {
            const app = await createApp();
            server_list.push(
              app.listen( i,
                () => {
                  console.log( `[asynchronous-context-rpc] an instance of asynchronous-context-web is listening at http://localhost:${i}` );
                }
              )
            );
          }
        }
      },
      stop : ()=>{
        server_list.forEach( e=>e.close() );
      },
    }
  ];
};

export { loadService };


const startHttpMiddlewareService = ()=>{
  const createService =
    async ()=>{
      const settings         = await asyncReadSettings();
      const serviceSettings  = settings?.async_context_backend ?? {};
      return loadService( serviceSettings );
    };

  startService( createService );
};

export { startHttpMiddlewareService as startService };


