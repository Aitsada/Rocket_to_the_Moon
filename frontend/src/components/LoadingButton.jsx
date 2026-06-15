export default function LoadingButton({ loading, children, ...props }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? 'Loading...' : children}
    </button>
  );
}
