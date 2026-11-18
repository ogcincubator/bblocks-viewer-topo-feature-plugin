const o = {
  properties: ["properties.appellation.label", "properties.appellation", "properties.description", "properties.name"],
  fallback: "id"
};
function c(s, l) {
  const { solidCount: r = 0, openShellCount: t = 0, parcelCount: i = 0, faceCount: n = 0, ringCount: a = 0 } = s, p = r > 0 || t > 0 || i > 0, e = [];
  return p ? (r > 0 && e.push({ source: "solids", kind: "solid", geometry: "solid", label: o, style: { opacity: l.solid } }), e.push({ source: "surfaces", kind: "surface", geometry: "open-shell", label: o, style: { opacity: l.surface } }), e.push({ source: "parcels", kind: "parcel", geometry: "polygon", label: o, style: { opacity: l.parcel } })) : n > 0 ? e.push({ source: "faces", kind: "face", geometry: "face", label: o, style: { opacity: l.face } }) : a > 0 && e.push({ source: "rings", kind: "ring", geometry: "ring", label: o, style: { opacity: l.ring } }), { rules: e };
}
export {
  c as buildDefaultConfig
};
