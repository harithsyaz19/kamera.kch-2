import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * AuthImage fetches a file from the backend with auth credentials and renders it.
 * Used for IC photos and payment receipts stored in object storage.
 */
export const AuthImage = ({ path, alt, className, ...rest }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!path) {
      setBlobUrl(null);
      return undefined;
    }

    let currentUrl = null;
    let cancelled = false;

    const load = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/files/${path}`, {
          withCredentials: true,
          responseType: 'blob',
        });
        if (cancelled) return;
        currentUrl = URL.createObjectURL(response.data);
        setBlobUrl(currentUrl);
      } catch (e) {
        if (!cancelled) setError(true);
      }
    };

    load();

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [path]);

  if (error) {
    return (
      <div className={`bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 p-4 ${className || ''}`} {...rest}>
        Image unavailable
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className={`bg-neutral-100 animate-pulse ${className || ''}`} style={{ minHeight: 120 }} {...rest} />
    );
  }

  return <img src={blobUrl} alt={alt} className={className} {...rest} />;
};
