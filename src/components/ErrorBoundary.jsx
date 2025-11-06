import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }
  handleRetry = () => {
    this.setState({ hasError: false, err: null });
    this.props.onRetry?.();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:12, border:'1px solid #e57373', borderRadius:8}}>
          <strong>An error occurred.</strong>
          <pre style={{whiteSpace:'pre-wrap'}}>{String(this.state.err)}</pre>
          <button onClick={this.handleRetry}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}