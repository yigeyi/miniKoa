let http = require('http');
let context = require('./context');
let request = require('./request');
let response = require('./response');
let EventEmitter = require('events');
// class Application extends EventEmitter {},

class Application {
  constructor(props) {
    this.callbackFunc;
    this.context = Object.create(context)
    this.request = Object.create(request);
    this.response = Object.create(response);
    this.middlewares = []
  }
  listen(port) {
    let server = http.createServer(this.callback());
    server.listen(port);
  }


  use(fn) {
    this.callbackFunc = fn;
    this.middlewares.push(fn)
  }



//中间件
  compose() {
    return async ctx => {
      function createNext(middleware, oldNext) {
        return async () => {
          await middleware(ctx, oldNext);
        }
      }
      console.log('this.middlewares', this.middlewares)
      let len = this.middlewares.length;
      let next = async () => {
        return Promise.resolve();
      };
      for (let i = len - 1; i >= 0; i--) {
        let currentMiddleware = this.middlewares[i];
        next = createNext(currentMiddleware, next);
      }
      await next();
    };
  }

  callback() {
    return (req, res) => {
      let ctx = this.createContext(req, res);
      let respond = () => this.response(ctx);
      let onerror = (err) => this.onerror(err, ctx);
      let fn = this.compose();
      // return fn(ctx).then(respond).catch(onerror);
      return fn(ctx)
    };
  }


  createContext(req, res) {
    let ctx = Object.create(this.context);
    ctx.request = Object.create(this.request);
    ctx.response = Object.create(this.response);
    ctx.req = ctx.request.req = req;
    ctx.res = ctx.response.res = res;
    return ctx;
  }
}
module.exports = Application
