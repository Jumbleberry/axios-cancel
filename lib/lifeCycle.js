export default {
  beforeDestroy() {
    // Cancel all pending requests from the dying component
    this.$http.cancel(this._uid)
  }
}
