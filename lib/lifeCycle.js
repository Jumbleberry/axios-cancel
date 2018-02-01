export default {
  beforeDestroy() {
    // Cancel all pending get requests from the dying component
    console.log(this._uid + ' is about to be destroyed')
    // Axios.cancelComponentPendingRequests(this._uid)
  }
}
