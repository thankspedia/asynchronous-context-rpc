
import { useWebSocketTether } from 'ws-tether/hook';
import {
  create_tether_configs_of_ws_frontend_respapi,
} from "asynchronous-context-rpc/ws-frontend-respapi";

/*
 * A Helper Function for React
 */
export function useRespapiWebSocketTether(...args) {
  return useWebSocketTether(
    create_tether_configs_of_ws_frontend_respapi(...args)
  );
}

