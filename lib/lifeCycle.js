export default {
  beforeDestroy() {
    // Cancel all pending requests from the dying component
    // Checks that vue has an axios version injected
    if (this.hasOwnProperty('$http')) {
      this.$http.cancel(this._uid);
    }
  }
};
