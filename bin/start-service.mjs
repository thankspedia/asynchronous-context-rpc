#!/bin/env node

import { startService } from 'asynchronous-context-rpc/service';

const show_help = ()=>{
  console.log( 'start-service run [service-name [...service-name]]' );
};

(()=>{
  const argv = [... process.argv ];
  argv.shift();
  argv.shift();

  const verb = argv.shift();

  const service_names = [];

  /*
   * Add all elements until '-' is found.
   */
  while ( 0<argv.length ) {
    const name = argv.shift()?.trim?.() ?? null;
    if ( name === '-' ) {
      break;
    }
    service_names.push( name );
  }

  if ( verb ) {
    switch (verb) {
      case 'run' :
        startService( argv, (name)=>  service_names.includes(name) );
        break;
      case 'run-all' :
        startService( argv, (name)=>true );
        break;
        break;
      case 'run-except' :
        startService( argv, (name)=>! service_names.includes(name)  );
        break;
      default :
        show_help();
        break;
    }

  } else {
    show_help();
  }
})();




  // require( 'asynchronous-context-rpc/http-middleware-service' ).bootService();
  // require( 'asynchronous-context-rpc/ws-backend-respapi-service' ).bootService();

