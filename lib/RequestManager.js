export default class RequestManager {

  constructor(options = {}) {
    this.options = options;
    this.pendingRequests = {};
    this.contextMapping = {};
  }

  addRequest(requestId, context, cancel) {

    this.log(`adding request \`${requestId}\``);

    if (this.has(requestId)) {
      this.cancelRequest(requestId, `\`cancelRequest(${requestId})\` from \`RequestManager.addRequest\`.
      Found duplicate pending request.`);
    }

    this.addToMapping(requestId, context);
    this.pendingRequests[requestId] = { cancel, context }
  }

  removeRequest(requestId, context) {
    this.log(`removing request \`${requestId}\``);

    this.removeFromMapping(requestId, context);
    delete this.pendingRequests[requestId];
  }

  cancelRequest(requestIdOrContext, reason = `\`cancelRequest(${requestIdOrContext})\` from \`RequestManager.cancelRequest\``) {
    this.log(`cancelling request \`${requestIdOrContext}\``);

    if (this.has(requestIdOrContext) && typeof this.pendingRequests[requestIdOrContext].cancel === 'function') {
      this.pendingRequests[requestIdOrContext].cancel(reason);
      this.removeRequest(requestIdOrContext, this.pendingRequests[requestIdOrContext].context);

      this.log(`request \`${requestIdOrContext}\` cancelled`);
    
    } else if (!!this.contextMapping[requestIdOrContext]) {
      this.cancelContextMapping(requestIdOrContext)
    }
  }

  cancelAllRequests(reason) {
    this.contextMapping = {}
    for (let requestId in this.pendingRequests) {
      let _reason = reason || `\`cancelRequest(${requestId})\` from \`RequestManager.cancelAllRequests\``;
      this.cancelRequest(requestId, _reason);
    }
  }

  cancelContextMapping(context) {
    const contextMap = this.contextMapping[context]
    delete this.contextMapping[context]

    for (let requestId in contextMap) {
      this.cancelRequest(requestId, context)
    }
  }

  has(requestId) {
    return !!this.pendingRequests[requestId];
  }

  log(message) {
    if (this.options.debug === true) {
      console.log(message);
    }
  }

  addToMapping(requestId, context) {
    if (context == undefined)
      return

    if (this.contextMapping[context] == undefined) {
      this.contextMapping[context] = [];
    }
    this.contextMapping[context].push(requestId);
  }

  removeFromMapping(requestId, context) {
    if (context == undefined || this.contextMapping[context] == undefined)
      return

    let index = this.contextMapping[context].indexOf(requestId);
    if (index > -1) {
        this.contextMapping[context].splice(index, 1);
    }
  }
}
