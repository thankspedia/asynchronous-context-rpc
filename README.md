
 Asynchronous-Context-RPC
================================================================================

This is an Web API framework which is resembling to traditional Remote Procedure
Call.  This module is developed as a subproject of [Kombucha.js][kombucha]
framework. For further information, see the documentation of [Kombucha.js][kombucha].


[kombucha]:                          https://github.com/kombucha-js/
[rerenderers]:                       https://github.com/kombucha-js/react-rerenderers/
[react-rerenderers]:                 https://github.com/kombucha-js/react-rerenderers/
[asynchronous-context]:              https://github.com/kombucha-js/asynchronous-context/
[asynchronous-context-rpc]:          https://github.com/kombucha-js/asynchronous-context-rpc/
[prevent-undefined]:                 https://github.com/kombucha-js/prevent-undefined/
[fold-args]:                         https://github.com/kombucha-js/fold-args/
[runtime-typesafety]:                https://github.com/kombucha-js/runtime-typesafety/
[database-postgresql-query-builder]: https://github.com/kombucha-js/database-postgresql-query-builder/
[vanilla-schema-validator]:          https://github.com/kombucha-js/vanilla-schema-validator/
[sql-named-parameters]:              https://github.com/kombucha-js/sql-named-parameters/
[sqlmacro]:                          https://github.com/kombucha-js/sqlmacro/
[mixin-prototypes]:                  https://github.com/kombucha-js/mixin-prototypes/
[authentication-context]:            https://github.com/kombucha-js/authentication-context/
[database-postgresql-context]:       https://github.com/kombucha-js/database-postgresql-context/
[crypto-web-token]:                  https://github.com/kombucha-js/crypto-web-token/
[randomcat]:                         https://github.com/kombucha-js/randomcat/
[beep]:                              https://github.com/kombucha-js/beep/


 Command Utilities
------------------
- bin/start-service.js

```sh
SETTINGS='path-to-settings-file.settings' start-service
```

```javascript
  require( 'asynchronous-context/settings' ).filenameOfSettings( './ws-callapi-test-context-factory.settings.json' );
```


 API Reference
---------------
Coming soon.


 History
---------------
- (Mon, 16 Oct 2023 19:52:10 +0900) Create `README.md`.
- (Wed, 18 Oct 2023 20:42:04 +0900) Removed unnecessary files from the package.



 Memo
--------------------------------------------------------------------------------

### How to call a method in http method  GET


```
const result = await backend.OVERRIDE({method:'GET'}).call_method_foo_bar( 1,2,3 );
```

This feature was added on (Thu, 18 May 2023 18:10:37 +0900)



### `REQUEST` to `OVERRIDE` ###
`OVERRIDE` was formerly `REQUEST`; it is modified on (Thu, 01 Jun 2023 14:59:25 +0900).




