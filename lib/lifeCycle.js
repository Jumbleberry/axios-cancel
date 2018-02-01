import Axios from 'axios';

export default {
  beforeDestroy() {
    // Cancel all pending requests from the dying component
    Axios.cancelComponentPendingRequests(this._uid)
  }
}
