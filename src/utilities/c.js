export function c(classes) {
  return Object.entries(classes)
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(" ");
}
