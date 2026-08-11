import { useEffect, useState } from "react";
import { properties as fallback } from "../data/properties";
import { propertyApi } from "../services/api";
import type { Property } from "../types";
type Status = "loading" | "ready" | "fallback";
export function useProperties() {
  const [items, setItems] = useState<Property[]>([]),
    [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    let active = true;
    propertyApi
      .list()
      .then((data) => {
        if (active) {
          setItems(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setItems(fallback);
          setStatus("fallback");
        }
      });
    return () => {
      active = false;
    };
  }, []);
  return { properties: items, status };
}
