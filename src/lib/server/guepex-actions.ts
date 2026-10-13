import { createServerFn } from "@tanstack/react-start";
import type { CreateParcelResult } from "./guepex-server";

/**
 * Client-callable carrier actions.
 *
 * This file deliberately has NO `server-only` marker. It is imported by a client
 * component, and `createServerFn` is the bridge that makes that safe: the handler
 * body runs on the server and the client receives an RPC stub.
 *
 * The secret-touching module is pulled in with a dynamic import *inside* the
 * handler, so it is never on a static path from client code. Putting the marker
 * here instead of on that module is what broke the build the first time, and the
 * import-protection plugin was right to refuse it.
 */

export const createParcelForOrder = createServerFn({ method: "POST" })
  .validator((input: { orderId: string; accessToken: string }) => input)
  .handler(async ({ data }): Promise<CreateParcelResult> => {
    const { runCreateParcel } = await import("./guepex-server");
    return runCreateParcel(data);
  });
