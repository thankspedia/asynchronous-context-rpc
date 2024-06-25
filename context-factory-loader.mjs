
function purgeRequireCache() {
  // TODO
  // Object.entries( require.cache ).map( ([key,value])=>{
  //
  //   delete require.cache[ key ];
  // });
}

export function loadContextFactory( /* the package name of */ context_factory = {}) {
  if ( typeof context_factory?.path  !== 'string' || context_factory?.path.trim().length === 0 ) {
    throw new Error( `package name is invalid : the specified value '${ context_factory?.path }' is '${typeof context_factory?.path }'` );
  }

  const url_to_context_factory =
    new URL( context_factory?.path,
      ...(
        typeof process === 'object' ? [ new URL( process?.cwd() + '/' , 'file://' ) ] : [ document.baseURI ]
      )
    );

  const result = (
    async function() {
      if ( context_factory?.options?.purge_require_cache ) {
        purgeRequireCache();
      }

      try {
        // always get fresh, and the latest createContext() function
        return (await import( context_factory?.path )).createContext().setOptions( context_factory?.options );;
      } catch ( e1 ) {
        try {
          // always get fresh, and the latest createContext() function
          return (await import( url_to_context_factory )).createContext().setOptions( context_factory?.options );
        } catch ( e2 ) {
          console.error( 'context-factory-loader:failed to load', context_factory?.path );
          console.error( 'error1',  e1.code );
          console.error( 'error2',  e2.code );
          throw new Error( `context-factory-loader : could not load the specified context-factory (${context_factory?.path}): 1st error : ${e1.message} and 2nd error :${e2.message} `  , {cause:e2});
        }
      }
    }
  );

  // Check if the created loader works properly.
  result()
    .then(
      e=>console.log(
        `\n`+
        `context_factory(${context_factory?.path}) seems okay`
      )
    ).catch(
      e=>console.error(
        'loadContextFactory() initialization error :',
        e,
        `\n${'='.repeat(100)}\nNote that this error was reported asynchronously;`+
        `the error was ignored and continued the process.\n${'='.repeat(100)}\n` )
    );
  return result;
}

