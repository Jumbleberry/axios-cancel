export default class RequestManager {

  constructor(options = {}) {
    this.options = options;
    this.pendingRequests = {};
    this.contextMapping = {};
  }

  addRequest(requestId, context, cancelFn) {

    this.log(`adding request \`${requestId}\``);

    if (this.has(requestId)) {
      this.cancelRequest(requestId, `\`cancelRequest(${requestId})\` from \`RequestManager.addRequest\`.
      Found duplicate pending request.`);
    }

    this.addToMapping(requestId, context);
    this.pendingRequests[requestId] = cancelFn;
  }

  removeRequest(requestId, context) {
    this.log(`removing request \`${requestId}\``);

    this.removeFromMapping(requestId, context);
    delete this.pendingRequests[requestId];
  }

  cancelRequest(requestId, context, reason = `\`cancelRequest(${requestId})\` from \`RequestManager.cancelRequest\``) {
    this.log(`cancelling request \`${requestId}\``);

    if (this.has(requestId)
    && typeof this.pendingRequests[requestId] === 'function') {
      this.pendingRequests[requestId](reason);
      this.removeRequest(requestId, context);

      this.log(`request \`${requestId}\` cancelled`);
    }
  }

  cancelAllRequests(reason) {
    for (let context in this.contextMapping) {
      for (let requestId in this.contextMapping[context]) {
        let _reason = reason || `\`cancelRequest(${requestId})\` from \`RequestManager.cancelAllRequests\``;
        this.cancelRequest(requestId, context, _reason);
      }
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

  getPendingRequests() {
    return this.pendingRequests;
  }

  getContextMapping() {
    return this.contextMapping;
  }

  addToMapping(requestId, context) {
    if (this.contextMapping[context] == undefined) {
      this.contextMapping[context] = [];
    }
    this.contextMapping[context].push(requestId);
  }

  removeFromMapping(requestId, context) {
    if (this.contextMapping[context] == undefined) {
      return
    }
    let index = this.contextMapping[context].indexOf(requestId);
    if (index > -1) {
        this.contextMapping[context].splice(index, 1);
    }
  }
}
