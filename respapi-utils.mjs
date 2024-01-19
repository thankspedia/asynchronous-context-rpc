

//
//  /*
//   * These steps which are done in this block `context_initializer` should be
//   * shared for the sake of maintainability. (Thu, 21 Dec 2023 15:27:24 +0900)
//   */
//
// Now it's implemented. Wed, 17 Jan 2024 15:55:53 +0900

export function set_default_context_options( context, resolved_callapi_method, additional_default_options ) {
  const default_options = { showReport : true, coloredReport : true };

  /*
   * All String values on the tags are passed to options on the given
   * context object.  This code is used especially to pass
   * AUTO_COMMIT/AUTO_CONNECT to respapi. Which is defined in the
   * module `database-postgresql-context`
   * Wed, 17 Jan 2024 15:14:53 +0900
   */
  const dynamically_specified_options =
    resolved_callapi_method.tags.reduce( (accum,curr)=> accum[curr]=true && accum , {} );

  context.setOptions(
    {
      ...default_options,
      ...additional_default_options,
      ...dynamically_specified_options,
    }
  );

  //
  // if ( resolved_callapi_method.tags.includes( AUTO_COMMIT ) ) {
  //   console.log( 'ew6pMCEV3o', resolved_callapi_method );
  //   context.setOptions({ autoCommit : true });
  //   console.log( 'ew6pMCEV3o', context.getOptions() );
  // }
  //

}
