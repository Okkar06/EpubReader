// Shared namespace + React helpers. Every app script reads from / writes to `window.Books`.
// Components use `htm` (JSX-like tagged templates) so the browser runs them without a build step.
(() => {
  const { useEffect, useState } = React;

  /** Re-runs a Dexie query whenever the underlying tables change (like dexie-react-hooks). */
  function useLiveQuery(querier, deps, defaultValue) {
    const [value, setValue] = useState(defaultValue);
    useEffect(() => {
      const sub = Dexie.liveQuery(querier).subscribe({
        next: (v) => setValue(() => v),
        error: (err) => console.error(err),
      });
      return () => sub.unsubscribe();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
    return value;
  }

  /** Creates (and later revokes) an object URL for a Blob, e.g. a stored cover image. */
  function useObjectUrl(blob) {
    const [url, setUrl] = useState(null);
    useEffect(() => {
      if (!(blob instanceof Blob)) {
        setUrl(null);
        return undefined;
      }
      const next = URL.createObjectURL(blob);
      setUrl(next);
      return () => URL.revokeObjectURL(next);
    }, [blob]);
    return url;
  }

  window.Books = {
    ...React,
    html: htm.bind(React.createElement),
    useLiveQuery,
    useObjectUrl,
  };
})();
