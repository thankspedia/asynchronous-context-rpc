
import { schema                               }     from   'vanilla-schema-validator'  ;
import { typesafe_function, get_typesafe_tags }     from   'runtime-typesafety'  ;


schema.define`
  t_resolved_callapi_method : object(
    status : and(
      string(),
      or(
        equals( <<'found'>>     ),
        equals( <<'not_found'>> ),
        equals( <<'forbidden'>> ),
      ),
    ),
    value  : or(
      null(),
      function(),
    ),
    tags                       : array_of( string() ),
    actual_method_path         : array_of( string() ),
    callapi_method_path        : array_of( string() ),
    actual_method_path_string  : string(),
    callapi_method_path_string : string(),
    callapi_target             : object(),
  )
`;

/**
 * status : 'found'
 *          'forbidden'
 *          'not_found'
 */
const resolve_callapi_method_path = typesafe_function(
  function resolve_callapi_method_path( callapi_target, callapi_method_path, required_typesafe_tag ) {
    const accumlator = {
      status               : 'found',
      value                : callapi_target,
      tags                 : [],
      actual_method_path   : [], // was valid_prop_name_list (Fri, 02 Jun 2023 13:12:29 +0900)
    };

    const finallization = (r)=>{
      r.callapi_target             = callapi_target;
      r.callapi_method_path        = [ ... callapi_method_path ];
      r.callapi_method_path_string = callapi_method_path.join('.');
      r.actual_method_path_string  = r.actual_method_path.join('.');
      return r;
    };

    const result = callapi_method_path.reduce((accumlator,prop_name)=>{
      if ( prop_name === undefined || prop_name === null ) {
        throw new ReferenceError( `internal error; prop_name value should not be undefined or null ${prop_name}` );
      } else if ( accumlator.status !== 'found' ) {
        // CONDITION_ABOVE
        return accumlator;
      } else if ( prop_name in accumlator.value ) {
        const next_value = accumlator.value[prop_name];
        const tags       = next_value ? ( get_typesafe_tags( next_value ) ?? [] ) : [];

        if ( tags.includes( required_typesafe_tag ) ) {
          return {
            status             : 'found',
            value              : next_value,
            tags               : tags,
            actual_method_path : [ ...accumlator.actual_method_path  , prop_name ],
          };
        } else {
          return {
            status             : 'forbidden', // see the CONDITION_ABOVE
            value              : null,
            tags               : tags,
            actual_method_path : [ ...accumlator.actual_method_path  , prop_name ],
          };
        }
      } else {
        return {
          status         : 'not_found', // see the CONDITION_ABOVE
          value          : null,
          tags           : [],
          actual_method_path   : accumlator.actual_method_path  ,
        };
      }
    }, accumlator );

    return finallization(result);

  },{
    typesafe_input : schema.compile`
      array(
        callapi_target        : object(),
        callapi_method_path   : array_of( string() ),
        required_typesafe_tag : string()
      ),
    `,
    typesafe_output : schema.compile`t_resolved_callapi_method()`,
  }
);
export { resolve_callapi_method_path };


const RESPAPI_DEFAULT_EVENT_HANDLERS = {
  on_execution : async ( resolved_callapi_method, callapi_method_args )=>{
    const callapi_target = resolved_callapi_method.callapi_target;
    const target_method  = resolved_callapi_method.value;
    return await (callapi_target.executeTransaction( target_method, ... callapi_method_args ));
  },
  on_before_execution : async( resolved_callapi_method, callapi_method_args )=>{
  },
  on_after_execution : async( resolved_callapi_method, callapi_method_args )=>{
  },
};

const respapi = typesafe_function(
  async function respapi( callapi_target, callapi_method_path, callapi_method_args, required_typesafe_tag, event_handlers ) {
    if ( event_handlers === null || event_handlers === undefined ) {
      event_handlers = {};
    } else if ( typeof event_handlers === 'function' ) {
      const on_execution = event_handlers;
      event_handlers = {
        on_execution,
      };
    } else if ( typeof event_handlers !== 'object' ) {
      throw new Error( 'event_handlers must be eitehr an object or a function.' );
    };

    if ( typeof event_handlers.on_execution !== 'function' ) {
      event_handlers.on_execution = RESPAPI_DEFAULT_EVENT_HANDLERS.on_execution;
    }
    if ( typeof event_handlers.on_before_execution !== 'function' ) {
      event_handlers.on_before_execution = RESPAPI_DEFAULT_EVENT_HANDLERS.on_before_execution;
    }
    if ( typeof event_handlers.on_after_execution !== 'function' ) {
      event_handlers.on_after_execution = RESPAPI_DEFAULT_EVENT_HANDLERS.on_after_execution;
    }

    const resolved_callapi_method = resolve_callapi_method_path( callapi_target, callapi_method_path, required_typesafe_tag );
    let result = null;

    if ( resolved_callapi_method.status === 'found' ) {

      // on_before_execution()
      try {
        await event_handlers.on_before_execution( resolved_callapi_method, callapi_method_args );
      } catch (e) {
        // TODO
        console.error( 'cykc65ZSgBrIb/SUA6Z0XQ==', e );
      }

      try {
        // on_execution()
        const value = await event_handlers.on_execution( resolved_callapi_method, callapi_method_args );

        result = {
          ...resolved_callapi_method,
          status : 'succeeded',
          value  : value,
        };
      } catch (err) {
        // console.error('pd9ZpaS53L8',err);
        result = {
          ...resolved_callapi_method,
          status : 'error',
          value  : err,
        };
      }

      try {
        // on_after_execution()
        await event_handlers.on_after_execution( resolved_callapi_method, callapi_method_args );
      } catch (e) {
        // TODO
        console.error( 'wv7tfL2A/lVb5LnQXip4hA==', e );
      }

    } else {
      result ={
        ...resolved_callapi_method,
      };
    }

    return result;

  }, {
    typesafe_input : schema.compile`
      array(
        callapi_target        : object(),
        callapi_method_path   : array_of( string() ),
        callapi_method_args   : array_of( any() ),
        required_typesafe_tag : string(),
        event_handlers        : or(
          undefined(),
          null(),
          function(),
          object(
            on_before_execution: or( function(), undefined() ),
            on_execution:        or( function(), undefined() ),
            on_after_execution:  or( function(), undefined() ),
          ),
        ),
      ),
    `,
    typesafe_output : schema.compile`
      object(
        status : and(
          string(),
          or(
            equals( <<'succeeded'>> ),
            equals( <<'error'>>     ),
            equals( <<'not_found'>> ),
            equals( <<'forbidden'>> ),
          ),
        ),
        value  : any(),
        tags                       : array_of( string() ),
        actual_method_path         : array_of( string() ),
        callapi_method_path        : array_of( string() ),
        actual_method_path_string  : string(),
        callapi_method_path_string : string(),
      )
    `,
  }
);

export { respapi };




const t_respapi_message = schema.compile`
  object(
    command_type : string(),
    command_value : object(
      method_path : array_of( string() ),
      method_args : array_of( any() ),
    ),
  )
`();
export { t_respapi_message };



