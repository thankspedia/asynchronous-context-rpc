
import { startService, createLoadServiceAfterReadSettings } from './service-utils.mjs';
import { loadService as httpLoadService }                   from './http-middleware-service.mjs' ;
import { loadService as wsLoadService   }                   from './ws-backend-respapi-service.mjs' ;
import { loadService as cliLoadService   }                  from './cli-service.mjs' ;


const serviceMap = {
  http : httpLoadService,
  ws   : wsLoadService,
  cli  : cliLoadService,
};

const loadService = ( settings )=>{
  const listOfServiceSettings = settings?.async_context_rpc.services ?? [];
  if ( ! Array.isArray( listOfServiceSettings ) ){
    throw new Error( 'async_context_rpc.services must be an array' );
  }
  if ( listOfServiceSettings.length === 0 ) {
    console.error( 'no service is defined.' );
  }

  let serviceList = [];
  console.log( listOfServiceSettings );
  for ( const serviceSettings of listOfServiceSettings  ) {
    const {
      type = 'unknown',
    } = serviceSettings;

    if ( type === 'unknown' ) {
      throw new Error( `"type" is not defined in a service definition` );
    }

    if ( ! ( type in serviceMap ) ) {
      throw new Error( `an unknown service type "${type}" was found in a service definition` );
    }
    const loadService = serviceMap[type];
    serviceList = [ ...serviceList, ...loadService( serviceSettings ) ];
  }

  return serviceList;
};

function startAllService() {
  startService(
    createLoadServiceAfterReadSettings(
      loadService ));
}
export { startAllService as startService };

