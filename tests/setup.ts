import "@testing-library/jest-dom/vitest";

/**
 * jsdom ships `FileReader` but not `Blob.prototype.arrayBuffer`, which every
 * browser has had for years and which the intake screen uses to hand a chosen
 * PDF to the reader. This fills the gap in the test environment with a real
 * implementation over jsdom's own `FileReader`, so the product keeps calling
 * the standard API rather than carrying a fallback nobody in a browser needs.
 */
if (typeof Blob !== "undefined" && typeof Blob.prototype.arrayBuffer !== "function") {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(reader.result as ArrayBuffer));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsArrayBuffer(this);
    });
  };
}
