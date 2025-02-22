import type { Meteor } from 'meteor/meteor';
import type { IncomingMessage, ServerResponse } from 'http';

/**
 * A dictionary of cookie values.
 */
export type CookieDict = { [key: string]: unknown };

declare module 'meteor/ostrio:cookies' {
  /**
   * Options for setting a cookie.
   */
  export interface CookieOptions {
    /**
     * The path where the cookie is valid (default: '/').
     */
    path?: string;
    /**
     * The domain where the cookie is valid.
     */
    domain?: string;
    /**
     * The expiration date as a Date object or a number representing a UNIX timestamp (in milliseconds).
     */
    expires?: Date | number;
    /**
     * If true, the cookie is inaccessible via JavaScript on the client.
     */
    httpOnly?: boolean;
    /**
     * If true, the cookie will only be transmitted over secure protocols.
     */
    secure?: boolean;
    /**
     * If true, the cookie is limited to first-party contexts.
     */
    firstPartyOnly?: boolean;
    /**
     * Controls whether the cookie is sent with cross-site requests.
     * Can be a boolean or one of 'Strict', 'Lax', or 'None'.
     */
    sameSite?: boolean | 'Strict' | 'Lax' | 'None';
    /**
     * Specifies the maximum age in seconds.
     */
    maxAge?: number;
  }

  /**
   * Options for configuring the CookiesCore class.
   */
  export interface CookiesCoreOptions {
    /**
     * Current cookies as a string (e.g., document.cookie) or as an object.
     */
    _cookies: string | CookieDict;
    /**
     * Default cookies expiration time (max-age) in milliseconds.
     * If false, the cookie lasts for the session.
     */
    TTL?: number | false;
    /**
     * If true, the Cookies classes will be exposed on the server.
     */
    runOnServer?: boolean;
    /**
     * HTTP server response object.
     */
    response?: ServerResponse;
    /**
     * If true, allow passing cookies via query string (used primarily in Cordova).
     */
    allowQueryStringCookies?: boolean;
    /**
     * A regular expression or boolean to allow cookies from specific origins.
     */
    allowedCordovaOrigins?: RegExp | boolean;
  }

  /**
   * Options for configuring the Cookies class (extends CookiesCoreOptions).
   */
  export interface CookiesOptions extends CookiesCoreOptions {
    /**
     * Auto-bind middleware to server requests (default: true).
     */
    auto?: boolean;
    /**
     * Custom middleware handler callback.
     */
    handler?: (cookies: CookiesCore) => void;
    /**
     * Callback invoked when cookies are received via send methods.
     */
    onCookies?: (cookies: CookiesCore) => void;
  }

  /**
   * Core cookie management class.
   *
   * Provides basic operations for reading, setting, removing,
   * and sending cookies.
   */
  export class CookiesCore {
    constructor(opts: CookiesCoreOptions);

    /**
     * Retrieves the value of a cookie.
     * @param key The name of the cookie.
     * @param _tmp Optional unparsed cookie string.
     * @returns The cookie value or undefined if not found.
     */
    get(key: string, _tmp?: string): string | undefined;

    /**
     * Creates or updates a cookie.
     * @param key The cookie name.
     * @param value The cookie value.
     * @param opts Optional cookie settings.
     * @returns True if the cookie was set successfully.
     */
    set(key: string, value: string, opts?: CookieOptions): boolean;

    /**
     * Removes a cookie by setting its expiration to a past date.
     * @param key The name of the cookie.
     * @param path Optional path (default: '/').
     * @param domain Optional domain.
     * @returns True if the cookie was removed successfully.
     */
    remove(key: string, path?: string, domain?: string): boolean;

    /**
     * Checks whether a cookie exists.
     * @param key The cookie name.
     * @param _tmp Optional unparsed cookie string.
     * @returns True if the cookie exists, false otherwise.
     */
    has(key: string, _tmp?: string): boolean;

    /**
     * Returns an array of all cookie names.
     * @returns An array of cookie keys.
     */
    keys(): string[];

    /**
     * Sends cookies to the server via XHR.
     * @param cb Optional callback invoked with (err, response).
     */
    send(cb?: (err?: Meteor.Error, response?: Response) => void): void;

    /**
     * Asynchronously sends cookies to the server via XHR.
     * @returns A promise that resolves to a Response.
     */
    sendAsync(): Promise<Response>;
  }

  /**
   * Main Cookies class.
   *
   * Extends CookiesCore with additional middleware integration
   * for server-side usage.
   */
  export class Cookies extends CookiesCore {
    constructor(opts?: CookiesOptions);

    /**
     * Returns a middleware function for integrating with a server.
     * @returns A middleware function with signature (req, res, next) => void.
     * @throws {Meteor.Error} If used on the client.
     */
    middleware(): (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void
    ) => void;
  }
}
