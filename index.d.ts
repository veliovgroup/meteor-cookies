declare module 'meteor/ostrio:cookies' {
  /**
   * Primitive cookie values supported by ostrio:cookies.
   */
  export type CookiePrimitive = string | number | boolean | null;

  /**
   * Cookie values supported by ostrio:cookies.
   */
  export type CookieValue = CookiePrimitive | CookieDict | CookieValue[];

  /**
   * A dictionary of cookie values.
   */
  export interface CookieDict {
    [key: string]: CookieValue | undefined;
  }

  /**
   * Minimal Meteor.Error-compatible shape returned by client sync methods.
   */
  export interface MeteorError extends Error {
    error?: string | number;
    reason?: string;
    details?: string;
  }

  /**
   * Minimal request shape used by middleware and handlers.
   */
  export interface CookieRequest {
    headers?: {
      cookie?: string;
      origin?: string;
      [key: string]: string | string[] | undefined;
    };
    query?: {
      ___cookies___?: string;
      [key: string]: string | string[] | undefined;
    };
    url?: string;
    originalUrl?: string;
    _parsedUrl?: {
      path?: string;
    };
    Cookies?: CookiesCore;
    [key: string]: unknown;
  }

  /**
   * Minimal response shape used by CookiesCore.
   */
  export interface CookieResponse {
    req?: CookieRequest;
    setHeader(name: string, value: string | string[]): void;
    getHeader?(name: string): string | number | string[] | undefined;
    [key: string]: unknown;
  }

  /**
   * Middleware next callback.
   */
  export type NextFunction = () => void;

  /**
   * Connect-style middleware returned by Cookies#middleware().
   */
  export type CookieMiddleware = (
    req: CookieRequest,
    res: CookieResponse,
    next: NextFunction
  ) => void | Promise<void>;

  /**
   * Options for setting a cookie.
   */
  export interface CookieOptions {
    /**
     * Cookie path. Defaults to '/'.
     */
    path?: string;
    /**
     * Cookie domain.
     */
    domain?: string;
    /**
     * Cookie expiration as Date, UNIX timestamp in milliseconds, 0, or Infinity.
     */
    expires?: Date | number;
    /**
     * Deprecated alias for expires.
     */
    expire?: Date | number;
    /**
     * If true, cookie is inaccessible via JavaScript on the client.
     */
    httpOnly?: boolean;
    /**
     * If true, cookie is transmitted only over secure protocols.
     */
    secure?: boolean;
    /**
     * Deprecated. Use sameSite instead.
     */
    firstPartyOnly?: boolean;
    /**
     * Controls whether cookie is sent with cross-site requests.
     */
    sameSite?: boolean | 'Strict' | 'Lax' | 'None';
    /**
     * Maximum age in seconds.
     */
    maxAge?: number;
    /**
     * Adds Partitioned attribute to Set-Cookie header.
     */
    partitioned?: boolean;
    /**
     * Adds Priority attribute to Set-Cookie header.
     */
    priority?: 'low' | 'Low' | 'medium' | 'Medium' | 'high' | 'High';
  }

  /**
   * Options for configuring CookiesCore.
   */
  export interface CookiesCoreOptions {
    /**
     * Current cookies string or object.
     */
    _cookies?: string | CookieDict;
    /**
     * Instance identification name.
     */
    name?: string;
    /**
     * Set to true when _cookies comes from Set-Cookie header.
     */
    setCookie?: boolean;
    /**
     * Default cookie expiration time in milliseconds. false means session cookie.
     */
    TTL?: number | false;
    /**
     * Enables client send/sendAsync server sync.
     */
    runOnServer?: boolean;
    /**
     * HTTP server response object.
     */
    response?: CookieResponse;
    /**
     * Allow passing cookies via query string, primarily for Cordova/Desktop.
     */
    allowQueryStringCookies?: boolean;
    /**
     * Allow Cordova/Desktop query-string cookies from matching origins.
     */
    allowedCordovaOrigins?: RegExp | boolean;
  }

  /**
   * Options for configuring Cookies.
   */
  export interface CookiesOptions extends CookiesCoreOptions {
    /**
     * Auto-bind middleware to server requests. Defaults to true.
     */
    auto?: boolean;
    /**
     * Custom middleware handler callback.
     */
    handler?: (cookies: CookiesCore) => void | Promise<void>;
    /**
     * Callback invoked when cookies are received via send/sendAsync.
     */
    onCookies?: (cookies: CookiesCore) => void | Promise<void>;
  }

  /**
   * Core cookie management class.
   */
  export class CookiesCore {
    constructor(opts?: CookiesCoreOptions);

    /**
     * Retrieves cookie value.
     */
    get<T extends CookieValue = CookieValue>(key: string, _tmp?: string): T | undefined;

    /**
     * Creates or updates cookie.
     */
    set(key: string, value: CookieValue, opts?: CookieOptions): boolean;

    /**
     * Removes one cookie or all cookies when key is omitted.
     */
    remove(key?: string, path?: string, domain?: string): boolean;

    /**
     * Checks whether cookie exists.
     */
    has(key: string, _tmp?: string): boolean;

    /**
     * Returns all readable cookie names.
     */
    keys(): string[];

    /**
     * Sends cookies to server via fetch callback API.
     */
    send(cb?: (err?: MeteorError, response?: Response) => void): void;

    /**
     * Sends cookies to server via fetch promise API.
     */
    sendAsync(): Promise<Response>;
  }

  /**
   * Main Cookies class with server middleware integration.
   */
  export class Cookies extends CookiesCore {
    constructor(opts?: CookiesOptions);

    /**
     * Returns Connect-style middleware.
     */
    middleware(): CookieMiddleware;

    /**
     * Unregisters hooks, callbacks, and middleware state for this instance.
     */
    destroy(): boolean;
  }
}

declare module 'http' {
  interface IncomingMessage {
    Cookies?: import('meteor/ostrio:cookies').CookiesCore;
  }

  interface ServerResponse {
    req?: IncomingMessage;
  }
}
