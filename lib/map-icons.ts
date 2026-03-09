import { Icon, DivIcon } from "leaflet"

// Fix for default markers in React-Leaflet
delete (Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
})

export function createNumberedIcon(
  number: number,
  isStart = false,
  isEnd = false,
): DivIcon {
  let backgroundColor = "#272727"
  const textColor = "white"

  if (isStart) {
    backgroundColor = "#16a34a"
  } else if (isEnd) {
    backgroundColor = "#dc2626"
  }

  return new DivIcon({
    html: `
      <div style="
        background-color: ${backgroundColor};
        color: ${textColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        font-family: Arial, sans-serif;
      ">${number}</div>
    `,
    className: "numbered-marker",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  })
}
