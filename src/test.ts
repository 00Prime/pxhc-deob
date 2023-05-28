function decode(str) {
  let cache = {};
  let cached = cache[str];
  if (cached) return cached;
  let decoded = "";
  // Convert the string from base64 to ascii
  let converted = atob(str);
  // For each character in the string, XOR it with a character from "pfd5Exm"
  for (let i = 0; i < converted.length; ++i) {
    let xor = "pfd5Exm".charCodeAt(i % 7);
    decoded += String.fromCharCode(xor ^ converted.charCodeAt(i));
  }
  cache[str] = decoded;
  return decoded;
}
function atob(str) {
  return Buffer.from(str, "base64").toString("ascii");
}
console.log(decode("BAMWWCwWDAQD"));

function setProperty(obj, name, value) {
  // If the property already exists, update it.
  if (name in obj) {
    Object.defineProperty(obj, name, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    // Otherwise, create the property.
    obj[name] = value;
  }
  return obj;
}
