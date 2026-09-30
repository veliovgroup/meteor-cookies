import type { IncomingMessage, ServerResponse } from 'http';
import { expectAssignable, expectType } from 'tsd';
import {
  Cookies,
  CookiesCore,
  type CookieDict,
  type CookieMiddleware,
  type CookieRequest,
  type CookieResponse,
  type CookieValue,
  type MeteorError
} from 'meteor/ostrio:cookies';

const dict: CookieDict = {
  string: 'value',
  number: 42,
  falseValue: false,
  trueValue: true,
  nullValue: null,
  objectValue: {
    nested: 'value'
  },
  arrayValue: [true, 'value', { nested: 1 }]
};

expectAssignable<CookieValue>(dict);

const core = new CookiesCore({
  _cookies: dict,
  TTL: false,
  setCookie: true,
  response: {
    setHeader(_name, _value) {},
    getHeader(_name) {
      return ['cookie=value; Path=/'];
    }
  }
});

expectType<CookieValue | undefined>(core.get('string'));
expectType<string | undefined>(core.get<string>('string'));
expectType<boolean>(core.set('objectValue', { nested: 'value' }, {
  expires: Infinity,
  expire: Date.now(),
  httpOnly: true,
  sameSite: 'Lax',
  partitioned: true,
  priority: 'High'
}));
expectType<boolean>(core.remove());
expectType<boolean>(core.has('string'));
expectType<string[]>(core.keys());
expectType<void>(core.send((err?: MeteorError, response?: Response) => {
  expectAssignable<MeteorError | undefined>(err);
  expectAssignable<Response | undefined>(response);
}));
expectType<Promise<Response>>(core.sendAsync());

const cookies = new Cookies({
  auto: false,
  runOnServer: true,
  allowQueryStringCookies: true,
  allowedCordovaOrigins: /^http:\/\/localhost:12[0-9]{3}$/,
  handler(instance) {
    expectType<CookiesCore>(instance);
  },
  async onCookies(instance) {
    expectType<CookiesCore>(instance);
  }
});

expectType<string>(cookies.NAME);
expectType<CookieResponse | false>(cookies.response);
expectType<boolean>(cookies.isDestroyed);
expectType<boolean>(Cookies.isMiddlewareRegistered);
expectType<boolean>(cookies.destroy());
expectType<CookieMiddleware>(cookies.middleware());

const request: CookieRequest = {
  headers: {
    cookie: 'key=value'
  },
  Cookies: core
};
const response: CookieResponse = {
  req: request,
  setHeader(_name, _value) {}
};

expectAssignable<CookieRequest>(request);
expectAssignable<CookieResponse>(response);

declare const req: IncomingMessage;
declare const res: ServerResponse;
expectType<CookiesCore | undefined>(req.Cookies);

// Node.js request and response are accepted without casts
expectAssignable<CookieRequest>(req);
expectAssignable<CookieResponse>(res);
expectType<CookiesCore>(new CookiesCore({ _cookies: req.headers.cookie || '', response: res }));

// Middleware is accepted by Connect-style `WebApp.connectHandlers.use()`
type ConnectHandler = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void;
expectAssignable<ConnectHandler>(cookies.middleware());
