import type { MetadataRoute } from "next";

import { PRODUCT_DESCRIPTION, PRODUCT_MARK, PRODUCT_NAME } from "@/shared/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description: PRODUCT_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: "#F6F1E7",
    theme_color: "#123B5D",
    icons: [
      { src: PRODUCT_MARK, sizes: "1145x1374", type: "image/png" },
    ],
  };
}
