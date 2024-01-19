
function purgeRequireCache() {
  // TODO
  // Object.entries( require.cache ).map( ([key,value])=>{
  //
  //   delete require.cache[ key ];
  // });
}

export function loadContextFactory( /* the package name of */ path_to_context_factory, purge_require_cache ) {
  if ( typeof path_to_context_factory  !== 'string' || path_to_context_factory.trim().length === 0 ) {
    throw new Error( `package name is invalid : the specified value '${ path_to_context_factory }' is '${typeof path_to_context_factory }'` );
  }

  const url_to_context_factory =
    new URL( path_to_context_factory,
      ...(
        typeof process === 'object' ? [ new URL( process?.cwd() + '/' , 'file://' ) ] : [ document.baseURI ]
      )
    );

  if ( typeof purge_require_cache  !== 'boolean' ) {
    throw new Error( `purge_require_cache is invalid : the specified value '${ purge_require_cache }' is '${typeof purge_require_cache }'` );
  }

  const result = (
    async function() {
      if ( purge_require_cache ) {
        purgeRequireCache();
      }

      try {
        // always get fresh, and the latest createContext() function
        return (await import( path_to_context_factory )).createContext();
      } catch ( e1 ) {
        try {
          // always get fresh, and the latest createContext() function
          return (await import( url_to_context_factory )).createContext();
        } catch ( e2 ) {
          console.error( 'context-factory-loader:failed to load', path_to_context_factory );
          throw new Error( `context-factory-loader : could not load the specified context-factory (${path_to_context_factory}): 1st error : ${e1.message} and 2nd error :${e2.message} `  , {cause:e2});
        }
      }
    }
  );

  // Check if the created loader works properly.
  result()
    .then(
      e=>console.log(
        `\n`+
        `context_factory(${path_to_context_factory}) seems okay`
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

